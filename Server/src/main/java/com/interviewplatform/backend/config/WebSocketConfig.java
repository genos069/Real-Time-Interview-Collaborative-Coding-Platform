package com.interviewplatform.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig
        implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    public WebSocketConfig(
            WebSocketAuthInterceptor webSocketAuthInterceptor
    ) {
        this.webSocketAuthInterceptor =
                webSocketAuthInterceptor;
    }

    @Override
    public void configureMessageBroker(
            MessageBrokerRegistry config
    ) {

        /*
         * Messages sent to /topic are broadcast
         * to subscribed clients.
         */
        config.enableSimpleBroker("/topic");

        /*
         * Client application messages start with /app.
         */
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(
            StompEndpointRegistry registry
    ) {

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureClientInboundChannel(
            org.springframework.messaging.simp.config.ChannelRegistration registration
    ) {

        /*
         * Register WebSocket JWT authentication interceptor.
         */
        registration.interceptors(
                webSocketAuthInterceptor
        );
    }
}