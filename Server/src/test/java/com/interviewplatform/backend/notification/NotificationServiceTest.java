package com.interviewplatform.backend.notification;

import com.interviewplatform.backend.bot.exception.ApiException;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerClient;
import com.interviewplatform.backend.interview.dto.CreateInterviewRequest;
import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.model.InterviewScore;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.repository.InterviewScoreRepository;
import com.interviewplatform.backend.interview.service.InterviewService;
import com.interviewplatform.backend.interview.websocket.InterviewPresenceController;
import com.interviewplatform.backend.interview.websocket.PresenceMessage;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.notification.model.Notification;
import com.interviewplatform.backend.notification.model.NotificationType;
import com.interviewplatform.backend.notification.repository.NotificationRepository;
import com.interviewplatform.backend.notification.service.NotificationService;
import com.interviewplatform.backend.repository.UserRepository;
import com.interviewplatform.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private UserService userService;

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OnlineCompilerClient onlineCompilerClient;

    @Mock
    private InterviewScoreRepository interviewScoreRepository;

    private NotificationService notificationService;
    private InterviewService interviewService;
    private InterviewPresenceController interviewPresenceController;

    private User interviewer;
    private User candidate;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(
                notificationRepository,
                messagingTemplate,
                userService,
                interviewRepository,
                interviewScoreRepository
        );

        interviewService = new InterviewService(
                interviewRepository,
                userRepository,
                userService,
                onlineCompilerClient,
                interviewScoreRepository,
                messagingTemplate,
                notificationService
        );

        interviewPresenceController = new InterviewPresenceController(
                userService,
                interviewRepository,
                notificationService
        );

        interviewer = new User();
        interviewer.setId("interviewer-1");
        interviewer.setName("Alice Interviewer");
        interviewer.setEmail("alice@test.com");
        interviewer.setRole("interviewer");

        candidate = new User();
        candidate.setId("candidate-1");
        candidate.setName("Bob Candidate");
        candidate.setEmail("bob@test.com");
        candidate.setRole("candidate");
    }

    // 1. notification creation for the correct recipient
    @Test
    void testNotificationCreationForCorrectRecipient() {
        when(notificationRepository.existsByRecipientUserIdAndTypeAndRoomId(anyString(), any(), anyString()))
                .thenReturn(false);
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> {
                    Notification n = invocation.getArgument(0);
                    n.setId("notif-1");
                    return n;
                });

        Notification result = notificationService.createAndSendNotification(
                "candidate-1",
                NotificationType.INTERVIEW_SCHEDULED,
                "Interview Scheduled",
                "Your interview has been scheduled.",
                "int-1",
                "ROOM-1"
        );

        assertNotNull(result);
        assertEquals("candidate-1", result.getRecipientUserId());
        assertEquals(NotificationType.INTERVIEW_SCHEDULED, result.getType());
        assertEquals("Interview Scheduled", result.getTitle());
        assertFalse(result.isRead());

        verify(messagingTemplate).convertAndSend(
                eq("/topic/notifications/candidate-1"),
                eq(result)
        );
    }

    // 2. authenticated user cannot retrieve another user's notifications
    @Test
    void testAuthenticatedUserCannotRetrieveAnotherUsersNotifications() {
        when(userService.getLoggedInUser()).thenReturn(candidate);
        Notification candNotif = new Notification("candidate-1", NotificationType.INTERVIEW_SCHEDULED, "Scheduled", "Msg", "id-1", "ROOM-1");
        when(notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc("candidate-1"))
                .thenReturn(List.of(candNotif));

        List<Notification> userNotifs = notificationService.getNotificationsForCurrentUser();

        assertEquals(1, userNotifs.size());
        assertEquals("candidate-1", userNotifs.get(0).getRecipientUserId());
        verify(notificationRepository).findByRecipientUserIdOrderByCreatedAtDesc("candidate-1");
        verify(notificationRepository, never()).findByRecipientUserIdOrderByCreatedAtDesc("interviewer-1");
    }

    // 3. mark-as-read behavior
    @Test
    void testMarkAsReadBehavior() {
        when(userService.getLoggedInUser()).thenReturn(candidate);
        Notification notif = new Notification("candidate-1", NotificationType.INTERVIEW_SCHEDULED, "Title", "Msg", "id-1", "ROOM-1");
        notif.setId("notif-123");
        notif.setRead(false);

        when(notificationRepository.findByIdAndRecipientUserId("notif-123", "candidate-1"))
                .thenReturn(Optional.of(notif));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Notification marked = notificationService.markAsRead("notif-123");

        assertTrue(marked.isRead());
        verify(notificationRepository).save(notif);

        // Attempting to mark another user's notification throws 404
        when(notificationRepository.findByIdAndRecipientUserId("other-notif", "candidate-1"))
                .thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () -> notificationService.markAsRead("other-notif"));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    // 4. duplicate prevention
    @Test
    void testDuplicatePrevention() {
        when(notificationRepository.existsByRecipientUserIdAndTypeAndRoomId(
                "candidate-1",
                NotificationType.INTERVIEWER_WAITING,
                "ROOM-1"
        )).thenReturn(true);

        Notification duplicate = notificationService.createAndSendNotification(
                "candidate-1",
                NotificationType.INTERVIEWER_WAITING,
                "Interviewer is Waiting",
                "Your interviewer is waiting for you.",
                "int-1",
                "ROOM-1"
        );

        assertNull(duplicate);
        verify(notificationRepository, never()).save(any());
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }

    // 5. interview scheduled notification trigger
    @Test
    void testInterviewScheduledNotificationTrigger() {
        when(userService.getLoggedInUser()).thenReturn(interviewer);
        when(userRepository.findByEmailIgnoreCase("bob@test.com")).thenReturn(Optional.of(candidate));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(inv -> {
            Interview i = inv.getArgument(0);
            i.setId("int-saved-1");
            return i;
        });

        CreateInterviewRequest request = new CreateInterviewRequest();
        request.setTitle("Java Senior Engineer");
        request.setTargetRole("Backend");
        request.setInterviewType("technical");
        request.setCandidateEmail("bob@test.com");

        Interview created = interviewService.createInterview(request);

        assertNotNull(created);
        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notifCaptor.capture());

        Notification captured = notifCaptor.getValue();
        assertEquals("candidate-1", captured.getRecipientUserId());
        assertEquals(NotificationType.INTERVIEW_SCHEDULED, captured.getType());
        assertEquals("Interview Scheduled", captured.getTitle());
        assertTrue(captured.getMessage().contains("Java Senior Engineer"));
    }

    // 6. interviewer waiting notification trigger
    @Test
    void testInterviewerWaitingNotificationTrigger() {
        when(userService.getLoggedInUser()).thenReturn(interviewer);
        Interview interview = new Interview();
        interview.setId("int-room-1");
        interview.setRoomId("ROOM-WAIT-1");
        interview.setInterviewerId("interviewer-1");
        interview.setCandidateId("candidate-1");
        interview.setStatus("CREATED");

        when(interviewRepository.findByRoomId("ROOM-WAIT-1")).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(inv -> inv.getArgument(0));

        interviewService.startInterview("ROOM-WAIT-1");

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notifCaptor.capture());

        Notification captured = notifCaptor.getValue();
        assertEquals("candidate-1", captured.getRecipientUserId());
        assertEquals(NotificationType.INTERVIEWER_WAITING, captured.getType());
        assertEquals("Interviewer is Waiting", captured.getTitle());
    }

    // 7. candidate joined notification trigger
    @Test
    void testCandidateJoinedNotificationTrigger() {
        Authentication auth = new UsernamePasswordAuthenticationToken("bob@test.com", null);
        when(userService.getUserByEmail("bob@test.com")).thenReturn(candidate);

        Interview interview = new Interview();
        interview.setId("int-room-join");
        interview.setRoomId("ROOM-JOIN-1");
        interview.setInterviewerId("interviewer-1");
        interview.setCandidateId("candidate-1");
        interview.setStatus("ACTIVE");

        when(interviewRepository.findByRoomId("ROOM-JOIN-1")).thenReturn(Optional.of(interview));

        PresenceMessage presence = interviewPresenceController.joinInterview("ROOM-JOIN-1", auth);

        assertNotNull(presence);
        assertEquals("JOINED", presence.getEvent());

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notifCaptor.capture());

        Notification captured = notifCaptor.getValue();
        assertEquals("interviewer-1", captured.getRecipientUserId());
        assertEquals(NotificationType.CANDIDATE_JOINED, captured.getType());
        assertEquals("Candidate Joined", captured.getTitle());
        assertTrue(captured.getMessage().contains("Bob Candidate"));
    }

    // 8. interviewer score submission notification trigger
    @Test
    void testInterviewerScoreSubmissionNotificationTrigger() {
        when(userService.getLoggedInUser()).thenReturn(interviewer);

        Interview interview = new Interview();
        interview.setId("int-score-1");
        interview.setRoomId("ROOM-SCORE-1");
        interview.setInterviewerId("interviewer-1");
        interview.setCandidateId("candidate-1");
        interview.setStatus("COMPLETED");

        when(interviewRepository.findByRoomId("ROOM-SCORE-1")).thenReturn(Optional.of(interview));
        when(interviewScoreRepository.existsByInterviewIdAndScorerUserId(anyString(), anyString())).thenReturn(false);
        when(interviewScoreRepository.existsByRoomIdAndScorerUserId(anyString(), anyString())).thenReturn(false);
        when(interviewScoreRepository.save(any(InterviewScore.class))).thenAnswer(inv -> inv.getArgument(0));

        InterviewScore score = interviewService.submitScore("ROOM-SCORE-1", 85);

        assertNotNull(score);
        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notifCaptor.capture());

        Notification captured = notifCaptor.getValue();
        assertEquals("candidate-1", captured.getRecipientUserId());
        assertEquals(NotificationType.INTERVIEW_SCORE_RECEIVED, captured.getType());
        assertEquals("Interview Score Received", captured.getTitle());
    }

    // 9. candidate score submission notification trigger
    @Test
    void testCandidateScoreSubmissionNotificationTrigger() {
        when(userService.getLoggedInUser()).thenReturn(candidate);

        Interview interview = new Interview();
        interview.setId("int-review-1");
        interview.setRoomId("ROOM-REV-1");
        interview.setInterviewerId("interviewer-1");
        interview.setCandidateId("candidate-1");
        interview.setStatus("COMPLETED");

        when(interviewRepository.findByRoomId("ROOM-REV-1")).thenReturn(Optional.of(interview));
        when(interviewScoreRepository.existsByInterviewIdAndScorerUserId(anyString(), anyString())).thenReturn(false);
        when(interviewScoreRepository.existsByRoomIdAndScorerUserId(anyString(), anyString())).thenReturn(false);
        when(interviewScoreRepository.save(any(InterviewScore.class))).thenAnswer(inv -> inv.getArgument(0));

        InterviewScore score = interviewService.submitScore("ROOM-REV-1", 90);

        assertNotNull(score);
        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notifCaptor.capture());

        Notification captured = notifCaptor.getValue();
        assertEquals("interviewer-1", captured.getRecipientUserId());
        assertEquals(NotificationType.CANDIDATE_REVIEW_RECEIVED, captured.getType());
        assertEquals("Candidate Review Received", captured.getTitle());
        assertTrue(captured.getMessage().contains("Bob Candidate"));
    }

    // 10. interview completed notification trigger
    @Test
    void testInterviewCompletedNotificationTrigger() {
        when(userService.getLoggedInUser()).thenReturn(interviewer);

        Interview interview = new Interview();
        interview.setId("int-complete-1");
        interview.setTitle("Fullstack Engineering Interview");
        interview.setRoomId("ROOM-COMP-1");
        interview.setInterviewerId("interviewer-1");
        interview.setCandidateId("candidate-1");
        interview.setStatus("ACTIVE");

        when(interviewRepository.findByRoomId("ROOM-COMP-1")).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(inv -> inv.getArgument(0));

        Interview finished = interviewService.finishInterview("ROOM-COMP-1");

        assertNotNull(finished);
        assertEquals("COMPLETED", finished.getStatus());

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, atLeast(2)).save(notifCaptor.capture());

        List<Notification> captured = notifCaptor.getAllValues();
        boolean candidateReceivedCompleted = captured.stream().anyMatch(n ->
                n.getRecipientUserId().equals("candidate-1") &&
                        n.getType() == NotificationType.INTERVIEW_COMPLETED);
        boolean interviewerReceivedCompleted = captured.stream().anyMatch(n ->
                n.getRecipientUserId().equals("interviewer-1") &&
                        n.getType() == NotificationType.INTERVIEW_COMPLETED);
        boolean evaluationPendingSent = captured.stream().anyMatch(n ->
                n.getRecipientUserId().equals("interviewer-1") &&
                        n.getType() == NotificationType.EVALUATION_PENDING);

        boolean candidateEvalPendingSent = captured.stream().anyMatch(n ->
                n.getRecipientUserId().equals("candidate-1") &&
                        n.getType() == NotificationType.EVALUATION_PENDING);

        assertTrue(candidateReceivedCompleted, "Candidate should receive INTERVIEW_COMPLETED");
        assertTrue(interviewerReceivedCompleted, "Interviewer should receive INTERVIEW_COMPLETED");
        assertTrue(evaluationPendingSent, "Interviewer should receive EVALUATION_PENDING");
        assertTrue(candidateEvalPendingSent, "Candidate should also receive EVALUATION_PENDING");
    }

    // 11. delete individual notification successfully
    @Test
    void testDeleteNotification_Success() {
        when(userService.getLoggedInUser()).thenReturn(candidate);
        Notification notif = new Notification("candidate-1", NotificationType.INTERVIEW_SCHEDULED, "Title", "Msg", "id-1", "ROOM-1");
        notif.setId("notif-to-delete");

        when(notificationRepository.findByIdAndRecipientUserId("notif-to-delete", "candidate-1"))
                .thenReturn(Optional.of(notif));

        notificationService.deleteNotification("notif-to-delete");

        verify(notificationRepository).delete(notif);
    }

    // 12. user cannot delete another user's notification (throws 404)
    @Test
    void testDeleteNotification_NotFoundOrOtherUser_Throws404() {
        when(userService.getLoggedInUser()).thenReturn(candidate);
        when(notificationRepository.findByIdAndRecipientUserId("notif-other", "candidate-1"))
                .thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () ->
                notificationService.deleteNotification("notif-other")
        );
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        verify(notificationRepository, never()).delete(any());
    }

    // 13. delete notification unauthenticated throws 401
    @Test
    void testDeleteNotification_Unauthorized_Throws401() {
        when(userService.getLoggedInUser()).thenReturn(null);

        ApiException ex = assertThrows(ApiException.class, () ->
                notificationService.deleteNotification("notif-1")
        );
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        verify(notificationRepository, never()).delete(any());
    }

    // 14. clear all notifications for current user
    @Test
    void testClearAllNotifications_Success() {
        when(userService.getLoggedInUser()).thenReturn(candidate);
        Notification n1 = new Notification("candidate-1", NotificationType.INTERVIEW_SCHEDULED, "T1", "M1", "id-1", "ROOM-1");
        Notification n2 = new Notification("candidate-1", NotificationType.INTERVIEW_COMPLETED, "T2", "M2", "id-2", "ROOM-2");

        when(notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc("candidate-1"))
                .thenReturn(List.of(n1, n2));

        notificationService.clearAllNotifications();

        verify(notificationRepository).deleteAll(List.of(n1, n2));
    }

    // 15. resolve pending evaluation deletes matching notification
    @Test
    void testResolvePendingEvaluation() {
        Notification pending = new Notification("interviewer-1", NotificationType.EVALUATION_PENDING, "Eval", "Msg", "int-1", "ROOM-1");
        pending.setId("notif-pending-1");
        Notification other = new Notification("interviewer-1", NotificationType.INTERVIEW_COMPLETED, "Done", "Msg", "int-1", "ROOM-1");
        other.setId("notif-completed-1");

        when(notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc("interviewer-1"))
                .thenReturn(List.of(pending, other));

        notificationService.resolvePendingEvaluation("interviewer-1", "int-1", "ROOM-1");

        verify(notificationRepository).delete(pending);
        verify(notificationRepository, never()).delete(other);
    }

    // 16. submitting score resolves pending evaluation notification
    @Test
    void testSubmitScore_ResolvesPendingEvaluation() {
        when(userService.getLoggedInUser()).thenReturn(interviewer);

        Interview interview = new Interview();
        interview.setId("int-score-res");
        interview.setRoomId("ROOM-RES-1");
        interview.setInterviewerId("interviewer-1");
        interview.setCandidateId("candidate-1");
        interview.setStatus("COMPLETED");

        when(interviewRepository.findByRoomId("ROOM-RES-1")).thenReturn(Optional.of(interview));
        when(interviewScoreRepository.existsByInterviewIdAndScorerUserId(anyString(), anyString())).thenReturn(false);
        when(interviewScoreRepository.existsByRoomIdAndScorerUserId(anyString(), anyString())).thenReturn(false);
        when(interviewScoreRepository.save(any(InterviewScore.class))).thenAnswer(inv -> inv.getArgument(0));

        Notification pendingNotif = new Notification("interviewer-1", NotificationType.EVALUATION_PENDING, "Pending", "Msg", "int-score-res", "ROOM-RES-1");
        when(notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc("interviewer-1"))
                .thenReturn(List.of(pendingNotif));

        interviewService.submitScore("ROOM-RES-1", 95);

        // Verification that resolvePendingEvaluation was invoked and deleted the pending evaluation
        verify(notificationRepository).delete(pendingNotif);
    }

    // 17. sync creates evaluation pending notification for completed unscored interview
    @Test
    void testSyncPendingReviewNotifications_CreatesEvaluationPendingForCompletedUnscored() {
        when(userService.getLoggedInUser()).thenReturn(interviewer);

        Interview completedInterview = new Interview();
        completedInterview.setId("int-completed-unscored");
        completedInterview.setRoomId("ROOM-UNSCORED");
        completedInterview.setInterviewerId("interviewer-1");
        completedInterview.setCandidateId("candidate-1");
        completedInterview.setStatus("COMPLETED");
        completedInterview.setCandidateScore(null);

        when(interviewRepository.findByInterviewerIdAndStatusOrderByCreatedAtDesc("interviewer-1", "COMPLETED"))
                .thenReturn(List.of(completedInterview));
        when(interviewRepository.findByCandidateIdAndStatusOrderByCreatedAtDesc("interviewer-1", "COMPLETED"))
                .thenReturn(Collections.emptyList());

        when(notificationRepository.existsByRecipientUserIdAndTypeAndRoomId(
                "interviewer-1",
                NotificationType.EVALUATION_PENDING,
                "ROOM-UNSCORED"
        )).thenReturn(false);
        when(notificationRepository.existsByRecipientUserIdAndTypeAndRelatedInterviewId(
                "interviewer-1",
                NotificationType.EVALUATION_PENDING,
                "int-completed-unscored"
        )).thenReturn(false);

        when(notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc("interviewer-1"))
                .thenReturn(Collections.emptyList());

        notificationService.getNotificationsForCurrentUser();

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification saved = captor.getValue();
        assertEquals("interviewer-1", saved.getRecipientUserId());
        assertEquals(NotificationType.EVALUATION_PENDING, saved.getType());
        assertEquals("int-completed-unscored", saved.getRelatedInterviewId());
        assertEquals("ROOM-UNSCORED", saved.getRoomId());
    }

    // 18. sync does not create duplicate evaluation pending notification if already exists
    @Test
    void testSyncPendingReviewNotifications_DoesNotCreateDuplicateIfExists() {
        when(userService.getLoggedInUser()).thenReturn(interviewer);

        Interview completedInterview = new Interview();
        completedInterview.setId("int-completed-dup");
        completedInterview.setRoomId("ROOM-DUP");
        completedInterview.setInterviewerId("interviewer-1");
        completedInterview.setStatus("COMPLETED");
        completedInterview.setCandidateScore(null);

        when(interviewRepository.findByInterviewerIdAndStatusOrderByCreatedAtDesc("interviewer-1", "COMPLETED"))
                .thenReturn(List.of(completedInterview));
        when(interviewRepository.findByCandidateIdAndStatusOrderByCreatedAtDesc("interviewer-1", "COMPLETED"))
                .thenReturn(Collections.emptyList());

        // Already exists in DB
        when(notificationRepository.existsByRecipientUserIdAndTypeAndRoomId(
                "interviewer-1",
                NotificationType.EVALUATION_PENDING,
                "ROOM-DUP"
        )).thenReturn(true);

        when(notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc("interviewer-1"))
                .thenReturn(Collections.emptyList());

        notificationService.getNotificationsForCurrentUser();

        // No new save because it already exists
        verify(notificationRepository, never()).save(any());
    }

    // 19. sync resolves pending evaluation if interview is already scored
    @Test
    void testSyncPendingReviewNotifications_ResolvesIfAlreadyScored() {
        when(userService.getLoggedInUser()).thenReturn(interviewer);

        Interview scoredInterview = new Interview();
        scoredInterview.setId("int-scored");
        scoredInterview.setRoomId("ROOM-SCORED");
        scoredInterview.setInterviewerId("interviewer-1");
        scoredInterview.setStatus("COMPLETED");
        scoredInterview.setCandidateScore(88); // Already scored

        when(interviewRepository.findByInterviewerIdAndStatusOrderByCreatedAtDesc("interviewer-1", "COMPLETED"))
                .thenReturn(List.of(scoredInterview));
        when(interviewRepository.findByCandidateIdAndStatusOrderByCreatedAtDesc("interviewer-1", "COMPLETED"))
                .thenReturn(Collections.emptyList());

        Notification oldPending = new Notification("interviewer-1", NotificationType.EVALUATION_PENDING, "Eval", "Msg", "int-scored", "ROOM-SCORED");
        when(notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc("interviewer-1"))
                .thenReturn(List.of(oldPending));

        notificationService.getNotificationsForCurrentUser();

        verify(notificationRepository).delete(oldPending);
        verify(notificationRepository, never()).save(any());
    }

    // 20. Notification creation and backfill preserves and populates interviewTitle
    @Test
    void testNotificationInterviewTitlePopulationAndBackfill() {
        Interview interview = new Interview();
        interview.setId("int-title-1");
        interview.setRoomId("ROOM-TITLE-1");
        interview.setTitle("Java Developer Interview");

        when(interviewRepository.findById("int-title-1")).thenReturn(Optional.of(interview));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // When creating notification without title explicitly passed, it looks up from repository
        Notification created = notificationService.createAndSendNotification(
                "candidate-1",
                NotificationType.EVALUATION_PENDING,
                "Evaluation Pending",
                "Review needed",
                "int-title-1",
                "ROOM-TITLE-1"
        );

        assertNotNull(created);
        assertEquals("Java Developer Interview", created.getInterviewTitle());

        // When backfilling notifications in getNotificationsForCurrentUser
        when(userService.getLoggedInUser()).thenReturn(candidate);
        Notification legacyNotif = new Notification(
                "candidate-1",
                NotificationType.EVALUATION_PENDING,
                "Evaluation Pending",
                "Review needed",
                "int-title-1",
                "ROOM-TITLE-1",
                null
        );
        when(notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc("candidate-1"))
                .thenReturn(List.of(legacyNotif));

        List<Notification> fetched = notificationService.getNotificationsForCurrentUser();
        assertEquals(1, fetched.size());
        assertEquals("Java Developer Interview", fetched.get(0).getInterviewTitle());
    }
}
