package com.interviewplatform.backend.candidate.dto.dashboard;

import com.interviewplatform.backend.candidate.dto.practice.PracticeQuestionResponse;

import java.util.List;

public class DashboardResponse {

    private DashboardUserResponse user;

    private DashboardStatsResponse stats;

    private SkillBreakdownResponse skillBreakdown;

    private List<ReadinessPoint> progressHistory;

    private List<PracticeQuestionResponse> practiceQuestions;

    private List<SessionResponse> mockSessions;

    private RecentSessionResponse lastMockResult;

    private List<Object> rooms;

    private List<String> skills;

    private List<String> targets;

    private List<Object> experience;

    private int totalCompletedRealInterviews;

    private int totalCompletedMockInterviews;

    private Double averageRealInterviewScore;

    public DashboardResponse() {
    }

    public DashboardUserResponse getUser() {
        return user;
    }

    public void setUser(DashboardUserResponse user) {
        this.user = user;
    }

    public DashboardStatsResponse getStats() {
        return stats;
    }

    public void setStats(DashboardStatsResponse stats) {
        this.stats = stats;
    }

    public SkillBreakdownResponse getSkillBreakdown() {
        return skillBreakdown;
    }

    public void setSkillBreakdown(SkillBreakdownResponse skillBreakdown) {
        this.skillBreakdown = skillBreakdown;
    }

    public List<ReadinessPoint> getProgressHistory() {
        return progressHistory;
    }

    public void setProgressHistory(List<ReadinessPoint> progressHistory) {
        this.progressHistory = progressHistory;
    }

    public List<PracticeQuestionResponse> getPracticeQuestions() {
        return practiceQuestions;
    }

    public void setPracticeQuestions(List<PracticeQuestionResponse> practiceQuestions) {
        this.practiceQuestions = practiceQuestions;
    }

    public List<SessionResponse> getMockSessions() {
        return mockSessions;
    }

    public void setMockSessions(List<SessionResponse> mockSessions) {
        this.mockSessions = mockSessions;
    }

    public RecentSessionResponse getLastMockResult() {
        return lastMockResult;
    }

    public void setLastMockResult(RecentSessionResponse lastMockResult) {
        this.lastMockResult = lastMockResult;
    }

    public List<Object> getRooms() {
        return rooms;
    }

    public void setRooms(List<Object> rooms) {
        this.rooms = rooms;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    public List<String> getTargets() {
        return targets;
    }

    public void setTargets(List<String> targets) {
        this.targets = targets;
    }

    public List<Object> getExperience() {
        return experience;
    }

    public void setExperience(List<Object> experience) {
        this.experience = experience;
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