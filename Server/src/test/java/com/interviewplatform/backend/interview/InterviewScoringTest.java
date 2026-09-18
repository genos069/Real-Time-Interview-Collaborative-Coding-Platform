package com.interviewplatform.backend.interview;

import com.interviewplatform.backend.bot.entity.Interview.Evaluation;
import com.interviewplatform.backend.bot.exception.ApiException;
import com.interviewplatform.backend.bot.repository.AIInterviewRepository;
import com.interviewplatform.backend.candidate.dto.dashboard.DashboardResponse;
import com.interviewplatform.backend.candidate.service.CandidateDashboardService;
import com.interviewplatform.backend.candidate.service.PracticeQuestionService;
import com.interviewplatform.backend.candidate.service.QuestionSubmissionService;
import com.interviewplatform.backend.exception.ErrorResponse;
import com.interviewplatform.backend.exception.GlobalExceptionHandler;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerClient;
import com.interviewplatform.backend.interview.dto.InterviewRoomScoresResponse;
import com.interviewplatform.backend.interview.dto.InterviewScoreResponse;
import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.model.InterviewScore;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.repository.InterviewScoreRepository;
import com.interviewplatform.backend.interview.service.InterviewService;
import com.interviewplatform.backend.interviewer.dto.dashboard.InterviewerDashboardResponse;
import com.interviewplatform.backend.interviewer.service.InterviewerDashboardService;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.UserRepository;
import com.interviewplatform.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewScoringTest {

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private OnlineCompilerClient onlineCompilerClient;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private InterviewScoreRepository interviewScoreRepository;

    @Mock
    private PracticeQuestionService practiceQuestionService;

    @Mock
    private QuestionSubmissionService questionSubmissionService;

    @Mock
    private AIInterviewRepository aiInterviewRepository;

    private InterviewService interviewService;
    private CandidateDashboardService candidateDashboardService;
    private InterviewerDashboardService interviewerDashboardService;
    private GlobalExceptionHandler globalExceptionHandler;

    private final String roomId = "INT-SCORE-ROOM-1";
    private final String interviewDocId = "mongo-interview-doc-1";
    private final String interviewerId = "interviewer-user-1";
    private final String candidateId = "candidate-user-2";

    private Interview completedInterview;
    private User interviewerUser;
    private User candidateUser;

    @BeforeEach
    void setUp() {
        interviewService = new InterviewService(
                interviewRepository,
                userRepository,
                userService,
                onlineCompilerClient,
                interviewScoreRepository,
                messagingTemplate
        );

        candidateDashboardService = new CandidateDashboardService(
                userService,
                practiceQuestionService,
                questionSubmissionService,
                interviewRepository,
                interviewScoreRepository,
                aiInterviewRepository
        );

        interviewerDashboardService = new InterviewerDashboardService(
                userService,
                interviewRepository,
                interviewScoreRepository,
                userRepository
        );

        globalExceptionHandler = new GlobalExceptionHandler();

        interviewerUser = new User();
        interviewerUser.setId(interviewerId);
        interviewerUser.setName("Alice Interviewer");
        interviewerUser.setEmail("alice@interviewer.com");
        interviewerUser.setRole("interviewer");

        candidateUser = new User();
        candidateUser.setId(candidateId);
        candidateUser.setName("Bob Candidate");
        candidateUser.setEmail("bob@candidate.com");
        candidateUser.setRole("candidate");
        candidateUser.setReadinessScore(88);

        completedInterview = new Interview();
        completedInterview.setId(interviewDocId);
        completedInterview.setRoomId(roomId);
        completedInterview.setTitle("Senior Full Stack Interview");
        completedInterview.setTargetRole("Senior Software Engineer");
        completedInterview.setStatus("COMPLETED");
        completedInterview.setInterviewerId(interviewerId);
        completedInterview.setCandidateId(candidateId);
        completedInterview.setCandidateEmail("bob@candidate.com");
        completedInterview.setCreatedAt(LocalDateTime.now().minusHours(2));
        completedInterview.setStartedAt(LocalDateTime.now().minusHours(1));
        completedInterview.setEndedAt(LocalDateTime.now().minusMinutes(10));
    }

    // 1. Interviewer successfully scores candidate with a valid score
    @Test
    void submitScore_InterviewerScoresCandidate_Success() {
        when(userService.getLoggedInUser()).thenReturn(interviewerUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(completedInterview));
        when(interviewScoreRepository.existsByInterviewIdAndScorerUserId(interviewDocId, interviewerId)).thenReturn(false);
        when(interviewScoreRepository.existsByRoomIdAndScorerUserId(roomId, interviewerId)).thenReturn(false);
        when(interviewScoreRepository.save(any(InterviewScore.class))).thenAnswer(inv -> inv.getArgument(0));

        InterviewScore scoreResult = interviewService.submitScore(roomId, 85);

        assertNotNull(scoreResult);
        assertEquals(85, scoreResult.getScore());
        assertEquals(interviewDocId, scoreResult.getInterviewId());
        assertEquals(roomId, scoreResult.getRoomId());
        assertEquals(interviewerId, scoreResult.getScorerUserId());
        assertEquals("INTERVIEWER", scoreResult.getScorerRole());
        assertEquals(candidateId, scoreResult.getRecipientUserId());
        assertEquals("CANDIDATE", scoreResult.getRecipientRole());

        // Verify Interview entity was updated
        ArgumentCaptor<Interview> captor = ArgumentCaptor.forClass(Interview.class);
        verify(interviewRepository).save(captor.capture());
        assertEquals(85, captor.getValue().getCandidateScore());
    }

    // 2. Candidate successfully scores interviewer with a valid score
    @Test
    void submitScore_CandidateScoresInterviewer_Success() {
        when(userService.getLoggedInUser()).thenReturn(candidateUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(completedInterview));
        when(interviewScoreRepository.existsByInterviewIdAndScorerUserId(interviewDocId, candidateId)).thenReturn(false);
        when(interviewScoreRepository.existsByRoomIdAndScorerUserId(roomId, candidateId)).thenReturn(false);
        when(interviewScoreRepository.save(any(InterviewScore.class))).thenAnswer(inv -> inv.getArgument(0));

        InterviewScore scoreResult = interviewService.submitScore(roomId, 92);

        assertNotNull(scoreResult);
        assertEquals(92, scoreResult.getScore());
        assertEquals(candidateId, scoreResult.getScorerUserId());
        assertEquals("CANDIDATE", scoreResult.getScorerRole());
        assertEquals(interviewerId, scoreResult.getRecipientUserId());
        assertEquals("INTERVIEWER", scoreResult.getRecipientRole());

        // Verify Interview entity was updated
        ArgumentCaptor<Interview> captor = ArgumentCaptor.forClass(Interview.class);
        verify(interviewRepository).save(captor.capture());
        assertEquals(92, captor.getValue().getInterviewerScore());
    }

    // 3. Boundary test: Score 0 is accepted
    @Test
    void submitScore_ScoreZero_Accepted() {
        when(userService.getLoggedInUser()).thenReturn(interviewerUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(completedInterview));
        when(interviewScoreRepository.existsByInterviewIdAndScorerUserId(interviewDocId, interviewerId)).thenReturn(false);
        when(interviewScoreRepository.existsByRoomIdAndScorerUserId(roomId, interviewerId)).thenReturn(false);
        when(interviewScoreRepository.save(any(InterviewScore.class))).thenAnswer(inv -> inv.getArgument(0));

        InterviewScore scoreResult = interviewService.submitScore(roomId, 0);

        assertNotNull(scoreResult);
        assertEquals(0, scoreResult.getScore());
    }

    // 4. Boundary test: Score 100 is accepted
    @Test
    void submitScore_ScoreHundred_Accepted() {
        when(userService.getLoggedInUser()).thenReturn(interviewerUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(completedInterview));
        when(interviewScoreRepository.existsByInterviewIdAndScorerUserId(interviewDocId, interviewerId)).thenReturn(false);
        when(interviewScoreRepository.existsByRoomIdAndScorerUserId(roomId, interviewerId)).thenReturn(false);
        when(interviewScoreRepository.save(any(InterviewScore.class))).thenAnswer(inv -> inv.getArgument(0));

        InterviewScore scoreResult = interviewService.submitScore(roomId, 100);

        assertNotNull(scoreResult);
        assertEquals(100, scoreResult.getScore());
    }

    // 5. Score below 0 is rejected
    @Test
    void submitScore_ScoreBelowZero_Rejected() {
        when(userService.getLoggedInUser()).thenReturn(interviewerUser);

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.submitScore(roomId, -1)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Score must be between 0 and 100", ex.getMessage());

        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleApiException(ex);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(interviewScoreRepository, never()).save(any());
    }

    // 6. Score above 100 is rejected
    @Test
    void submitScore_ScoreAboveHundred_Rejected() {
        when(userService.getLoggedInUser()).thenReturn(interviewerUser);

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.submitScore(roomId, 101)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Score must be between 0 and 100", ex.getMessage());

        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleApiException(ex);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(interviewScoreRepository, never()).save(any());
    }

    // 7. Non-participant cannot score
    @Test
    void submitScore_NonParticipant_Forbidden() {
        User stranger = new User();
        stranger.setId("unrelated-user-999");
        stranger.setRole("interviewer");

        when(userService.getLoggedInUser()).thenReturn(stranger);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(completedInterview));

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.submitScore(roomId, 80)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("You are not authorized to score this interview", ex.getMessage());

        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleApiException(ex);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        verify(interviewScoreRepository, never()).save(any());
    }

    // 8. User cannot score themselves
    @Test
    void submitScore_UserCannotScoreThemselves() {
        // Set interview where interviewerId equals candidateId
        Interview corruptInterview = new Interview();
        corruptInterview.setId("same-user-interview");
        corruptInterview.setRoomId("ROOM-SELF");
        corruptInterview.setStatus("COMPLETED");
        corruptInterview.setInterviewerId("self-user-123");
        corruptInterview.setCandidateId("self-user-123");

        User selfUser = new User();
        selfUser.setId("self-user-123");
        selfUser.setRole("interviewer");

        when(userService.getLoggedInUser()).thenReturn(selfUser);
        when(interviewRepository.findByRoomId("ROOM-SELF")).thenReturn(Optional.of(corruptInterview));

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.submitScore("ROOM-SELF", 85)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("User cannot score themselves", ex.getMessage());
        verify(interviewScoreRepository, never()).save(any());
    }

    // 9. Duplicate score submission is rejected
    @Test
    void submitScore_DuplicateSubmission_Rejected() {
        when(userService.getLoggedInUser()).thenReturn(interviewerUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(completedInterview));
        when(interviewScoreRepository.existsByInterviewIdAndScorerUserId(interviewDocId, interviewerId)).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.submitScore(roomId, 75)
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("Score has already been submitted for this interview", ex.getMessage());

        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleApiException(ex);
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        verify(interviewScoreRepository, never()).save(any());
    }

    // 10. Scoring an unfinished / non-completed interview is rejected
    @Test
    void submitScore_UnfinishedInterview_Rejected() {
        Interview activeInterview = new Interview();
        activeInterview.setId("active-doc-id");
        activeInterview.setRoomId("ACTIVE-ROOM-1");
        activeInterview.setStatus("ACTIVE");
        activeInterview.setInterviewerId(interviewerId);
        activeInterview.setCandidateId(candidateId);

        when(userService.getLoggedInUser()).thenReturn(interviewerUser);
        when(interviewRepository.findByRoomId("ACTIVE-ROOM-1")).thenReturn(Optional.of(activeInterview));

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.submitScore("ACTIVE-ROOM-1", 90)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Interview must be completed before submitting evaluation", ex.getMessage());
        verify(interviewScoreRepository, never()).save(any());
    }

    // 11. Candidate real-interview average only uses interviewer -> candidate scores
    @Test
    void candidateDashboard_RealInterviewAverage_UsesOnlyInterviewerScores() {
        when(userService.getLoggedInUser()).thenReturn(candidateUser);
        when(questionSubmissionService.getSolvedCount(candidateId)).thenReturn(10L);
        when(questionSubmissionService.getTotalCodingTimeSeconds(candidateId)).thenReturn(3600L);

        // 2 real completed interviews
        List<Interview> completedList = List.of(completedInterview, new Interview());
        when(interviewRepository.findByCandidateIdAndStatusOrderByCreatedAtDesc(candidateId, "COMPLETED"))
                .thenReturn(completedList);

        // 2 interviewer->candidate scores: 80 and 90
        InterviewScore score1 = new InterviewScore("id1", "room1", interviewerId, "INTERVIEWER", candidateId, "CANDIDATE", 80, LocalDateTime.now(), LocalDateTime.now());
        InterviewScore score2 = new InterviewScore("id2", "room2", "interviewer-2", "INTERVIEWER", candidateId, "CANDIDATE", 90, LocalDateTime.now(), LocalDateTime.now());

        when(interviewScoreRepository.findByRecipientUserIdAndScorerRoleOrderByCreatedAtDesc(candidateId, "INTERVIEWER"))
                .thenReturn(List.of(score1, score2));

        when(aiInterviewRepository.findByUserIdOrderByCreatedAtDesc(candidateId))
                .thenReturn(new ArrayList<>());

        DashboardResponse dashboard = candidateDashboardService.getDashboard();

        assertNotNull(dashboard);
        assertEquals(2, dashboard.getTotalCompletedRealInterviews());
        assertEquals(85.0, dashboard.getAverageRealInterviewScore());
        assertEquals(85.0, dashboard.getStats().getAverageRealInterviewScore());
    }

    // 12. Candidate's score given to interviewer is not included in candidate's own average
    @Test
    void candidateDashboard_ScoreGivenToInterviewer_ExcludedFromCandidateAverage() {
        when(userService.getLoggedInUser()).thenReturn(candidateUser);
        when(questionSubmissionService.getSolvedCount(candidateId)).thenReturn(5L);
        when(questionSubmissionService.getTotalCodingTimeSeconds(candidateId)).thenReturn(1800L);

        when(interviewRepository.findByCandidateIdAndStatusOrderByCreatedAtDesc(candidateId, "COMPLETED"))
                .thenReturn(List.of(completedInterview));

        // The candidate received an 80 from the interviewer
        InterviewScore receivedScore = new InterviewScore(
                interviewDocId, roomId, interviewerId, "INTERVIEWER", candidateId, "CANDIDATE", 80, LocalDateTime.now(), LocalDateTime.now()
        );

        when(interviewScoreRepository.findByRecipientUserIdAndScorerRoleOrderByCreatedAtDesc(candidateId, "INTERVIEWER"))
                .thenReturn(List.of(receivedScore));

        when(aiInterviewRepository.findByUserIdOrderByCreatedAtDesc(candidateId))
                .thenReturn(new ArrayList<>());

        DashboardResponse dashboard = candidateDashboardService.getDashboard();

        // Average MUST be 80.0, candidate's own score given (e.g. 100) is excluded
        assertEquals(80.0, dashboard.getAverageRealInterviewScore());
        verify(interviewScoreRepository, never()).findByScorerUserIdAndScorerRoleOrderByCreatedAtDesc(eq(candidateId), any());
    }

    // 13. Completed real interview count is correct and excludes unfinished ones
    @Test
    void candidateDashboard_CompletedRealInterviewCount_IsAccurate() {
        when(userService.getLoggedInUser()).thenReturn(candidateUser);
        when(questionSubmissionService.getSolvedCount(candidateId)).thenReturn(0L);
        when(questionSubmissionService.getTotalCodingTimeSeconds(candidateId)).thenReturn(0L);

        // Repository returns only COMPLETED interviews
        when(interviewRepository.findByCandidateIdAndStatusOrderByCreatedAtDesc(candidateId, "COMPLETED"))
                .thenReturn(List.of(completedInterview, completedInterview, completedInterview));

        when(interviewScoreRepository.findByRecipientUserIdAndScorerRoleOrderByCreatedAtDesc(candidateId, "INTERVIEWER"))
                .thenReturn(new ArrayList<>());
        when(aiInterviewRepository.findByUserIdOrderByCreatedAtDesc(candidateId))
                .thenReturn(new ArrayList<>());

        DashboardResponse dashboard = candidateDashboardService.getDashboard();

        assertEquals(3, dashboard.getTotalCompletedRealInterviews());
        assertEquals(3, dashboard.getStats().getTotalCompletedRealInterviews());
    }

    // 14. Mock interview count remains separate from real interview count
    @Test
    void candidateDashboard_MockInterviewCount_RemainsSeparate() {
        when(userService.getLoggedInUser()).thenReturn(candidateUser);
        when(questionSubmissionService.getSolvedCount(candidateId)).thenReturn(0L);
        when(questionSubmissionService.getTotalCodingTimeSeconds(candidateId)).thenReturn(0L);

        // 2 completed real interviews
        when(interviewRepository.findByCandidateIdAndStatusOrderByCreatedAtDesc(candidateId, "COMPLETED"))
                .thenReturn(List.of(completedInterview, completedInterview));

        // 4 AI mock interviews
        com.interviewplatform.backend.bot.entity.Interview mock1 = new com.interviewplatform.backend.bot.entity.Interview();
        com.interviewplatform.backend.bot.entity.Interview mock2 = new com.interviewplatform.backend.bot.entity.Interview();
        com.interviewplatform.backend.bot.entity.Interview mock3 = new com.interviewplatform.backend.bot.entity.Interview();
        com.interviewplatform.backend.bot.entity.Interview mock4 = new com.interviewplatform.backend.bot.entity.Interview();

        when(aiInterviewRepository.findByUserIdOrderByCreatedAtDesc(candidateId))
                .thenReturn(List.of(mock1, mock2, mock3, mock4));

        when(interviewScoreRepository.findByRecipientUserIdAndScorerRoleOrderByCreatedAtDesc(candidateId, "INTERVIEWER"))
                .thenReturn(new ArrayList<>());

        DashboardResponse dashboard = candidateDashboardService.getDashboard();

        assertEquals(2, dashboard.getTotalCompletedRealInterviews());
        assertEquals(4, dashboard.getTotalCompletedMockInterviews());
        assertEquals(4, dashboard.getStats().getTotalCompletedMockInterviews());
        // Verify AI Readiness Score is untouched
        assertEquals(88, dashboard.getUser().getReadinessScore());
    }

    // 15. Bidirectional score retrieval for authorized participant
    @Test
    void getInterviewScores_ParticipantAuthorized_ReturnsBothScores() {
        when(userService.getLoggedInUser()).thenReturn(interviewerUser);
        completedInterview.setCandidateScore(85);
        completedInterview.setInterviewerScore(90);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(completedInterview));

        InterviewScore s1 = new InterviewScore(interviewDocId, roomId, interviewerId, "INTERVIEWER", candidateId, "CANDIDATE", 85, LocalDateTime.now(), LocalDateTime.now());
        InterviewScore s2 = new InterviewScore(interviewDocId, roomId, candidateId, "CANDIDATE", interviewerId, "INTERVIEWER", 90, LocalDateTime.now(), LocalDateTime.now());
        when(interviewScoreRepository.findByRoomId(roomId)).thenReturn(List.of(s1, s2));

        InterviewRoomScoresResponse response = interviewService.getInterviewScores(roomId);

        assertNotNull(response);
        assertEquals(roomId, response.getRoomId());
        assertEquals(85, response.getCandidateScore());
        assertEquals(90, response.getInterviewerScore());
        assertEquals(2, response.getScores().size());
    }

    // 16. Non-participant cannot view interview scores
    @Test
    void getInterviewScores_NonParticipant_ThrowsForbidden() {
        User stranger = new User();
        stranger.setId("stranger-user-456");
        stranger.setRole("interviewer");

        when(userService.getLoggedInUser()).thenReturn(stranger);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(completedInterview));

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.getInterviewScores(roomId)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("You are not authorized to view scores for this interview", ex.getMessage());
    }

    // 17. Interviewer dashboard computes real stats and recent candidate reviews
    @Test
    void interviewerDashboard_CalculatesRealMetrics_Success() {
        when(userService.getLoggedInUser()).thenReturn(interviewerUser);

        when(interviewRepository.findByInterviewerIdAndStatusOrderByCreatedAtDesc(interviewerId, "COMPLETED"))
                .thenReturn(List.of(completedInterview));

        InterviewScore givenScore = new InterviewScore(
                interviewDocId, roomId, interviewerId, "INTERVIEWER", candidateId, "CANDIDATE", 84, LocalDateTime.now(), LocalDateTime.now()
        );
        when(interviewScoreRepository.findByScorerUserIdAndScorerRoleOrderByCreatedAtDesc(interviewerId, "INTERVIEWER"))
                .thenReturn(List.of(givenScore));

        when(userRepository.findById(candidateId)).thenReturn(Optional.of(candidateUser));

        InterviewerDashboardResponse response = interviewerDashboardService.getDashboard();

        assertNotNull(response);
        assertEquals(1, response.getInterviewsConducted());
        assertEquals(1, response.getCandidatesReviewed());
        assertEquals(84.0, response.getAverageScoreGiven());
        assertEquals(1, response.getRecentCandidateReviews().size());
        assertEquals("Bob Candidate", response.getRecentCandidateReviews().get(0).getCandidateName());
        assertEquals(84, response.getRecentCandidateReviews().get(0).getScore());
        assertEquals("Advance", response.getRecentCandidateReviews().get(0).getDecision());
    }
}
