package com.interviewplatform.backend.interview.websocket;

import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.UserService;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.time.Instant;
import java.util.UUID;

@Controller
public class InterviewWhiteboardController {

    private final UserService userService;
    private final InterviewRepository interviewRepository;

    public InterviewWhiteboardController(
            UserService userService,
            InterviewRepository interviewRepository
    ) {
        this.userService = userService;
        this.interviewRepository = interviewRepository;
    }

    @MessageMapping("/interview/{roomId}/whiteboard")
    @SendTo("/topic/interview/{roomId}/whiteboard")
    public InterviewWhiteboardMessage relayWhiteboardOperation(
            @DestinationVariable String roomId,
            @Payload InterviewWhiteboardMessage message,
            Authentication authentication
    ) {
        /*
         * ============================================================
         * 1. CHECK WEBSOCKET AUTHENTICATION
         * ============================================================
         */
        if (authentication == null) {
            throw new RuntimeException("WebSocket authentication is missing");
        }

        User user = userService.getUserByEmail(authentication.getName());
        if (user == null) {
            throw new RuntimeException("Authenticated user not found");
        }

        /*
         * ============================================================
         * 2. VALIDATE ROOM ID & FIND ACTIVE INTERVIEW ROOM
         * ============================================================
         */
        if (roomId == null || roomId.trim().isEmpty()) {
            throw new IllegalArgumentException("Room ID must not be empty");
        }

        Interview interview = interviewRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RuntimeException("Interview room not found"));

        if (!"ACTIVE".equalsIgnoreCase(interview.getStatus())) {
            throw new RuntimeException("Interview is not active");
        }

        /*
         * ============================================================
         * 3. CHECK ROOM AUTHORIZATION
         * ============================================================
         */
        boolean authorized = false;
        if ("interviewer".equalsIgnoreCase(user.getRole())) {
            authorized = user.getId().equals(interview.getInterviewerId());
        } else if ("candidate".equalsIgnoreCase(user.getRole())) {
            authorized = user.getId().equals(interview.getCandidateId());
        }

        if (!authorized) {
            throw new RuntimeException("You are not authorized for this interview room");
        }

        /*
         * ============================================================
         * 4. VALIDATE WHITEBOARD OPERATION PAYLOAD
         * ============================================================
         */
        if (message == null || message.getType() == null || message.getType().trim().isEmpty()) {
            throw new IllegalArgumentException("Whiteboard operation type must not be empty");
        }

        String type = message.getType().trim().toUpperCase();
        if (!"STROKE".equals(type)
                && !"SHAPE".equals(type)
                && !"CLEAR".equals(type)
                && !"UNDO".equals(type)) {
            throw new IllegalArgumentException("Unsupported whiteboard operation type: " + type);
        }

        /*
         * ============================================================
         * 5. BUILD AND BROADCAST SANITIZED WHITEBOARD MESSAGE
         * ============================================================
         * SENDER IDENTITY AND ROLE ARE STRICTLY DERIVED FROM AUTHENTICATION CONTEXT.
         * WHITEBOARD DATA IS TRANSIENT REAL-TIME SESSION DATA (NOT PERSISTED IN MONGODB).
         */
        InterviewWhiteboardMessage response = new InterviewWhiteboardMessage();
        response.setId(message.getId() != null && !message.getId().trim().isEmpty()
                ? message.getId().trim()
                : UUID.randomUUID().toString());
        response.setRoomId(roomId);
        response.setSenderUserId(user.getId());
        response.setSenderRole(user.getRole());
        response.setType(type);
        response.setTool(message.getTool());
        response.setColor(message.getColor());
        response.setSize(message.getSize());
        response.setStartX(message.getStartX());
        response.setStartY(message.getStartY());
        response.setEndX(message.getEndX());
        response.setEndY(message.getEndY());
        response.setPoints(message.getPoints());
        response.setTimestamp(Instant.now().toString());

        System.out.println(
                "Relaying whiteboard " + response.getType()
                        + " for room: " + roomId
                        + " from " + user.getRole() + " (" + user.getId() + ")"
        );

        return response;
    }
}
