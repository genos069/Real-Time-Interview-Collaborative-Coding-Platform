package com.interviewplatform.backend.config;

import com.interviewplatform.backend.jwt.JwtUtil;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    public WebSocketAuthInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Message<?> preSend(
            Message<?> message,
            MessageChannel channel
    ) {

        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class
                );

        if (accessor == null) {
            return message;
        }

        /*
         * ============================================================
         * 1. STOMP CONNECT
         * ============================================================
         *
         * Authenticate using JWT and store the authenticated
         * user information in the WebSocket session.
         */
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            String authorization =
                    accessor.getFirstNativeHeader("Authorization");

            if (authorization == null
                    || !authorization.startsWith("Bearer ")) {

                throw new IllegalArgumentException(
                        "Missing Authorization token"
                );
            }

            String token = authorization.substring(7);

            // Validate JWT
            if (!jwtUtil.validateToken(token)) {

                throw new IllegalArgumentException(
                        "Invalid or expired token"
                );
            }

            // Extract user information
            String email =
                    jwtUtil.extractEmail(token);

            String role =
                    jwtUtil.extractRole(token);

            /*
             * Create Spring Security Authentication.
             */
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            List.of(
                                    new SimpleGrantedAuthority(
                                            "ROLE_" + role.toUpperCase()
                                    )
                            )
                    );

            /*
             * Attach Authentication to the STOMP session.
             */
            accessor.setUser(authentication);

            /*
             * IMPORTANT:
             *
             * Also store the authenticated user information
             * inside the WebSocket session.
             *
             * This allows us to restore Authentication on
             * subsequent STOMP messages such as JOIN.
             */
            if (accessor.getSessionAttributes() != null) {

                accessor.getSessionAttributes().put(
                        "WS_EMAIL",
                        email
                );

                accessor.getSessionAttributes().put(
                        "WS_ROLE",
                        role
                );
            }

            System.out.println(
                    "WebSocket authenticated: "
                            + email
                            + " | role="
                            + role
            );

            return message;
        }

        /*
         * ============================================================
         * 2. SUBSEQUENT STOMP MESSAGES
         * ============================================================
         *
         * CONNECT is authenticated above.
         *
         * For JOIN/SEND/etc., restore the Authentication from
         * the WebSocket session.
         */
        if (accessor.getUser() == null) {

            if (accessor.getSessionAttributes() != null) {

                Object emailObject =
                        accessor.getSessionAttributes().get(
                                "WS_EMAIL"
                        );

                Object roleObject =
                        accessor.getSessionAttributes().get(
                                "WS_ROLE"
                        );

                if (emailObject != null) {

                    String email =
                            emailObject.toString();

                    String role =
                            roleObject != null
                                    ? roleObject.toString()
                                    : "USER";

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    email,
                                    null,
                                    List.of(
                                            new SimpleGrantedAuthority(
                                                    "ROLE_"
                                                            + role.toUpperCase()
                                            )
                                    )
                            );

                    /*
                     * Restore Authentication for this message.
                     */
                    accessor.setUser(authentication);

                    System.out.println(
                            "WebSocket authentication restored: "
                                    + email
                                    + " | role="
                                    + role
                    );
                }
            }
        }

        return message;
    }
}