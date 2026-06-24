package com.interviewplatform.backend.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    // JWT Utility
    private final JwtUtil jwtUtil;

    // Constructor
    public JwtFilter(
            JwtUtil jwtUtil
    ) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // Authorization Header
        String authHeader =
                request.getHeader("Authorization");

        // Check Bearer Token
        if (authHeader != null
                && authHeader.startsWith("Bearer ")) {

            // Extract Token
            String token =
                    authHeader.substring(7);

            // Validate Token
            if (jwtUtil.validateToken(token)) {

                // Extract Email
                String email =
                        jwtUtil.extractEmail(token);

                // Extract Role
                String role =
                        jwtUtil.extractRole(token);

                // Create Authorities
                List<SimpleGrantedAuthority> authorities =
                        List.of(
                                new SimpleGrantedAuthority(
                                        "ROLE_" + role.toUpperCase()
                                )
                        );

                // Authentication Object
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                authorities
                        );

                // Request Details
                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                // Save Authentication
                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);
            }
        }

        // Continue Filter Chain
        filterChain.doFilter(
                request,
                response
        );
    }
}