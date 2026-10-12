package com.interviewplatform.backend.candidate.service;

import com.interviewplatform.backend.candidate.dto.profile.AddSkillRequest;
import com.interviewplatform.backend.candidate.dto.profile.AddTargetRequest;
import com.interviewplatform.backend.candidate.dto.profile.SkillResponse;
import com.interviewplatform.backend.candidate.dto.profile.TargetResponse;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.UserService;
import org.springframework.stereotype.Service;

@Service
public class CandidateProfileService {

    // User Service
    private final UserService userService;

    // Constructor
    public CandidateProfileService(UserService userService) {
        this.userService = userService;
    }

    // Add Skill
    public SkillResponse addSkill(AddSkillRequest request) {

        User user = userService.getLoggedInUser();

        String skill = request.getSkill();

        if (skill == null || skill.trim().isEmpty()) {
            throw new RuntimeException("Skill is required.");
        }

        skill = skill.trim();

        if (user.getSkills().contains(skill)) {
            throw new RuntimeException("Skill already exists.");
        }

        user.getSkills().add(skill);

        userService.saveUser(user);

        return new SkillResponse(skill);
    }

    // Delete Skill
    public void deleteSkill(String skill) {

        User user = userService.getLoggedInUser();

        if (!user.getSkills().remove(skill)) {
            throw new RuntimeException("Skill not found.");
        }

        userService.saveUser(user);
    }

    // Add Target
    public TargetResponse addTarget(AddTargetRequest request) {

        User user = userService.getLoggedInUser();

        String target = request.getTarget();

        if (target == null || target.trim().isEmpty()) {
            throw new RuntimeException("Target is required.");
        }

        target = target.trim();

        if (user.getTargets().contains(target)) {
            throw new RuntimeException("Target already exists.");
        }

        user.getTargets().add(target);

        userService.saveUser(user);

        return new TargetResponse(target);
    }

    // Delete Target
    public void deleteTarget(String target) {

        User user = userService.getLoggedInUser();

        if (target != null) {
            String trimmed = target.trim();
            boolean removed = user.getTargets().removeIf(t -> t != null && t.trim().equalsIgnoreCase(trimmed));
            if (removed) {
                userService.saveUser(user);
                return;
            }
        }

        throw new RuntimeException("Target not found.");
    }
}