package com.interviewplatform.backend.candidate.service;

import com.interviewplatform.backend.bot.repository.AIInterviewRepository;
import com.interviewplatform.backend.candidate.dto.dashboard.*;
import com.interviewplatform.backend.candidate.dto.practice.PracticeQuestionResponse;
import com.interviewplatform.backend.interview.model.InterviewScore;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.repository.InterviewScoreRepository;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class CandidateDashboardService {

    // User Service
    private final UserService userService;

    // Practice Question Service
    private final PracticeQuestionService practiceQuestionService;

    // Question Submission Service
    private final QuestionSubmissionService questionSubmissionService;

    private final InterviewRepository interviewRepository;

    private final InterviewScoreRepository interviewScoreRepository;

    private final AIInterviewRepository aiInterviewRepository;

    // Constructors
    @Autowired
    public CandidateDashboardService(
            UserService userService,
            PracticeQuestionService practiceQuestionService,
            QuestionSubmissionService questionSubmissionService,
            @Autowired(required = false) InterviewRepository interviewRepository,
            @Autowired(required = false) InterviewScoreRepository interviewScoreRepository,
            @Autowired(required = false) AIInterviewRepository aiInterviewRepository
    ) {
        this.userService = userService;
        this.practiceQuestionService = practiceQuestionService;
        this.questionSubmissionService = questionSubmissionService;
        this.interviewRepository = interviewRepository;
        this.interviewScoreRepository = interviewScoreRepository;
        this.aiInterviewRepository = aiInterviewRepository;
    }

    public CandidateDashboardService(
            UserService userService,
            PracticeQuestionService practiceQuestionService,
            QuestionSubmissionService questionSubmissionService
    ) {
        this(userService, practiceQuestionService, questionSubmissionService, null, null, null);
    }

    // Dashboard
    public DashboardResponse getDashboard() {

        User user = userService.getLoggedInUser();
        if (user == null) {
            return new DashboardResponse();
        }

        final String userId = user.getId();

        // 1. Parallel independent queries to Atlas
        CompletableFuture<QuestionSubmissionService.UserSubmissionStats> statsFuture =
                CompletableFuture.supplyAsync(() -> {
                    try {
                        return questionSubmissionService.getUserSubmissionStats(userId);
                    } catch (Exception e) {
                        return null;
                    }
                });

        CompletableFuture<List<com.interviewplatform.backend.bot.entity.Interview>> mockInterviewsFuture =
                CompletableFuture.supplyAsync(() -> getMockInterviewsSummary(userId));

        CompletableFuture<Integer> realInterviewsFuture =
                CompletableFuture.supplyAsync(() -> {
                    if (interviewRepository == null) return 0;
                    try {
                        return interviewRepository
                                .findByCandidateIdAndStatusOrderByCreatedAtDesc(userId, "COMPLETED")
                                .size();
                    } catch (Exception e) {
                        return 0;
                    }
                });

        CompletableFuture<Double> realScoreFuture =
                CompletableFuture.supplyAsync(() -> {
                    if (interviewScoreRepository == null) return null;
                    try {
                        List<InterviewScore> scoresReceived = interviewScoreRepository
                                .findByRecipientUserIdAndScorerRoleOrderByCreatedAtDesc(userId, "INTERVIEWER");

                        if (scoresReceived != null && !scoresReceived.isEmpty()) {
                            double avg = scoresReceived.stream()
                                    .mapToInt(InterviewScore::getScore)
                                    .average()
                                    .orElse(0.0);
                            return Math.round(avg * 10.0) / 10.0;
                        }
                    } catch (Exception ignored) {}
                    return null;
                });

        // Wait for independent futures to complete concurrently
        CompletableFuture.allOf(statsFuture, mockInterviewsFuture, realInterviewsFuture, realScoreFuture).join();

        // Consolidated submission stats (single DB query)
        QuestionSubmissionService.UserSubmissionStats subStats = statsFuture.join();
        long solvedQuestions = 0;
        long codingTimeSeconds = 0;
        Set<String> solvedQuestionIds = Collections.emptySet();

        if (subStats != null && (subStats.getSolvedCount() > 0 || subStats.getTotalCodingTimeSeconds() > 0 || !subStats.getSolvedQuestionIds().isEmpty())) {
            solvedQuestions = subStats.getSolvedCount();
            codingTimeSeconds = subStats.getTotalCodingTimeSeconds();
            solvedQuestionIds = subStats.getSolvedQuestionIds();
        } else {
            // Fallback for mocked unit test environments
            solvedQuestions = questionSubmissionService.getSolvedCount(userId);
            codingTimeSeconds = questionSubmissionService.getTotalCodingTimeSeconds(userId);
            solvedQuestionIds = questionSubmissionService.getSolvedQuestionIds(userId);
        }

        int totalCompletedRealInterviews = realInterviewsFuture.join();
        List<com.interviewplatform.backend.bot.entity.Interview> userMockInterviews = mockInterviewsFuture.join();
        int totalCompletedMockInterviews = userMockInterviews.size();
        Double averageRealInterviewScore = realScoreFuture.join();

        // Readiness Score: from latest completed evaluation if present, otherwise 0 for new users
        int readinessScore = 0;
        if (!userMockInterviews.isEmpty() && userMockInterviews.get(0).getEvaluation() != null) {
            readinessScore = userMockInterviews.get(0).getEvaluation().getOverallScore();
        }

        DashboardResponse response = new DashboardResponse();

        // User
        DashboardUserResponse dashboardUser = new DashboardUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getTitle(),
                user.getLocation(),
                user.getAvatar(),
                user.getAbout(),
                readinessScore
        );

        response.setUser(dashboardUser);

        // Filter mock interviews with valid evaluation
        List<com.interviewplatform.backend.bot.entity.Interview> evaluatedMockInterviews = userMockInterviews.stream()
                .filter(i -> i.getEvaluation() != null)
                .collect(Collectors.toList());

        // Weekly Improvement: difference between latest and previous evaluated score if >= 2 sessions exist, else 0
        int weeklyImprovement = 0;
        if (evaluatedMockInterviews.size() >= 2) {
            weeklyImprovement = evaluatedMockInterviews.get(0).getEvaluation().getOverallScore()
                    - evaluatedMockInterviews.get(1).getEvaluation().getOverallScore();
        }

        // Stats: mockSessions is the actual completed mock count (0 if none)
        DashboardStatsResponse stats = new DashboardStatsResponse(
                (int) solvedQuestions,
                codingTimeSeconds,
                totalCompletedMockInterviews,
                weeklyImprovement,
                totalCompletedRealInterviews,
                totalCompletedMockInterviews,
                averageRealInterviewScore
        );

        response.setStats(stats);
        response.setTotalCompletedRealInterviews(totalCompletedRealInterviews);
        response.setTotalCompletedMockInterviews(totalCompletedMockInterviews);
        response.setAverageRealInterviewScore(averageRealInterviewScore);

        // Skill Breakdown
        response.setSkillBreakdown(getSkillBreakdown(evaluatedMockInterviews));

        // Progress History
        response.setProgressHistory(getReadinessChart(evaluatedMockInterviews));

        // Practice Questions (dashboard preview limited to 50 questions)
        List<PracticeQuestionResponse> questions = Collections.emptyList();
        if (practiceQuestionService != null) {
            try {
                questions = practiceQuestionService.getDashboardPracticeQuestions(solvedQuestionIds);
            } catch (Exception ignored) {}
            if (questions == null || questions.isEmpty()) {
                questions = practiceQuestionService.getPracticeQuestions(null);
            }
        }

        response.setPracticeQuestions(questions != null ? questions : Collections.emptyList());

        // Mock Sessions
        response.setMockSessions(getSessions(userMockInterviews));

        // Last Mock Result
        if (!evaluatedMockInterviews.isEmpty()) {
            com.interviewplatform.backend.bot.entity.Interview latest = evaluatedMockInterviews.get(0);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy").withZone(ZoneId.systemDefault());
            RecentSessionResponse lastMock = new RecentSessionResponse();
            lastMock.setTitle(latest.getRole() != null && !latest.getRole().isBlank() ? latest.getRole() : "Mock Interview");
            lastMock.setDate(latest.getCreatedAt() != null ? formatter.format(latest.getCreatedAt()) : "Recent");
            lastMock.setStatus("COMPLETED");
            lastMock.setScore(latest.getEvaluation().getOverallScore());
            response.setLastMockResult(lastMock);
        } else {
            response.setLastMockResult(new RecentSessionResponse());
        }

        // Empty Lists
        response.setRooms(new ArrayList<>());
        response.setExperience(new ArrayList<>());

        // Dynamic Skills
        response.setSkills(user.getSkills());

        // Dynamic Targets
        response.setTargets(user.getTargets());

        return response;
    }

    // Helper to retrieve mock interviews with fallback
    private List<com.interviewplatform.backend.bot.entity.Interview> getMockInterviewsSummary(String userId) {
        if (aiInterviewRepository == null) return Collections.emptyList();
        try {
            List<com.interviewplatform.backend.bot.entity.Interview> list =
                    aiInterviewRepository.findSummaryByUserIdOrderByCreatedAtDesc(userId);
            if (list != null && !list.isEmpty()) {
                return list;
            }
        } catch (Exception ignored) {}
        try {
            List<com.interviewplatform.backend.bot.entity.Interview> list =
                    aiInterviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
            return list != null ? list : Collections.emptyList();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    // Readiness Chart
    public List<ReadinessPoint> getReadinessChart() {
        User user = userService.getLoggedInUser();
        if (aiInterviewRepository == null || user == null) {
            return Collections.emptyList();
        }
        List<com.interviewplatform.backend.bot.entity.Interview> userInterviews =
                getMockInterviewsSummary(user.getId());
        List<com.interviewplatform.backend.bot.entity.Interview> evaluated = userInterviews.stream()
                .filter(i -> i.getEvaluation() != null)
                .collect(Collectors.toList());
        return getReadinessChart(evaluated);
    }

    private List<ReadinessPoint> getReadinessChart(List<com.interviewplatform.backend.bot.entity.Interview> evaluated) {
        List<ReadinessPoint> readiness = new ArrayList<>();
        List<com.interviewplatform.backend.bot.entity.Interview> chronological = new ArrayList<>(evaluated);
        Collections.reverse(chronological);
        int idx = 1;
        for (com.interviewplatform.backend.bot.entity.Interview interview : chronological) {
            readiness.add(new ReadinessPoint("Mock " + idx++, interview.getEvaluation().getOverallScore()));
        }
        return readiness;
    }

    // Skill Breakdown
    public SkillBreakdownResponse getSkillBreakdown() {
        User user = userService.getLoggedInUser();
        if (aiInterviewRepository == null || user == null) {
            return new SkillBreakdownResponse(0, 0, 0, 0, 0);
        }
        List<com.interviewplatform.backend.bot.entity.Interview> userInterviews =
                getMockInterviewsSummary(user.getId());
        List<com.interviewplatform.backend.bot.entity.Interview> evaluated = userInterviews.stream()
                .filter(i -> i.getEvaluation() != null)
                .collect(Collectors.toList());
        return getSkillBreakdown(evaluated);
    }

    private SkillBreakdownResponse getSkillBreakdown(List<com.interviewplatform.backend.bot.entity.Interview> evaluated) {
        if (evaluated.isEmpty()) {
            return new SkillBreakdownResponse(0, 0, 0, 0, 0);
        }
        double avgConf = evaluated.stream().mapToInt(i -> i.getEvaluation().getConfidenceScore()).average().orElse(0.0);
        double avgTech = evaluated.stream().mapToInt(i -> i.getEvaluation().getTechnicalScore()).average().orElse(0.0);
        double avgRead = evaluated.stream().mapToInt(i -> i.getEvaluation().getOverallScore()).average().orElse(0.0);
        double avgProb = evaluated.stream().mapToInt(i -> i.getEvaluation().getProblemSolvingScore()).average().orElse(0.0);
        double avgComm = evaluated.stream().mapToInt(i -> i.getEvaluation().getCommunicationScore()).average().orElse(0.0);

        return new SkillBreakdownResponse(
                (int) Math.round(avgConf),
                (int) Math.round(avgTech),
                (int) Math.round(avgRead),
                (int) Math.round(avgProb),
                (int) Math.round(avgComm)
        );
    }

    // Sessions
    public List<SessionResponse> getSessions() {
        User user = userService.getLoggedInUser();
        if (aiInterviewRepository == null || user == null) {
            return Collections.emptyList();
        }
        List<com.interviewplatform.backend.bot.entity.Interview> userInterviews =
                getMockInterviewsSummary(user.getId());
        return getSessions(userInterviews);
    }

    private List<SessionResponse> getSessions(List<com.interviewplatform.backend.bot.entity.Interview> userInterviews) {
        List<SessionResponse> sessions = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy").withZone(ZoneId.systemDefault());
        for (com.interviewplatform.backend.bot.entity.Interview i : userInterviews) {
            String title = (i.getRole() != null && !i.getRole().isBlank()) ? i.getRole() : "Mock Interview";
            String date = i.getCreatedAt() != null ? formatter.format(i.getCreatedAt()) : "Recent";
            String duration = (i.getDifficulty() != null && !i.getDifficulty().isBlank()) ? i.getDifficulty() : "Standard";
            Integer score = i.getEvaluation() != null ? i.getEvaluation().getOverallScore() : null;
            String status = i.getEvaluation() != null ? "COMPLETED" : "IN_PROGRESS";
            sessions.add(new SessionResponse(title, date, duration, score, status));
        }
        return sessions;
    }
}