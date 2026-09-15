package com.interviewplatform.backend.interview.websocket;

import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.UserService;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;

import org.springframework.security.core.Authentication;

import org.springframework.stereotype.Controller;

@Controller
public class InterviewPresenceController {

    private final UserService userService;

    private final InterviewRepository interviewRepository;

    public InterviewPresenceController(
            UserService userService,
            InterviewRepository interviewRepository
    ) {
        this.userService = userService;
        this.interviewRepository = interviewRepository;
    }

    @MessageMapping("/interview/{roomId}/join")
    @SendTo("/topic/interview/{roomId}/presence")
    public PresenceMessage joinInterview(
            @DestinationVariable String roomId,
            Authentication authentication
    ) {

        /*
         * ============================================================
         * CHECK WEBSOCKET AUTHENTICATION
         * ============================================================
         */
        if (authentication == null) {

            throw new RuntimeException(
                    "WebSocket authentication is missing"
            );
        }

        System.out.println(
                "JOIN request authenticated as: "
                        + authentication.getName()
        );

        /*
         * ============================================================
         * FIND USER
         * ============================================================
         */
        User user =
                userService.getUserByEmail(
                        authentication.getName()
                );

        if (user == null) {

            throw new RuntimeException(
                    "Authenticated user not found"
            );
        }

        /*
         * ============================================================
         * FIND INTERVIEW ROOM
         * ============================================================
         */
        Interview interview =
                interviewRepository.findByRoomId(roomId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Interview room not found"
                                )
                        );

        /*
         * ============================================================
         * CHECK INTERVIEW STATUS
         * ============================================================
         */
        if (!"ACTIVE".equalsIgnoreCase(
                interview.getStatus()
        )) {

            throw new RuntimeException(
                    "Interview is not active"
            );
        }

        /*
         * ============================================================
         * CHECK ROOM AUTHORIZATION
         * ============================================================
         */
        boolean authorized = false;

        /*
         * INTERVIEWER
         */
        if ("interviewer".equalsIgnoreCase(
                user.getRole()
        )) {

            authorized =
                    user.getId().equals(
                            interview.getInterviewerId()
                    );
        }

        /*
         * CANDIDATE
         */
        if ("candidate".equalsIgnoreCase(
                user.getRole()
        )) {

            authorized =
                    user.getId().equals(
                            interview.getCandidateId()
                    );
        }

        /*
         * OBSERVER
         */
        if ("observer".equalsIgnoreCase(
                user.getRole()
        )) {

            authorized =
                    user.getId().equals(
                            interview.getObserverId()
                    );
        }

        /*
         * ============================================================
         * REJECT UNAUTHORIZED USER
         * ============================================================
         */
        if (!authorized) {

            throw new RuntimeException(
                    "You are not authorized to join this interview room"
            );
        }

        /*
         * ============================================================
         * CREATE PRESENCE MESSAGE
         * ============================================================
         */
        PresenceMessage presence =
                new PresenceMessage();

        presence.setRoomId(roomId);
        presence.setUserId(user.getId());
        presence.setName(user.getName());
        presence.setRole(user.getRole());
        presence.setEvent("JOINED");

        System.out.println(
                "User joined interview room: "
                        + roomId
                        + " | "
                        + user.getRole()
                        + " | "
                        + user.getId()
        );

        return presence;
    }

    @MessageMapping("/interview/{roomId}/leave")
    @SendTo("/topic/interview/{roomId}/presence")
    public PresenceMessage leaveInterview(
            @DestinationVariable String roomId,
            Authentication authentication
    ) {

        /*
         * ============================================================
         * CHECK WEBSOCKET AUTHENTICATION
         * ============================================================
         */
        if (authentication == null) {

            throw new RuntimeException(
                    "WebSocket authentication is missing"
            );
        }

        /*
         * ============================================================
         * FIND USER
         * ============================================================
         */
        User user =
                userService.getUserByEmail(
                        authentication.getName()
                );

        if (user == null) {

            throw new RuntimeException(
                    "Authenticated user not found"
            );
        }

        /*
         * ============================================================
         * FIND INTERVIEW ROOM
         * ============================================================
         */
        Interview interview =
                interviewRepository.findByRoomId(roomId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Interview room not found"
                                )
                        );

        /*
         * ============================================================
         * CHECK ROOM AUTHORIZATION
         * ============================================================
         */
        boolean authorized = false;

        if ("interviewer".equalsIgnoreCase(user.getRole())) {
            authorized = user.getId().equals(interview.getInterviewerId());
        } else if ("candidate".equalsIgnoreCase(user.getRole())) {
            authorized = user.getId().equals(interview.getCandidateId());
        } else if ("observer".equalsIgnoreCase(user.getRole())) {
            authorized = user.getId().equals(interview.getObserverId());
        }

        if (!authorized) {
            throw new RuntimeException(
                    "You are not authorized for this interview room"
            );
        }

        /*
         * ============================================================
         * CREATE PRESENCE MESSAGE
         * ============================================================
         */
        PresenceMessage presence =
                new PresenceMessage();

        presence.setRoomId(roomId);
        presence.setUserId(user.getId());
        presence.setName(user.getName());
        presence.setRole(user.getRole());
        presence.setEvent("LEFT");

        System.out.println(
                "User left interview room: "
                        + roomId
                        + " | "
                        + user.getRole()
                        + " | "
                        + user.getId()
        );

        return presence;
    }
}