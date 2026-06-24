package com.interviewplatform.backend.config;

import com.interviewplatform.backend.jwt.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    // JWT Filter
    private final JwtFilter jwtFilter;

    // Constructor
    public SecurityConfig(
            JwtFilter jwtFilter
    ) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

                // Disable CSRF
                .csrf(csrf -> csrf.disable())

                // Authorization Rules
                .authorizeHttpRequests(auth -> auth

                        // Public APIs
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login"
                        ).permitAll()

                        // Interviewer Only APIs
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/interviews"
                        ).hasRole("INTERVIEWER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/interviews/**"
                        ).hasRole("INTERVIEWER")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/interviews/**"
                        ).hasRole("INTERVIEWER")

                        // Authenticated APIs
                        .anyRequest().authenticated()
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
}