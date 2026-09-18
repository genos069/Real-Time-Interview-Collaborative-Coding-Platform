package com.interviewplatform.backend.interviewer.controller;

import com.interviewplatform.backend.interviewer.dto.dashboard.InterviewerDashboardResponse;
import com.interviewplatform.backend.interviewer.service.InterviewerDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/interviewer/dashboard")
public class InterviewerDashboardController {

    private final InterviewerDashboardService dashboardService;

    public InterviewerDashboardController(InterviewerDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public ResponseEntity<InterviewerDashboardResponse> getDashboard() {
        return ResponseEntity.ok(dashboardService.getDashboard());
    }
}
