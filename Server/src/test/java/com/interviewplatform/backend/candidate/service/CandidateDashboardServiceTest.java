package com.interviewplatform.backend.candidate.service;

import com.interviewplatform.backend.bot.entity.Interview;
import com.interviewplatform.backend.bot.repository.AIInterviewRepository;
import com.interviewplatform.backend.candidate.dto.dashboard.DashboardResponse;
import com.interviewplatform.backend.candidate.dto.dashboard.ReadinessPoint;
import com.interviewplatform.backend.candidate.dto.dashboard.SessionResponse;
import com.interviewplatform.backend.candidate.dto.dashboard.SkillBreakdownResponse;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.repository.InterviewScoreRepository;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CandidateDashboardServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private PracticeQuestionService practiceQuestionService;

    @Mock
    private QuestionSubmissionService questionSubmissionService;

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private InterviewScoreRepository interviewScoreRepository;

    @Mock
    private AIInterviewRepository aiInterviewRepository;

    private CandidateDashboardService dashboardService;

    private User newUser;

    @BeforeEach
    void setUp() {
        dashboardService = new CandidateDashboardService(
                userService,
                practiceQuestionService,
                questionSubmissionService,
                interviewRepository,
                interviewScoreRepository,
                aiInterviewRepository
        );

        newUser = new User();
        newUser.setId("user-new-1");
        newUser.setName("New Candidate");
        newUser.setEmail("new@candidate.com");
        newUser.setRole("candidate");
    }

    @Test
    void testNewCandidate_ZeroActivity_NoFakeValues() {
        when(userService.getLoggedInUser()).thenReturn(newUser);
        when(questionSubmissionService.getSolvedCount("user-new-1")).thenReturn(0L);
        when(questionSubmissionService.getTotalCodingTimeSeconds("user-new-1")).thenReturn(0L);
        when(interviewRepository.findByCandidateIdAndStatusOrderByCreatedAtDesc("user-new-1", "COMPLETED"))
                .thenReturn(Collections.emptyList());
        when(aiInterviewRepository.findByUserIdOrderByCreatedAtDesc("user-new-1"))
                .thenReturn(Collections.emptyList());
        when(interviewScoreRepository.findByRecipientUserIdAndScorerRoleOrderByCreatedAtDesc("user-new-1", "INTERVIEWER"))
                .thenReturn(Collections.emptyList());
        when(practiceQuestionService.getPracticeQuestions(null)).thenReturn(Collections.emptyList());

        DashboardResponse dashboard = dashboardService.getDashboard();

        assertNotNull(dashboard);
        // User readiness score must be 0 for new user, never hardcoded 88
        assertEquals(0, dashboard.getUser().getReadinessScore());

        // Stats: mockSessions must be 0, never hardcoded 9
        assertEquals(0, dashboard.getStats().getMockSessions());
        assertEquals(0, dashboard.getStats().getTotalCompletedMockInterviews());
        assertEquals(0, dashboard.getStats().getQuestionsSolved());
        assertEquals(0L, dashboard.getStats().getCodingTimeSeconds());
        // Weekly improvement must be 0, never hardcoded 12
        assertEquals(0, dashboard.getStats().getWeeklyImprovement());
        assertNull(dashboard.getStats().getAverageRealInterviewScore());

        // Progress History must be empty, never hardcoded 8 fake points
        assertNotNull(dashboard.getProgressHistory());
        assertTrue(dashboard.getProgressHistory().isEmpty());

        // Skill Breakdown must be all 0s, never hardcoded 72, 58, 84, 90, 78
        SkillBreakdownResponse skills = dashboard.getSkillBreakdown();
        assertNotNull(skills);
        assertEquals(0, skills.getConfidence());
        assertEquals(0, skills.getTechnical());
        assertEquals(0, skills.getReadiness());
        assertEquals(0, skills.getProblemSolving());
        assertEquals(0, skills.getCommunication());

        // Mock sessions list must be empty, never hardcoded June 2026 sessions
        assertNotNull(dashboard.getMockSessions());
        assertTrue(dashboard.getMockSessions().isEmpty());
    }

    @Test
    void testCandidate_WithMockInterviews_DynamicValues() {
        when(userService.getLoggedInUser()).thenReturn(newUser);
        when(questionSubmissionService.getSolvedCount("user-new-1")).thenReturn(3L);
        when(questionSubmissionService.getTotalCodingTimeSeconds("user-new-1")).thenReturn(1200L);
        when(interviewRepository.findByCandidateIdAndStatusOrderByCreatedAtDesc("user-new-1", "COMPLETED"))
                .thenReturn(Collections.emptyList());

        // Create 2 mock interviews:
        // interview1 (older): score 80
        Interview interview1 = new Interview();
        interview1.setId("mock-1");
        interview1.setUserId("user-new-1");
        interview1.setRole("Backend Developer");
        interview1.setDifficulty("Medium");
        interview1.setCreatedAt(Instant.now().minusSeconds(86400 * 2));
        Interview.Evaluation eval1 = new Interview.Evaluation();
        eval1.setOverallScore(80);
        eval1.setTechnicalScore(75);
        eval1.setCommunicationScore(85);
        eval1.setProblemSolvingScore(80);
        eval1.setConfidenceScore(70);
        interview1.setEvaluation(eval1);

        // interview2 (newer / latest): score 90
        Interview interview2 = new Interview();
        interview2.setId("mock-2");
        interview2.setUserId("user-new-1");
        interview2.setRole("Full Stack Developer");
        interview2.setDifficulty("Hard");
        interview2.setCreatedAt(Instant.now().minusSeconds(86400));
        Interview.Evaluation eval2 = new Interview.Evaluation();
        eval2.setOverallScore(90);
        eval2.setTechnicalScore(85);
        eval2.setCommunicationScore(95);
        eval2.setProblemSolvingScore(90);
        eval2.setConfidenceScore(80);
        interview2.setEvaluation(eval2);

        // findByUserIdOrderByCreatedAtDesc returns newest first: [interview2, interview1]
        when(aiInterviewRepository.findByUserIdOrderByCreatedAtDesc("user-new-1"))
                .thenReturn(List.of(interview2, interview1));

        DashboardResponse dashboard = dashboardService.getDashboard();

        assertNotNull(dashboard);
        // Readiness score takes latest interview score
        assertEquals(90, dashboard.getUser().getReadinessScore());

        // Stats reflect real data
        assertEquals(2, dashboard.getStats().getMockSessions());
        assertEquals(2, dashboard.getStats().getTotalCompletedMockInterviews());
        assertEquals(3, dashboard.getStats().getQuestionsSolved());
        assertEquals(1200L, dashboard.getStats().getCodingTimeSeconds());
        // Weekly improvement: latest (90) - previous (80) = 10
        assertEquals(10, dashboard.getStats().getWeeklyImprovement());

        // Progress history: chronological [Mock 1: 80, Mock 2: 90]
        List<ReadinessPoint> history = dashboard.getProgressHistory();
        assertEquals(2, history.size());
        assertEquals("Mock 1", history.get(0).getWeek());
        assertEquals(80, history.get(0).getScore());
        assertEquals("Mock 2", history.get(1).getWeek());
        assertEquals(90, history.get(1).getScore());

        // Skill breakdown averages: (75+85)/2 = 80, (85+95)/2 = 90, (80+90)/2 = 85, (70+80)/2 = 75
        SkillBreakdownResponse skills = dashboard.getSkillBreakdown();
        assertEquals(75, skills.getConfidence());
        assertEquals(80, skills.getTechnical());
        assertEquals(85, skills.getReadiness());
        assertEquals(85, skills.getProblemSolving());
        assertEquals(90, skills.getCommunication());

        // Mock sessions list contains the 2 real interviews
        List<SessionResponse> sessions = dashboard.getMockSessions();
        assertEquals(2, sessions.size());
        assertEquals("Full Stack Developer", sessions.get(0).getTitle());
        assertEquals(90, sessions.get(0).getScore());
        assertEquals("Backend Developer", sessions.get(1).getTitle());
        assertEquals(80, sessions.get(1).getScore());

        // Last mock result reflects latest interview
        assertEquals(90, dashboard.getLastMockResult().getScore());
        assertEquals("Full Stack Developer", dashboard.getLastMockResult().getTitle());
    }

    @Test
    void testDirectApiMethods_EmptyWhenNoInterviews() {
        when(userService.getLoggedInUser()).thenReturn(newUser);
        when(aiInterviewRepository.findByUserIdOrderByCreatedAtDesc("user-new-1"))
                .thenReturn(Collections.emptyList());

        List<ReadinessPoint> chart = dashboardService.getReadinessChart();
        assertTrue(chart.isEmpty());

        SkillBreakdownResponse skills = dashboardService.getSkillBreakdown();
        assertEquals(0, skills.getConfidence());
        assertEquals(0, skills.getTechnical());
        assertEquals(0, skills.getReadiness());
        assertEquals(0, skills.getProblemSolving());
        assertEquals(0, skills.getCommunication());

        List<SessionResponse> sessions = dashboardService.getSessions();
        assertTrue(sessions.isEmpty());
    }
}
