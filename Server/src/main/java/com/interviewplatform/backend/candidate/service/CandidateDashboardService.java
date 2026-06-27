package com.interviewplatform.backend.candidate.service;

import com.interviewplatform.backend.candidate.dto.dashboard.DashboardResponse;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.service.UserService;
import org.springframework.stereotype.Service;

@Service
public class CandidateDashboardService {

    // User Service
    private final UserService userService;

    // Constructor
    public CandidateDashboardService(UserService userService) {
        this.userService = userService;
    }

    // Get Dashboard
    public DashboardResponse getDashboard() {

        // Logged-in User
        User user = userService.getLoggedInUser();

        // Dashboard Response
        DashboardResponse response = new DashboardResponse();

        response.setName(user.getName());
        response.setQuestionsSolved(124);
        response.setReadinessScore(88);
        response.setPracticeHours(34);
        response.setMockSessions(9);

        // Return Response
        return response;
    }
}