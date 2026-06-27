package com.interviewplatform.backend.candidate.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private String name;

    private int questionsSolved;

    private int readinessScore;

    private int practiceHours;

    private int mockSessions;
}