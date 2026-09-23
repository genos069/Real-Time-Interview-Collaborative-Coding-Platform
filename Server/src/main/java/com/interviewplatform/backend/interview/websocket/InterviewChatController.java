package com.interviewplatform.backend.interview.websocket;

import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.UserService;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.time.Instant;
import java.util.UUID;

@Controller
public class InterviewChatController {

    private static final Logger log = LoggerFactory.getLogger(InterviewChatController.class);

    private final UserService userService;
    private final InterviewRepository interviewRepository;

    public InterviewChatController(
            UserService userService,
            InterviewRepository interviewRepository
    ) {
        this.userService = userService;
        this.interviewRepository = interviewRepository;
    }

    @MessageMapping("/interview/{roomId}/chat")
    @SendTo("/topic/interview/{roomId}/chat")
    public InterviewChatMessage sendChatMessage(
            @DestinationVariable String roomId,
            @Payload InterviewChatMessage message,
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
         * 4. VALIDATE CHAT MESSAGE PAYLOAD
         * ============================================================
         */
        if (message == null || message.getText() == null || message.getText().trim().isEmpty()) {
            throw new IllegalArgumentException("Chat message text must not be empty");
        }

        /*
         * ============================================================
         * 5. BUILD AND BROADCAST SANITIZED CHAT MESSAGE
         * ============================================================
         * Sender identity, role, and server-side timestamp are strictly
         * populated from authenticated state, not trusted from client payload.
         */
        String senderName = user.getName();
        if (senderName == null || senderName.trim().isEmpty()) {
            senderName = "interviewer".equalsIgnoreCase(user.getRole()) ? "Interviewer" : "Candidate";
        } else {
            senderName = senderName.trim();
        }

        InterviewChatMessage response = new InterviewChatMessage();
        response.setId(UUID.randomUUID().toString());
        response.setRoomId(roomId);
        response.setSenderUserId(user.getId());
        response.setSenderName(senderName);
        response.setSenderRole(user.getRole());
        response.setText(message.getText().trim());
        response.setTimestamp(Instant.now().toString());

        log.info("Relaying chat message in room: {} from {} ({})", roomId, user.getEmail(), user.getRole());

        return response;
    }
}
