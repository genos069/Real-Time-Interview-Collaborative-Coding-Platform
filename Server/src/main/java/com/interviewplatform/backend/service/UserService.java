package com.interviewplatform.backend.service;

import com.interviewplatform.backend.dto.AuthResponse;
import com.interviewplatform.backend.dto.LoginRequest;
import com.interviewplatform.backend.dto.UpdateUserRequest;
import com.interviewplatform.backend.dto.UserResponse;
import com.interviewplatform.backend.jwt.JwtUtil;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserService(
            UserRepository userRepository,
            BCryptPasswordEncoder passwordEncoder,
            JwtUtil jwtUtil
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // Register User
    public User registerUser(User user) {

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        if (user.getPassword().length() < 8) {
            throw new RuntimeException(
                    "Password must be at least 8 characters long"
            );
        }

        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        if (user.getTitle() == null) {
            user.setTitle("");
        }

        if (user.getLocation() == null) {
            user.setLocation("");
        }

        if (user.getAvatar() == null) {
            user.setAvatar("");
        }

        if (user.getAbout() == null) {
            user.setAbout("");
        }

        return userRepository.save(user);
    }

    // Login User
    public AuthResponse loginUser(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if (!user.getRole().equalsIgnoreCase(request.getRole())) {
            throw new RuntimeException("Invalid role selected");
        }

        boolean isPasswordCorrect = passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        );

        if (!isPasswordCorrect) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole()
        );

        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                token
        );
    }

    // Current User Response
    public UserResponse getCurrentUser() {

        User user = getLoggedInUser();

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getTitle(),
                user.getLocation(),
                user.getAvatar(),
                user.getAbout()
        );
    }

    // Logged-in User
    public User getLoggedInUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }

    // Update Profile
    public UserResponse updateProfile(
            UpdateUserRequest request
    ) {

        User user = getLoggedInUser();

        if (request.getName() != null) {
            user.setName(request.getName());
        }

        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }

        if (request.getTitle() != null) {
            user.setTitle(request.getTitle());
        }

        if (request.getLocation() != null) {
            user.setLocation(request.getLocation());
        }

        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }

        if (request.getAbout() != null) {
            user.setAbout(request.getAbout());
        }

        User updatedUser = userRepository.save(user);

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

    // Save User
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public User getUserByEmail(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );
    }
}