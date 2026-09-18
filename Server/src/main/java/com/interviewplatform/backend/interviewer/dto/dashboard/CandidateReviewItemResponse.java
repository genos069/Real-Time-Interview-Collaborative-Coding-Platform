package com.interviewplatform.backend.interviewer.dto.dashboard;

import java.time.LocalDateTime;

public class CandidateReviewItemResponse {

    private String candidateId;
    private String candidateName;
    private String candidateEmail;
    private String targetRole;
    private Integer score;
    private String interviewId;
    private String roomId;
    private String interviewTitle;
    private String decision;
    private String initials;
    private String color;
    private LocalDateTime createdAt;

    public CandidateReviewItemResponse() {
    }

    public CandidateReviewItemResponse(
            String candidateId,
            String candidateName,
            String candidateEmail,
            String targetRole,
            Integer score,
            String interviewId,
            String roomId,
            String interviewTitle,
            String decision,
            String initials,
            String color,
            LocalDateTime createdAt
    ) {
        this.candidateId = candidateId;
        this.candidateName = candidateName;
        this.candidateEmail = candidateEmail;
        this.targetRole = targetRole;
        this.score = score;
        this.interviewId = interviewId;
        this.roomId = roomId;
        this.interviewTitle = interviewTitle;
        this.decision = decision;
        this.initials = initials;
        this.color = color;
        this.createdAt = createdAt;
    }

    public String getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(String candidateId) {
        this.candidateId = candidateId;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public String getCandidateEmail() {
        return candidateEmail;
    }

    public void setCandidateEmail(String candidateEmail) {
        this.candidateEmail = candidateEmail;
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public String getInterviewId() {
        return interviewId;
    }

    public void setInterviewId(String interviewId) {
        this.interviewId = interviewId;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getInterviewTitle() {
        return interviewTitle;
    }

    public void setInterviewTitle(String interviewTitle) {
        this.interviewTitle = interviewTitle;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getInitials() {
        return initials;
    }

    public void setInitials(String initials) {
        this.initials = initials;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
