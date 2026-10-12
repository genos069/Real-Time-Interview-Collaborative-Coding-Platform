package com.interviewplatform.backend.controller;

import com.interviewplatform.backend.dto.UpdateUserRequest;
import com.interviewplatform.backend.dto.UserResponse;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.AvatarService;
import com.interviewplatform.backend.service.UserService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/user")
public class UserController {

    // User Service
    private final UserService userService;
    private final AvatarService avatarService;

    // Constructor
    public UserController(UserService userService, AvatarService avatarService) {
        this.userService = userService;
        this.avatarService = avatarService;
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

    // Upload Profile Picture (Avatar)
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserResponse uploadAvatar(@RequestParam("file") MultipartFile file) {
        User user = userService.getLoggedInUser();
        User updatedUser = avatarService.uploadAvatar(user, file);
        return new UserResponse(
                updatedUser.getId(),
                updatedUser.getName(),
                updatedUser.getEmail(),
                updatedUser.getRole(),
                updatedUser.getTitle(),
                updatedUser.getLocation(),
                updatedUser.getAvatar(),
                updatedUser.getAbout()
        );
    }

    // Remove Profile Picture (Avatar)
    @DeleteMapping("/avatar")
    public UserResponse removeAvatar() {
        User user = userService.getLoggedInUser();
        User updatedUser = avatarService.removeAvatar(user);
        return new UserResponse(
                updatedUser.getId(),
                updatedUser.getName(),
                updatedUser.getEmail(),
                updatedUser.getRole(),
                updatedUser.getTitle(),
                updatedUser.getLocation(),
                updatedUser.getAvatar(),
                updatedUser.getAbout()
        );
    }

    // Public Avatar Stream Endpoint
    @GetMapping("/avatar/{userId}")
    public ResponseEntity<Resource> getAvatar(@PathVariable String userId) {
        AvatarService.AvatarData avatarData = avatarService.getAvatarData(userId);
        if (avatarData == null || avatarData.getResource() == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(avatarData.getContentType()))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(avatarData.getResource());
    }

}