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

import java.util.ArrayList;
import java.util.List;

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

        // Solved Questions
        long solvedQuestions =
                questionSubmissionService.getSolvedCount(user.getId());

        // Coding Time
        long codingTimeSeconds =
                questionSubmissionService.getTotalCodingTimeSeconds(user.getId());

        // Total Completed Real Interviews
        int totalCompletedRealInterviews = 0;
        if (interviewRepository != null) {
            totalCompletedRealInterviews = interviewRepository
                    .findByCandidateIdAndStatusOrderByCreatedAtDesc(user.getId(), "COMPLETED")
                    .size();
        }

        // Total Completed Mock Interviews
        int totalCompletedMockInterviews = 0;
        if (aiInterviewRepository != null) {
            totalCompletedMockInterviews = aiInterviewRepository
                    .findByUserIdOrderByCreatedAtDesc(user.getId())
                    .size();
        }

        // Real Interview Average Score (ONLY interviewer -> candidate scores for completed interviews)
        Double averageRealInterviewScore = null;
        if (interviewScoreRepository != null) {
            List<InterviewScore> scoresReceived = interviewScoreRepository
                    .findByRecipientUserIdAndScorerRoleOrderByCreatedAtDesc(user.getId(), "INTERVIEWER");

            if (!scoresReceived.isEmpty()) {
                double avg = scoresReceived.stream()
                        .mapToInt(InterviewScore::getScore)
                        .average()
                        .orElse(0.0);
                averageRealInterviewScore = Math.round(avg * 10.0) / 10.0;
            }
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
                user.getReadinessScore()
        );

        response.setUser(dashboardUser);

        // Stats
        int mockSessionsDisplay = totalCompletedMockInterviews > 0 ? totalCompletedMockInterviews : 9;
        DashboardStatsResponse stats = new DashboardStatsResponse(
                (int) solvedQuestions,
                codingTimeSeconds,
                mockSessionsDisplay,
                12,
                totalCompletedRealInterviews,
                totalCompletedMockInterviews,
                averageRealInterviewScore
        );

        response.setStats(stats);
        response.setTotalCompletedRealInterviews(totalCompletedRealInterviews);
        response.setTotalCompletedMockInterviews(totalCompletedMockInterviews);
        response.setAverageRealInterviewScore(averageRealInterviewScore);

        // Skill Breakdown
        response.setSkillBreakdown(getSkillBreakdown());

        // Progress History
        response.setProgressHistory(getReadinessChart());

        // Practice Questions
        List<PracticeQuestionResponse> questions =
                practiceQuestionService.getPracticeQuestions(null);

        response.setPracticeQuestions(questions);

        // Mock Sessions
        response.setMockSessions(getSessions());

        // Last Mock Result
        response.setLastMockResult(new RecentSessionResponse());

        // Empty Lists
        response.setRooms(new ArrayList<>());
        response.setExperience(new ArrayList<>());

        // Dynamic Skills
        response.setSkills(user.getSkills());

        // Dynamic Targets
        response.setTargets(user.getTargets());

        return response;
    }

    // Readiness Chart
    public List<ReadinessPoint> getReadinessChart() {

        List<ReadinessPoint> readiness = new ArrayList<>();

        readiness.add(new ReadinessPoint("Mock 1", 55));
        readiness.add(new ReadinessPoint("Mock 2", 61));
        readiness.add(new ReadinessPoint("Mock 3", 67));
        readiness.add(new ReadinessPoint("Mock 4", 63));
        readiness.add(new ReadinessPoint("Mock 5", 74));
        readiness.add(new ReadinessPoint("Mock 6", 81));
        readiness.add(new ReadinessPoint("Mock 7", 79));
        readiness.add(new ReadinessPoint("Mock 8", 88));

        return readiness;
    }

    // Skill Breakdown
    public SkillBreakdownResponse getSkillBreakdown() {

        SkillBreakdownResponse response = new SkillBreakdownResponse();

        response.setConfidence(72);
        response.setTechnical(58);
        response.setReadiness(84);
        response.setProblemSolving(90);
        response.setCommunication(78);

        return response;
    }

    // Sessions
    public List<SessionResponse> getSessions() {

        List<SessionResponse> sessions = new ArrayList<>();

        sessions.add(new SessionResponse(
                "Technical Round",
                "Jun 12, 2026",
                "45 min",
                82,
                "COMPLETED"
        ));

        sessions.add(new SessionResponse(
                "Behavioral Round",
                "Jun 10, 2026",
                "30 min",
                76,
                "COMPLETED"
        ));

        sessions.add(new SessionResponse(
                "System Design",
                "Jun 18, 2026",
                "60 min",
                null,
                "SCHEDULED"
        ));

        return sessions;
    }
}