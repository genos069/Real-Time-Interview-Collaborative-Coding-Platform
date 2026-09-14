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

@Controller
public class WebRTCSignalingController {

    private final UserService userService;
    private final InterviewRepository interviewRepository;

    public WebRTCSignalingController(
            UserService userService,
            InterviewRepository interviewRepository
    ) {
        this.userService = userService;
        this.interviewRepository = interviewRepository;
    }

    @MessageMapping("/interview/{roomId}/signal")
    @SendTo("/topic/interview/{roomId}/signal")
    public WebRTCSignalMessage relaySignal(
            @DestinationVariable String roomId,
            @Payload WebRTCSignalMessage message,
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
         * 2. FIND INTERVIEW ROOM & VERIFY ACTIVE
         * ============================================================
         */
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
         * 4. VALIDATE SIGNAL TYPE (OFFER, ANSWER, or ICE_CANDIDATE)
         * ============================================================
         */
        String type = message != null ? message.getType() : null;
        if (!"OFFER".equalsIgnoreCase(type)
                && !"ANSWER".equalsIgnoreCase(type)
                && !"ICE_CANDIDATE".equalsIgnoreCase(type)) {
            throw new IllegalArgumentException("Unsupported or missing signal type: " + type);
        }

        /*
         * ============================================================
         * 5. BUILD AND RELAY SANITIZED SIGNALING MESSAGE
         * ============================================================
         * SDP and ICE candidates are NEVER persisted to MongoDB. Actual
         * media does not pass through Spring Boot.
         */
        WebRTCSignalMessage response = new WebRTCSignalMessage();
        response.setRoomId(roomId);
        response.setSenderUserId(user.getId());
        response.setSenderRole(user.getRole());
        response.setType(type.toUpperCase());
        response.setSdp(message.getSdp());
        response.setCandidate(message.getCandidate());
        response.setSdpMid(message.getSdpMid());
        response.setSdpMLineIndex(message.getSdpMLineIndex());

        System.out.println(
                "Relaying WebRTC " + response.getType()
                        + " for room: " + roomId
                        + " from " + user.getRole() + " (" + user.getId() + ")"
        );

        return response;
    }
}
