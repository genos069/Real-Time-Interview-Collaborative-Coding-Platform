package com.interviewplatform.backend.interview.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "interview_scores")
@CompoundIndex(name = "interview_scorer_recipient_idx", def = "{'interviewId': 1, 'scorerUserId': 1, 'recipientUserId': 1}", unique = true)
public class InterviewScore {

    @Id
    private String id;

    private String interviewId;

    private String roomId;

    private String scorerUserId;

    private String scorerRole;

    private String recipientUserId;

    private String recipientRole;

    private Integer score;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public InterviewScore() {
    }

    public InterviewScore(
            String interviewId,
            String roomId,
            String scorerUserId,
            String scorerRole,
            String recipientUserId,
            String recipientRole,
            Integer score,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.interviewId = interviewId;
        this.roomId = roomId;
        this.scorerUserId = scorerUserId;
        this.scorerRole = scorerRole;
        this.recipientUserId = recipientUserId;
        this.recipientRole = recipientRole;
        this.score = score;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getScorerUserId() {
        return scorerUserId;
    }

    public void setScorerUserId(String scorerUserId) {
        this.scorerUserId = scorerUserId;
    }

    public String getScorerRole() {
        return scorerRole;
    }

    public void setScorerRole(String scorerRole) {
        this.scorerRole = scorerRole;
    }

    public String getRecipientUserId() {
        return recipientUserId;
    }

    public void setRecipientUserId(String recipientUserId) {
        this.recipientUserId = recipientUserId;
    }

    public String getRecipientRole() {
        return recipientRole;
    }

    public void setRecipientRole(String recipientRole) {
        this.recipientRole = recipientRole;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
