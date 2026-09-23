package com.interviewplatform.backend.candidate.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewplatform.backend.bot.entity.Interview;
import com.interviewplatform.backend.bot.repository.AIInterviewRepository;
import com.interviewplatform.backend.candidate.dto.dashboard.DashboardResponse;
import com.interviewplatform.backend.candidate.dto.practice.PracticeQuestionResponse;
import com.interviewplatform.backend.interview.model.InterviewScore;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.repository.InterviewScoreRepository;
import com.interviewplatform.backend.model.Question;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.QuestionRepository;
import com.interviewplatform.backend.repository.UserRepository;
import org.bson.Document;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Disabled("Live-network performance benchmark against MongoDB Atlas cluster; enable on-demand for performance diagnostics")
@SpringBootTest
public class CandidateDashboardProfilingTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private AIInterviewRepository aiInterviewRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private InterviewScoreRepository interviewScoreRepository;

    @Autowired
    private QuestionSubmissionService questionSubmissionService;

    @Autowired
    private PracticeQuestionService practiceQuestionService;

    @Autowired
    private CandidateDashboardService candidateDashboardService;

    @Test
    void runComprehensiveProfiling() throws Exception {
        System.out.println("==================================================");
        System.out.println("CANDIDATE DASHBOARD PROFILING - POST-OPTIMIZATION");
        System.out.println("==================================================");

        // 1. Verify Collection Indexes
        System.out.println("\n--- VERIFYING COLLECTION INDEXES ---");
        for (String collName : List.of("users", "interviews", "questions", "interview_scores", "question_submissions")) {
            System.out.println("Collection: " + collName);
            for (Document idx : mongoTemplate.getCollection(collName).listIndexes()) {
                System.out.println("   Index: " + idx.toJson());
            }
        }

        // 2. Candidate lookup & Security Context setup
        List<User> users = userRepository.findAll();
        User candidate = users.stream()
                .filter(u -> "CANDIDATE".equalsIgnoreCase(u.getRole()))
                .findFirst()
                .orElse(users.isEmpty() ? null : users.get(0));

        if (candidate == null) {
            System.out.println("No candidate found in database!");
            return;
        }

        String userId = candidate.getId();
        System.out.println("\nTarget Candidate: " + candidate.getEmail() + " (ID: " + userId + ")");

        // Set security context so userService.getLoggedInUser() works
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(candidate.getEmail(), null, List.of())
        );

        // 3. Measure optimized components
        System.out.println("\n--- OPTIMIZED COMPONENT TIMINGS (ms) ---");

        // A. Single consolidated submission stats query
        long tSub0 = System.currentTimeMillis();
        QuestionSubmissionService.UserSubmissionStats subStats =
                questionSubmissionService.getUserSubmissionStats(userId);
        long tSub1 = System.currentTimeMillis();
        System.out.println("A. Consolidated getUserSubmissionStats: " + (tSub1 - tSub0) + " ms"
                + " (solved: " + subStats.getSolvedCount()
                + ", codingTime: " + subStats.getTotalCodingTimeSeconds() + "s"
                + ", solvedIds: " + subStats.getSolvedQuestionIds().size() + ")");

        // B. Lightweight summary mock interviews query
        long tMock0 = System.currentTimeMillis();
        List<Interview> summaryMocks =
                aiInterviewRepository.findSummaryByUserIdOrderByCreatedAtDesc(userId);
        long tMock1 = System.currentTimeMillis();
        System.out.println("B. Lightweight findSummaryByUserIdOrderByCreatedAtDesc: " + (tMock1 - tMock0) + " ms"
                + " (count: " + summaryMocks.size() + ")");

        // C. Bounded practice questions query (50 items)
        long tQ50_0 = System.currentTimeMillis();
        List<Question> top50 = questionRepository.findSummary(PageRequest.of(0, 50));
        long tQ50_1 = System.currentTimeMillis();
        System.out.println("C. Bounded findSummary(50): " + (tQ50_1 - tQ50_0) + " ms"
                + " (count: " + top50.size() + ")");

        // D. Practice questions service with limit & precomputed solved IDs
        long tPq0 = System.currentTimeMillis();
        List<PracticeQuestionResponse> pqList =
                practiceQuestionService.getPracticeQuestions(null, 50, subStats.getSolvedQuestionIds());
        long tPq1 = System.currentTimeMillis();
        System.out.println("D. practiceQuestionService.getPracticeQuestions(null, 50, ids): " + (tPq1 - tPq0) + " ms"
                + " (count: " + pqList.size() + ")");

        // 4. Measure end-to-end Dashboard Service call (parallel + optimized)
        System.out.println("\n--- END-TO-END DASHBOARD EXECUTION ---");
        // Warm up
        candidateDashboardService.getDashboard();

        long startDashboard = System.currentTimeMillis();
        DashboardResponse dashboard = candidateDashboardService.getDashboard();
        long endDashboard = System.currentTimeMillis();
        long totalDashboardTime = endDashboard - startDashboard;

        System.out.println("Total candidateDashboardService.getDashboard() Time: " + totalDashboardTime + " ms");

        // 5. Measure Payload Sizes
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();

        byte[] totalPayloadBytes = mapper.writeValueAsBytes(dashboard);
        byte[] questionsPayloadBytes = mapper.writeValueAsBytes(dashboard.getPracticeQuestions());

        System.out.println("\n--- PAYLOAD SIZE COMPARISON ---");
        System.out.println("Optimized Total Dashboard JSON Size: " + totalPayloadBytes.length + " bytes (~" + (totalPayloadBytes.length / 1024) + " KB)");
        System.out.println("Optimized Practice Questions JSON Size: " + questionsPayloadBytes.length + " bytes (~" + (questionsPayloadBytes.length / 1024) + " KB)");

        // 6. Assertions for dynamic data preservation
        assertNotNull(dashboard);
        assertNotNull(dashboard.getUser());
        assertNotNull(dashboard.getStats());
        assertNotNull(dashboard.getSkillBreakdown());
        assertNotNull(dashboard.getProgressHistory());
        assertNotNull(dashboard.getPracticeQuestions());

        System.out.println("\n--- VERIFIED DYNAMIC VALUES ---");
        System.out.println("Candidate: " + dashboard.getUser().getName() + " (" + dashboard.getUser().getEmail() + ")");
        System.out.println("Readiness Score: " + dashboard.getUser().getReadinessScore());
        System.out.println("Questions Solved: " + dashboard.getStats().getQuestionsSolved());
        System.out.println("Coding Time (s): " + dashboard.getStats().getCodingTimeSeconds());
        System.out.println("Mock Sessions: " + dashboard.getStats().getMockSessions());
        System.out.println("Real Interviews: " + dashboard.getStats().getTotalCompletedRealInterviews());
        System.out.println("Real Score: " + dashboard.getStats().getAverageRealInterviewScore());
        System.out.println("Skill Breakdown: Confidence=" + dashboard.getSkillBreakdown().getConfidence()
                + ", Tech=" + dashboard.getSkillBreakdown().getTechnical()
                + ", Readiness=" + dashboard.getSkillBreakdown().getReadiness()
                + ", ProblemSolving=" + dashboard.getSkillBreakdown().getProblemSolving()
                + ", Comm=" + dashboard.getSkillBreakdown().getCommunication());
        System.out.println("Progress History points: " + dashboard.getProgressHistory().size());
        System.out.println("Practice Questions in preview: " + dashboard.getPracticeQuestions().size());
        System.out.println("==================================================");
    }
}
