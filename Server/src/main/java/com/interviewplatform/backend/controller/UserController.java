package com.interviewplatform.backend.controller;

import com.interviewplatform.backend.dto.UpdateUserRequest;
import com.interviewplatform.backend.dto.UserResponse;
import com.interviewplatform.backend.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    // User Service
    private final UserService userService;

    // Constructor
    public UserController(UserService userService) {
        this.userService = userService;
    }

    // Protected API
    @GetMapping("/profile")
    public String profile() {
        return "Access Granted";
    }

    // Current Logged-in User
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