package com.interviewplatform.backend.interview.websocket;

import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.service.InterviewService;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.UserService;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class InterviewCodeController {

    private final UserService userService;
    private final InterviewRepository interviewRepository;
    private final InterviewService interviewService;

    public InterviewCodeController(
            UserService userService,
            InterviewRepository interviewRepository,
            InterviewService interviewService
    ) {
        this.userService = userService;
        this.interviewRepository = interviewRepository;
        this.interviewService = interviewService;
    }

    @MessageMapping("/interview/{roomId}/code")
    @SendTo("/topic/interview/{roomId}/code")
    public CodeSyncMessage syncCode(
            @DestinationVariable String roomId,
            @Payload CodeSyncMessage message,
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
         * 4. VALIDATE CODE MESSAGE PAYLOAD
         * ============================================================
         */
        if (message == null) {
            throw new IllegalArgumentException("Code synchronization message payload is missing");
        }

        if (message.getCode() == null && (message.getLanguage() == null || message.getLanguage().trim().isEmpty())) {
            throw new IllegalArgumentException("Code content or language must not be null");
        }

        String language = normalizeLanguage(message.getLanguage());

        /*
         * ============================================================
         * 5. PERSIST CODE SNAPSHOT VIA SERVICE
         * ============================================================
         * The latest code and language snapshot are persisted to MongoDB
         * through the service layer. If code is null, only language is updated.
         */
        interviewService.updateCodeSnapshot(roomId, message.getCode(), language);

        /*
         * ============================================================
         * 6. BUILD AND BROADCAST SANITIZED CODE SYNC MESSAGE
         * ============================================================
         * The senderUserId and senderRole are strictly populated from the
         * authenticated user entity, not from the client payload.
         */
        CodeSyncMessage response = new CodeSyncMessage();
        response.setRoomId(roomId);
        response.setSenderUserId(user.getId());
        response.setSenderRole(user.getRole());
        response.setCode(message.getCode());
        response.setLanguage(language);
        response.setCursorPosition(message.getCursorPosition());

        System.out.println(
                "Relaying code sync for room: " + roomId
                        + " from " + user.getRole() + " (" + user.getId() + ")"
                        + " | lang=" + language
        );

        return response;
    }

    private String normalizeLanguage(String lang) {
        if (lang == null || lang.trim().isEmpty()) {
            return "Java";
        }
        String lower = lang.trim().toLowerCase();
        if ("python".equals(lower) || "python3".equals(lower)) {
            return "Python";
        }
        if ("cpp".equals(lower) || "c++".equals(lower)) {
            return "C++";
        }
        if ("java".equals(lower)) {
            return "Java";
        }
        return "Java";
    }
}
