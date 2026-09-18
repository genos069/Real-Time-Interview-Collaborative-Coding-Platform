package com.interviewplatform.backend.interview;

import com.interviewplatform.backend.bot.exception.ApiException;
import com.interviewplatform.backend.exception.ErrorResponse;
import com.interviewplatform.backend.exception.GlobalExceptionHandler;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerClient;
import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.service.InterviewService;
import com.interviewplatform.backend.interview.websocket.InterviewEventMessage;
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

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewFinishTest {

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private OnlineCompilerClient onlineCompilerClient;

    @Mock
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    private InterviewService interviewService;
    private GlobalExceptionHandler globalExceptionHandler;

    private final String roomId = "INT-TEST-123";
    private final String interviewerId = "interviewer-user-1";
    private final String candidateId = "candidate-user-2";

    private Interview activeInterview;

    @BeforeEach
    void setUp() {
        interviewService = new InterviewService(interviewRepository, userRepository, userService, onlineCompilerClient, messagingTemplate);
        globalExceptionHandler = new GlobalExceptionHandler();

        activeInterview = new Interview();
        activeInterview.setId("mongo-doc-id-1");
        activeInterview.setRoomId(roomId);
        activeInterview.setStatus("ACTIVE");
        activeInterview.setInterviewerId(interviewerId);
        activeInterview.setCandidateId(candidateId);
        activeInterview.setCreatedAt(LocalDateTime.now().minusHours(1));
        activeInterview.setStartedAt(LocalDateTime.now().minusMinutes(45));
    }

    // 1. Interviewer can finish an active interview
    @Test
    void finishInterview_AssignedInterviewer_Success() {
        User interviewer = new User();
        interviewer.setId(interviewerId);
        interviewer.setRole("interviewer");
        when(userService.getLoggedInUser()).thenReturn(interviewer);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Interview result = interviewService.finishInterview(roomId);

        assertNotNull(result);
        assertEquals("COMPLETED", result.getStatus());
        assertNotNull(result.getEndedAt());
        assertNotNull(result.getUpdatedAt());
    }

    // 2 & 3. Finishing changes status to COMPLETED and is persisted
    @Test
    void finishInterview_ChangesStatusToCompleted_AndPersists() {
        User interviewer = new User();
        interviewer.setId(interviewerId);
        interviewer.setRole("interviewer");
        when(userService.getLoggedInUser()).thenReturn(interviewer);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Interview result = interviewService.finishInterview(roomId);

        ArgumentCaptor<Interview> captor = ArgumentCaptor.forClass(Interview.class);
        verify(interviewRepository, times(1)).save(captor.capture());

        Interview saved = captor.getValue();
        assertEquals("COMPLETED", saved.getStatus());
        assertEquals(roomId, saved.getRoomId());
        assertNotNull(saved.getEndedAt());
        assertNotNull(saved.getUpdatedAt());
        assertEquals("COMPLETED", result.getStatus());
    }

    // 4 & 5. Candidate cannot finish an interview and receives HTTP 403
    @Test
    void finishInterview_CandidateAttempt_ThrowsForbidden() {
        User candidate = new User();
        candidate.setId(candidateId);
        candidate.setRole("candidate");
        when(userService.getLoggedInUser()).thenReturn(candidate);

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.finishInterview(roomId)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("Only interviewers can finish interviews", ex.getMessage());

        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleApiException(ex);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Only interviewers can finish interviews", response.getBody().getMessage());
        verify(interviewRepository, never()).save(any());
    }

    // 5b. Another interviewer (not assigned to room) receives HTTP 403
    @Test
    void finishInterview_UnassignedInterviewer_ThrowsForbidden() {
        User stranger = new User();
        stranger.setId("stranger-interviewer-999");
        stranger.setRole("interviewer");
        when(userService.getLoggedInUser()).thenReturn(stranger);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.finishInterview(roomId)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("You are not authorized to finish this interview", ex.getMessage());

        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleApiException(ex);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("You are not authorized to finish this interview", response.getBody().getMessage());
        verify(interviewRepository, never()).save(any());
    }

    // 6. Unknown room/interview returns 404
    @Test
    void finishInterview_UnknownRoom_ThrowsNotFound() {
        User interviewer = new User();
        interviewer.setId(interviewerId);
        interviewer.setRole("interviewer");
        when(userService.getLoggedInUser()).thenReturn(interviewer);
        when(interviewRepository.findByRoomId("NON-EXISTENT-ROOM")).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.finishInterview("NON-EXISTENT-ROOM")
        );

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("Interview room not found", ex.getMessage());

        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleApiException(ex);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Interview room not found", response.getBody().getMessage());
    }

    // 7. Repeated finish request is handled safely (idempotent, returns completed interview)
    @Test
    void finishInterview_AlreadyCompleted_ReturnsSafelyWithoutError() {
        User interviewer = new User();
        interviewer.setId(interviewerId);
        interviewer.setRole("interviewer");
        when(userService.getLoggedInUser()).thenReturn(interviewer);

        LocalDateTime previousEndedAt = LocalDateTime.now().minusMinutes(10);
        activeInterview.setStatus("COMPLETED");
        activeInterview.setEndedAt(previousEndedAt);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        Interview result = interviewService.finishInterview(roomId);

        assertNotNull(result);
        assertEquals("COMPLETED", result.getStatus());
        assertEquals(previousEndedAt, result.getEndedAt());
        // Should not re-save or fail
        verify(interviewRepository, never()).save(any());
    }

    // Non-active (e.g. CREATED) interview cannot be finished
    @Test
    void finishInterview_CreatedStatus_ThrowsBadRequest() {
        User interviewer = new User();
        interviewer.setId(interviewerId);
        interviewer.setRole("interviewer");
        when(userService.getLoggedInUser()).thenReturn(interviewer);

        activeInterview.setStatus("CREATED");
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.finishInterview(roomId)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Interview cannot be finished"));
        verify(interviewRepository, never()).save(any());
    }

    // Unauthenticated user returns 401
    @Test
    void finishInterview_Unauthenticated_ThrowsUnauthorized() {
        when(userService.getLoggedInUser()).thenReturn(null);

        ApiException ex = assertThrows(ApiException.class, () ->
                interviewService.finishInterview(roomId)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        verify(interviewRepository, never()).save(any());
    }

    // 8. endInterview alias functions identically
    @Test
    void endInterview_AliasFunctionsIdentically() {
        User interviewer = new User();
        interviewer.setId(interviewerId);
        interviewer.setRole("interviewer");
        when(userService.getLoggedInUser()).thenReturn(interviewer);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Interview result = interviewService.endInterview(roomId);

        assertNotNull(result);
        assertEquals("COMPLETED", result.getStatus());
        verify(interviewRepository, times(1)).save(any(Interview.class));
    }

    // 9. Real-time STOMP completion event is broadcast to /topic/interview/{roomId}/events
    @Test
    void finishInterview_BroadcastsRealtimeCompletionEvent() {
        User interviewer = new User();
        interviewer.setId(interviewerId);
        interviewer.setRole("interviewer");
        when(userService.getLoggedInUser()).thenReturn(interviewer);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        interviewService.finishInterview(roomId);

        ArgumentCaptor<String> destinationCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<InterviewEventMessage> eventCaptor = ArgumentCaptor.forClass(InterviewEventMessage.class);

        verify(messagingTemplate, times(1)).convertAndSend(destinationCaptor.capture(), eventCaptor.capture());

        assertEquals("/topic/interview/" + roomId + "/events", destinationCaptor.getValue());
        InterviewEventMessage event = eventCaptor.getValue();
        assertNotNull(event);
        assertEquals(roomId, event.getRoomId());
        assertEquals("INTERVIEW_COMPLETED", event.getEvent());
        assertEquals("COMPLETED", event.getStatus());
        assertEquals("interviewer", event.getInitiatorRole());
        assertEquals(interviewerId, event.getInitiatorId());
        assertNotNull(event.getMessage());
    }

    // 10. Repeated finish of an already completed interview does NOT broadcast duplicate event
    @Test
    void finishInterview_AlreadyCompleted_DoesNotBroadcastDuplicate() {
        User interviewer = new User();
        interviewer.setId(interviewerId);
        interviewer.setRole("interviewer");
        when(userService.getLoggedInUser()).thenReturn(interviewer);

        activeInterview.setStatus("COMPLETED");
        activeInterview.setEndedAt(LocalDateTime.now().minusMinutes(5));
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        interviewService.finishInterview(roomId);

        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }

    // 11. Candidate attempt does NOT broadcast event
    @Test
    void finishInterview_CandidateAttempt_DoesNotBroadcastEvent() {
        User candidate = new User();
        candidate.setId(candidateId);
        candidate.setRole("candidate");
        when(userService.getLoggedInUser()).thenReturn(candidate);

        assertThrows(ApiException.class, () ->
                interviewService.finishInterview(roomId)
        );

        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }
}
