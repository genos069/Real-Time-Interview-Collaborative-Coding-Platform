package com.interviewplatform.backend.controller;

import com.interviewplatform.backend.dto.AuthResponse;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.UserService;
import com.interviewplatform.backend.dto.LoginRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public User register(@RequestBody User user) {
        return userService.registerUser(user);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {

        System.out.println("LOGIN CONTROLLER HIT");

        return userService.loginUser(request);
    }

    @GetMapping("/test")
    public String test() {
        return "Backend is working!";
    }

    @GetMapping("/profile")
    public String profile() {
        return "Access Granted";
    }
}