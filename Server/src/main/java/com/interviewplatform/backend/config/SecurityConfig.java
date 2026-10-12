package com.interviewplatform.backend.config;

import com.interviewplatform.backend.jwt.JwtFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class SecurityConfig {

    // JWT Filter
    private final JwtFilter jwtFilter;
    private final String allowedOrigins;

    // Constructor
    public SecurityConfig(
            JwtFilter jwtFilter,
            @Value("${cors.allowed-origins:http://localhost:5173}") String allowedOrigins) {
        this.jwtFilter = jwtFilter;
        this.allowedOrigins = allowedOrigins;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http

                // Disable CSRF
                .csrf(csrf -> csrf.disable())

                // Enable CORS
                .cors(cors -> {
                })

                // Stateless Session Management
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Authorization Rules
                .authorizeHttpRequests(auth -> auth

                        // Public APIs
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/register-candidate",
                                "/api/auth/login-candidate",
                                "/api/auth/register-interviewer",
                                "/api/auth/login-interviewer",
                                "/api/auth/test")
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/user/avatar/**")
                        .permitAll()

                        // AI MOCK APIs
                        .requestMatchers("/api/interview/**")
                        .authenticated()

                        .requestMatchers("/api/history/**")
                        .authenticated()

                        // Interviewer Dashboard APIs
                        .requestMatchers("/api/interviewer/**")
                        .hasRole("INTERVIEWER")

                        // Mutual Interview Scoring APIs (Interviewer or Candidate)
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/interviews/score",
                                "/api/interviews/*/score")
                        .authenticated()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/interviews/*/scores",
                                "/api/interviews/scores/**")
                        .authenticated()

                        // Interviewer Only APIs
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/interviews",
                                "/api/interviews/*/finish",
                                "/api/interviews/*/end")
                        .hasRole("INTERVIEWER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/interviews/*/score/candidate")
                        .hasRole("INTERVIEWER")

                        // Candidate Only APIs
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/interviews/*/score/interviewer")
                        .hasRole("CANDIDATE")

                        // Other Interviewer PUT APIs
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/interviews/**")
                        .hasRole("INTERVIEWER")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/interviews/**")
                        .hasRole("INTERVIEWER")

                        // WebSocket connection
                        .requestMatchers("/ws/**")
                        .permitAll()

                        // Other authenticated APIs
                        .anyRequest()
                        .authenticated()
                )

                // JWT Filter
                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    // Password Encoder
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // CORS Configuration
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        if (allowedOrigins != null && !allowedOrigins.isBlank()) {
            Arrays.stream(allowedOrigins.split(","))
                    .map(String::trim)
                    .filter(origin -> !origin.isEmpty())
                    .forEach(configuration::addAllowedOrigin);
        } else {
            configuration.addAllowedOrigin("http://localhost:5173");
        }

        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}