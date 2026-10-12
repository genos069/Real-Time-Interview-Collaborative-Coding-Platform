package com.interviewplatform.backend.candidate.controller;

import com.interviewplatform.backend.candidate.dto.profile.AddSkillRequest;
import com.interviewplatform.backend.candidate.dto.profile.AddTargetRequest;
import com.interviewplatform.backend.candidate.dto.profile.SkillResponse;
import com.interviewplatform.backend.candidate.dto.profile.TargetResponse;
import com.interviewplatform.backend.candidate.service.CandidateProfileService;
import com.interviewplatform.backend.dto.UpdateUserRequest;
import com.interviewplatform.backend.dto.UserResponse;
import com.interviewplatform.backend.service.AvatarService;
import com.interviewplatform.backend.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/candidate")
public class CandidateProfileController {

    // User Service
    private final UserService userService;

    // Candidate Profile Service
    private final CandidateProfileService candidateProfileService;
    private final AvatarService avatarService;

    // Constructor
    public CandidateProfileController(
            UserService userService,
            CandidateProfileService candidateProfileService,
            AvatarService avatarService
    ) {
        this.userService = userService;
        this.candidateProfileService = candidateProfileService;
        this.avatarService = avatarService;
    }

    // Update Profile
    @PutMapping("/profile")
    public UserResponse updateProfile(
            @RequestBody UpdateUserRequest request
    ) {
        return userService.updateProfile(request);
    }

    // Upload Candidate Avatar
    @PostMapping(value = "/avatar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserResponse uploadAvatar(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        com.interviewplatform.backend.model.User user = userService.getLoggedInUser();
        com.interviewplatform.backend.model.User updatedUser = avatarService.uploadAvatar(user, file);
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

    // Remove Candidate Avatar
    @DeleteMapping("/avatar")
    public UserResponse removeAvatar() {
        com.interviewplatform.backend.model.User user = userService.getLoggedInUser();
        com.interviewplatform.backend.model.User updatedUser = avatarService.removeAvatar(user);
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

    // Add Skill
    @PostMapping("/skills")
    public SkillResponse addSkill(
            @RequestBody AddSkillRequest request
    ) {
        return candidateProfileService.addSkill(request);
    }

    // Delete Skill
    @DeleteMapping("/skills/{skill}")
    public void deleteSkill(
            @PathVariable String skill
    ) {
        candidateProfileService.deleteSkill(skill);
    }

    // Add Target
    @PostMapping("/targets")
    public TargetResponse addTarget(
            @RequestBody AddTargetRequest request
    ) {
        return candidateProfileService.addTarget(request);
    }

    // Delete Target
    @DeleteMapping("/targets/{target}")
    public void deleteTarget(
            @PathVariable String target
    ) {
        candidateProfileService.deleteTarget(target);
    }
}