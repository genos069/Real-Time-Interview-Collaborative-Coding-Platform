package com.interviewplatform.backend.controller;

import com.interviewplatform.backend.dto.AuthResponse;
import com.interviewplatform.backend.dto.LoginRequest;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    // User Service
    private final UserService userService;

    // Constructor
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    // Register Candidate
    @PostMapping("/register-candidate")
    public User registerCandidate(
            @RequestBody User user
    ) {
        user.setRole("CANDIDATE");
        return userService.registerUser(user);
    }

    // Register Interviewer
    @PostMapping("/register-interviewer")
    public User registerInterviewer(
            @RequestBody User user
    ) {
        user.setRole("INTERVIEWER");
        return userService.registerUser(user);
    }

    // Login Candidate
    @PostMapping("/login-candidate")
    public AuthResponse loginCandidate(
            @RequestBody LoginRequest request
    ) {
        request.setRole("CANDIDATE");
        return userService.loginUser(request);
    }

    // Login Interviewer
    @PostMapping("/login-interviewer")
    public AuthResponse loginInterviewer(
            @RequestBody LoginRequest request
    ) {
        request.setRole("INTERVIEWER");
        return userService.loginUser(request);
    }

    // Test API
    @GetMapping("/test")
    public String test() {
        return "Backend is working!";
    }
}