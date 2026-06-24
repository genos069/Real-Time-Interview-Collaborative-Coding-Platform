package com.interviewplatform.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class UpdateInterviewRequest {

    private String title;

    private List<String> candidateIds;

    private LocalDateTime scheduledAt;

    private String status;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}