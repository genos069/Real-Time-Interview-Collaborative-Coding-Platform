package com.interviewplatform.backend.interview;

import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.websocket.InterviewWhiteboardController;
import com.interviewplatform.backend.interview.websocket.InterviewWhiteboardMessage;
import com.interviewplatform.backend.interview.websocket.WhiteboardPoint;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewWhiteboardControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private Authentication authentication;

    private InterviewWhiteboardController whiteboardController;

    private final String roomId = "test-room-wb";
    private final String candidateId = "cand-1";
    private final String interviewerId = "interv-1";

    private User candidateUser;
    private User interviewerUser;
    private Interview activeInterview;

    @BeforeEach
    void setUp() {
        whiteboardController = new InterviewWhiteboardController(userService, interviewRepository);

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
    void relayWhiteboardOperation_MissingAuth_ThrowsException() {
        InterviewWhiteboardMessage msg = new InterviewWhiteboardMessage();
        msg.setType("CLEAR");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                whiteboardController.relayWhiteboardOperation(roomId, msg, null)
        );
        assertEquals("WebSocket authentication is missing", ex.getMessage());
    }

    @Test
    void relayWhiteboardOperation_UserNotFound_ThrowsException() {
        when(authentication.getName()).thenReturn("unknown@example.com");
        when(userService.getUserByEmail("unknown@example.com")).thenReturn(null);

        InterviewWhiteboardMessage msg = new InterviewWhiteboardMessage();
        msg.setType("CLEAR");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                whiteboardController.relayWhiteboardOperation(roomId, msg, authentication)
        );
        assertEquals("Authenticated user not found", ex.getMessage());
    }

    @Test
    void relayWhiteboardOperation_EmptyRoomId_ThrowsException() {
        when(authentication.getName()).thenReturn("priya@example.com");
        when(userService.getUserByEmail("priya@example.com")).thenReturn(candidateUser);

        InterviewWhiteboardMessage msg = new InterviewWhiteboardMessage();
        msg.setType("CLEAR");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                whiteboardController.relayWhiteboardOperation("   ", msg, authentication)
        );
        assertEquals("Room ID must not be empty", ex.getMessage());
    }

    @Test
    void relayWhiteboardOperation_RoomNotFound_ThrowsException() {
        when(authentication.getName()).thenReturn("priya@example.com");
        when(userService.getUserByEmail("priya@example.com")).thenReturn(candidateUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.empty());

        InterviewWhiteboardMessage msg = new InterviewWhiteboardMessage();
        msg.setType("CLEAR");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                whiteboardController.relayWhiteboardOperation(roomId, msg, authentication)
        );
        assertEquals("Interview room not found", ex.getMessage());
    }

    @Test
    void relayWhiteboardOperation_InterviewNotActive_ThrowsException() {
        activeInterview.setStatus("COMPLETED");

        when(authentication.getName()).thenReturn("priya@example.com");
        when(userService.getUserByEmail("priya@example.com")).thenReturn(candidateUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        InterviewWhiteboardMessage msg = new InterviewWhiteboardMessage();
        msg.setType("CLEAR");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                whiteboardController.relayWhiteboardOperation(roomId, msg, authentication)
        );
        assertEquals("Interview is not active", ex.getMessage());
    }

    @Test
    void relayWhiteboardOperation_UnauthorizedUser_ThrowsException() {
        User outsider = new User();
        outsider.setId("outsider-user");
        outsider.setEmail("outsider@example.com");
        outsider.setRole("candidate");

        when(authentication.getName()).thenReturn("outsider@example.com");
        when(userService.getUserByEmail("outsider@example.com")).thenReturn(outsider);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        InterviewWhiteboardMessage msg = new InterviewWhiteboardMessage();
        msg.setType("CLEAR");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                whiteboardController.relayWhiteboardOperation(roomId, msg, authentication)
        );
        assertEquals("You are not authorized for this interview room", ex.getMessage());
    }

    @Test
    void relayWhiteboardOperation_MissingType_ThrowsException() {
        when(authentication.getName()).thenReturn("priya@example.com");
        when(userService.getUserByEmail("priya@example.com")).thenReturn(candidateUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        InterviewWhiteboardMessage msg = new InterviewWhiteboardMessage();
        msg.setType("  ");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                whiteboardController.relayWhiteboardOperation(roomId, msg, authentication)
        );
        assertEquals("Whiteboard operation type must not be empty", ex.getMessage());
    }

    @Test
    void relayWhiteboardOperation_UnsupportedType_ThrowsException() {
        when(authentication.getName()).thenReturn("priya@example.com");
        when(userService.getUserByEmail("priya@example.com")).thenReturn(candidateUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        InterviewWhiteboardMessage msg = new InterviewWhiteboardMessage();
        msg.setType("INVALID_TYPE");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                whiteboardController.relayWhiteboardOperation(roomId, msg, authentication)
        );
        assertTrue(ex.getMessage().contains("Unsupported whiteboard operation type"));
    }

    @Test
    void relayWhiteboardOperation_Candidate_Stroke_Success() {
        when(authentication.getName()).thenReturn("priya@example.com");
        when(userService.getUserByEmail("priya@example.com")).thenReturn(candidateUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        InterviewWhiteboardMessage msg = new InterviewWhiteboardMessage();
        msg.setId("op-101");
        msg.setType("STROKE");
        msg.setTool("pen");
        msg.setColor("#3B82F6");
        msg.setSize(4);
        msg.setPoints(List.of(new WhiteboardPoint(10.0, 20.0), new WhiteboardPoint(15.0, 25.0)));

        InterviewWhiteboardMessage result = whiteboardController.relayWhiteboardOperation(roomId, msg, authentication);

        assertNotNull(result);
        assertEquals("op-101", result.getId());
        assertEquals(roomId, result.getRoomId());
        assertEquals(candidateId, result.getSenderUserId());
        assertEquals("candidate", result.getSenderRole());
        assertEquals("STROKE", result.getType());
        assertEquals("pen", result.getTool());
        assertEquals("#3B82F6", result.getColor());
        assertEquals(4, result.getSize());
        assertEquals(2, result.getPoints().size());
        assertNotNull(result.getTimestamp());
    }

    @Test
    void relayWhiteboardOperation_Interviewer_Shape_Success() {
        when(authentication.getName()).thenReturn("sarah@example.com");
        when(userService.getUserByEmail("sarah@example.com")).thenReturn(interviewerUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        InterviewWhiteboardMessage msg = new InterviewWhiteboardMessage();
        msg.setType("SHAPE");
        msg.setTool("rect");
        msg.setColor("#F59E0B");
        msg.setSize(2);
        msg.setStartX(50.0);
        msg.setStartY(60.0);
        msg.setEndX(150.0);
        msg.setEndY(200.0);

        InterviewWhiteboardMessage result = whiteboardController.relayWhiteboardOperation(roomId, msg, authentication);

        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals(roomId, result.getRoomId());
        assertEquals(interviewerId, result.getSenderUserId());
        assertEquals("interviewer", result.getSenderRole());
        assertEquals("SHAPE", result.getType());
        assertEquals("rect", result.getTool());
        assertEquals(50.0, result.getStartX());
        assertEquals(200.0, result.getEndY());
    }

    @Test
    void relayWhiteboardOperation_Clear_Success() {
        when(authentication.getName()).thenReturn("priya@example.com");
        when(userService.getUserByEmail("priya@example.com")).thenReturn(candidateUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        InterviewWhiteboardMessage msg = new InterviewWhiteboardMessage();
        msg.setType("CLEAR");

        InterviewWhiteboardMessage result = whiteboardController.relayWhiteboardOperation(roomId, msg, authentication);

        assertNotNull(result);
        assertEquals("CLEAR", result.getType());
        assertEquals(candidateId, result.getSenderUserId());
    }

    @Test
    void relayWhiteboardOperation_Undo_Success() {
        when(authentication.getName()).thenReturn("sarah@example.com");
        when(userService.getUserByEmail("sarah@example.com")).thenReturn(interviewerUser);
        when(interviewRepository.findByRoomId(roomId)).thenReturn(Optional.of(activeInterview));

        InterviewWhiteboardMessage msg = new InterviewWhiteboardMessage();
        msg.setType("UNDO");

        InterviewWhiteboardMessage result = whiteboardController.relayWhiteboardOperation(roomId, msg, authentication);

        assertNotNull(result);
        assertEquals("UNDO", result.getType());
        assertEquals(interviewerId, result.getSenderUserId());
    }
}
