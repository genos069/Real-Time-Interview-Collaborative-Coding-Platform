package com.interviewplatform.backend.interview;

import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.websocket.InterviewChatController;
import com.interviewplatform.backend.interview.websocket.InterviewChatMessage;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewChatControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private Authentication authentication;

    private InterviewChatController chatController;

    private final String roomId = "test-room-123";
    private final String candidateId = "candidate-user-1";
    private final String interviewerId = "interviewer-user-1";

    private User candidateUser;
    private User interviewerUser;
    private Interview activeInterview;

    @BeforeEach
    void setUp() {
        chatController = new InterviewChatController(userService, interviewRepository);

        candidateUser = new User();
        candidateUser.setId(candidateId);
        candidateUser.setName("Priya Nair");
        candidateUser.setEmail("priya@example.com");
        candidateUser.setRole("candidate");

        interviewerUser = new User();
        interviewerUser.setId(interviewerId);
        interviewerUser.setName("Sarah Lin");
        interviewerUser.setEmail("sarah@example.com");
        interviewerUser.setRole("interviewer");

        activeInterview = new Interview();
        activeInterview.setRoomId(roomId);
        activeInterview.setStatus("ACTIVE");
        activeInterview.setCandidateId(candidateId);
        activeInterview.setInterviewerId(interviewerId);
    }

    @Test
    void sendChatMessage_MissingAuth_ThrowsException() {
        InterviewChatMessage input = new InterviewChatMessage();
        input.setText("Hello");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                chatController.sendChatMessage(roomId, input, null)
        );
        assertEquals("WebSocket authentication is missing", ex.getMessage());
    }

    @Test
    void sendChatMessage_UserNotFound_ThrowsException() {
        when(authentication.getName()).thenReturn("unknown@example.com");
        when(userService.getUserByEmail("unknown@example.com")).thenReturn(null);

        InterviewChatMessage input = new InterviewChatMessage();
        input.setText("Hello");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                chatController.sendChatMessage(roomId, input, authentication)
        );
        assertEquals("Authenticated user not found", ex.getMessage());
    }

    @Test
    void sendChatMessage_EmptyRoomId_ThrowsException() {
        when(authentication.getName()).thenReturn("priya@example.com");
        when(userService.getUserByEmail("priya@example.com")).thenReturn(candidateUser);

        InterviewChatMessage input = new InterviewChatMessage();
        input.setText("Hello");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                chatController.sendChatMessage("  ", input, authentication)
        );
        assertEquals("Room ID must not be empty", ex.getMessage());
    }

    @Test
    void sendChatMessage_RoomNotFound_ThrowsException() {
        when(authentication.getName()).thenReturn("priya@example.com");
        when(userService.getUserByEmail("priya@example.com")).thenReturn(candidateUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.empty());

        InterviewChatMessage input = new InterviewChatMessage();
        input.setText("Hello");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                chatController.sendChatMessage(roomId, input, authentication)
        );
        assertEquals("Interview room not found", ex.getMessage());
    }

    @Test
    void sendChatMessage_InterviewNotActive_ThrowsException() {
        activeInterview.setStatus("COMPLETED");

        when(authentication.getName()).thenReturn("priya@example.com");
        when(userService.getUserByEmail("priya@example.com")).thenReturn(candidateUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        InterviewChatMessage input = new InterviewChatMessage();
        input.setText("Hello");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                chatController.sendChatMessage(roomId, input, authentication)
        );
        assertEquals("Interview is not active", ex.getMessage());
    }

    @Test
    void sendChatMessage_UnauthorizedUser_ThrowsException() {
        User outsider = new User();
        outsider.setId("outsider-999");
        outsider.setEmail("outsider@example.com");
        outsider.setRole("candidate");

        when(authentication.getName()).thenReturn("outsider@example.com");
        when(userService.getUserByEmail("outsider@example.com")).thenReturn(outsider);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        InterviewChatMessage input = new InterviewChatMessage();
        input.setText("Hello");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                chatController.sendChatMessage(roomId, input, authentication)
        );
        assertEquals("You are not authorized for this interview room", ex.getMessage());
    }

    @Test
    void sendChatMessage_EmptyText_ThrowsException() {
        when(authentication.getName()).thenReturn("priya@example.com");
        when(userService.getUserByEmail("priya@example.com")).thenReturn(candidateUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        InterviewChatMessage input = new InterviewChatMessage();
        input.setText("    ");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                chatController.sendChatMessage(roomId, input, authentication)
        );
        assertEquals("Chat message text must not be empty", ex.getMessage());
    }

    @Test
    void sendChatMessage_Candidate_ReturnsSanitizedMessage() {
        when(authentication.getName()).thenReturn("priya@example.com");
        when(userService.getUserByEmail("priya@example.com")).thenReturn(candidateUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        InterviewChatMessage input = new InterviewChatMessage();
        input.setText("Hello, can you hear me?");

        InterviewChatMessage result = chatController.sendChatMessage(roomId, input, authentication);

        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals(roomId, result.getRoomId());
        assertEquals(candidateId, result.getSenderUserId());
        assertEquals("Priya Nair", result.getSenderName());
        assertEquals("candidate", result.getSenderRole());
        assertEquals("Hello, can you hear me?", result.getText());
        assertNotNull(result.getTimestamp());
    }

    @Test
    void sendChatMessage_Interviewer_ReturnsSanitizedMessage() {
        when(authentication.getName()).thenReturn("sarah@example.com");
        when(userService.getUserByEmail("sarah@example.com")).thenReturn(interviewerUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        InterviewChatMessage input = new InterviewChatMessage();
        input.setText("Yes, loud and clear!");

        InterviewChatMessage result = chatController.sendChatMessage(roomId, input, authentication);

        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals(roomId, result.getRoomId());
        assertEquals(interviewerId, result.getSenderUserId());
        assertEquals("Sarah Lin", result.getSenderName());
        assertEquals("interviewer", result.getSenderRole());
        assertEquals("Yes, loud and clear!", result.getText());
        assertNotNull(result.getTimestamp());
    }
}
