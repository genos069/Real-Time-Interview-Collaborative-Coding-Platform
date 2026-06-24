package com.interviewplatform.backend.controller;

import com.interviewplatform.backend.dto.AuthResponse;
import com.interviewplatform.backend.dto.LoginRequest;
import com.interviewplatform.backend.dto.UpdateUserRequest;
import com.interviewplatform.backend.dto.UserResponse;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    // User Service
    private final UserService userService;

    // Constructor
    public UserController(
            UserService userService
    ) {
        this.userService = userService;
    }

    // Register User
    @PostMapping("/register")
    public User register(
            @RequestBody User user
    ) {
        return userService.registerUser(user);
    }

    // Login User
    @PostMapping("/login")
    public AuthResponse login(
            @RequestBody LoginRequest request
    ) {

        System.out.println("LOGIN CONTROLLER HIT");

        return userService.loginUser(request);
    }

    // Test API
    @GetMapping("/test")
    public String test() {
        return "Backend is working!";
    }

    // Protected API
    @GetMapping("/profile")
    public String profile() {
        return "Access Granted";
    }

    // Current User
    @GetMapping("/me")
    public UserResponse getCurrentUser() {
        return userService.getCurrentUser();
    }

    // Update Profile
    @PutMapping("/me")
    public UserResponse updateProfile(
            @RequestBody UpdateUserRequest request
    ) {
        return userService.updateProfile(request);
    }
}