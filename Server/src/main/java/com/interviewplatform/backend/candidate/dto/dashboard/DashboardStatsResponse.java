package com.interviewplatform.backend.candidate.dto.dashboard;

public class DashboardStatsResponse {

    private int questionsSolved;

    private long codingTimeSeconds;

    private int mockSessions;

    private int weeklyImprovement;

    private int totalCompletedRealInterviews;

    private int totalCompletedMockInterviews;

    private Double averageRealInterviewScore;

    public DashboardStatsResponse() {
    }

    public DashboardStatsResponse(
            int questionsSolved,
            long codingTimeSeconds,
            int mockSessions,
            int weeklyImprovement
    ) {
        this.questionsSolved = questionsSolved;
        this.codingTimeSeconds = codingTimeSeconds;
        this.mockSessions = mockSessions;
        this.weeklyImprovement = weeklyImprovement;
        this.totalCompletedMockInterviews = mockSessions;
    }

    public DashboardStatsResponse(
            int questionsSolved,
            long codingTimeSeconds,
            int mockSessions,
            int weeklyImprovement,
            int totalCompletedRealInterviews,
            int totalCompletedMockInterviews,
            Double averageRealInterviewScore
    ) {
        this.questionsSolved = questionsSolved;
        this.codingTimeSeconds = codingTimeSeconds;
        this.mockSessions = mockSessions;
        this.weeklyImprovement = weeklyImprovement;
        this.totalCompletedRealInterviews = totalCompletedRealInterviews;
        this.totalCompletedMockInterviews = totalCompletedMockInterviews;
        this.averageRealInterviewScore = averageRealInterviewScore;
    }

    public int getQuestionsSolved() {
        return questionsSolved;
    }

    public void setQuestionsSolved(int questionsSolved) {
        this.questionsSolved = questionsSolved;
    }

    public long getCodingTimeSeconds() {
        return codingTimeSeconds;
    }

    public void setCodingTimeSeconds(long codingTimeSeconds) {
        this.codingTimeSeconds = codingTimeSeconds;
    }

    public int getMockSessions() {
        return mockSessions;
    }

    public void setMockSessions(int mockSessions) {
        this.mockSessions = mockSessions;
    }

    public int getWeeklyImprovement() {
        return weeklyImprovement;
    }

    public void setWeeklyImprovement(int weeklyImprovement) {
        this.weeklyImprovement = weeklyImprovement;
    }

    public int getTotalCompletedRealInterviews() {
        return totalCompletedRealInterviews;
    }

    public void setTotalCompletedRealInterviews(int totalCompletedRealInterviews) {
        this.totalCompletedRealInterviews = totalCompletedRealInterviews;
    }

    public int getTotalCompletedMockInterviews() {
        return totalCompletedMockInterviews;
    }

    public void setTotalCompletedMockInterviews(int totalCompletedMockInterviews) {
        this.totalCompletedMockInterviews = totalCompletedMockInterviews;
    }

    public Double getAverageRealInterviewScore() {
        return averageRealInterviewScore;
    }

    public void setAverageRealInterviewScore(Double averageRealInterviewScore) {
        this.averageRealInterviewScore = averageRealInterviewScore;
    }
}