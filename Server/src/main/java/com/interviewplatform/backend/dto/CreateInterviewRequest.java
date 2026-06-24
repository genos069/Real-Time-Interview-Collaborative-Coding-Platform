package com.interviewplatform.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class CreateInterviewRequest {

    private String title;

    private String interviewerId;

    private List<String> candidateIds;

    private LocalDateTime scheduledAt;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getInterviewerId() {
        return interviewerId;
    }

    public void setInterviewerId(String interviewerId) {
        this.interviewerId = interviewerId;
    }

    public List<String> getCandidateIds() {
        return candidateIds;
    }

    public void setCandidateIds(List<String> candidateIds) {
        this.candidateIds = candidateIds;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }
}