package com.interviewplatform.backend.candidate.controller;

import com.interviewplatform.backend.candidate.dto.dashboard.DashboardResponse;
import com.interviewplatform.backend.candidate.service.CandidateDashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/candidate/dashboard")
public class CandidateDashboardController {

    // Dashboard Service
    private final CandidateDashboardService dashboardService;

    // Constructor
    public CandidateDashboardController(
            CandidateDashboardService dashboardService
    ) {
        this.dashboardService = dashboardService;
    }

    // Dashboard API
    @GetMapping
    public DashboardResponse getDashboard() {

        // Return Dashboard
        return dashboardService.getDashboard();
    }
}