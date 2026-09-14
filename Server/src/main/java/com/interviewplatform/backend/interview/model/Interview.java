// Interview model

package com.interviewplatform.backend.interview.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Document(collection = "interview_rooms")
public class Interview {

    @Id
    private String id;

    private String roomId;

    private String title;

    private String targetRole;

    private String interviewType;

    private String interviewerId;

    private String candidateId;

    private String candidateEmail;

    private String observerId;

    private String candidateNotes;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    private LocalDateTime updatedAt;

    // Evaluation scores
    private Integer candidateScore;

    private Integer interviewerScore;

    // Code state snapshot
    private String currentCode;

    private String language;

    private Map<String, String> codes;


    // Constructor

    public Interview() {
    }


    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public String getInterviewType() {
        return interviewType;
    }

    public void setInterviewType(String interviewType) {
        this.interviewType = interviewType;
    }

    public String getInterviewerId() {
        return interviewerId;
    }

    public void setInterviewerId(String interviewerId) {
        this.interviewerId = interviewerId;
    }

    public String getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(String candidateId) {
        this.candidateId = candidateId;
    }

    public String getCandidateEmail() {
        return candidateEmail;
    }

    public void setCandidateEmail(String candidateEmail) {
        this.candidateEmail = candidateEmail;
    }

    public String getObserverId() {
        return observerId;
    }

    public void setObserverId(String observerId) {
        this.observerId = observerId;
    }

    public String getCandidateNotes() {
        return candidateNotes;
    }

    public void setCandidateNotes(String candidateNotes) {
        this.candidateNotes = candidateNotes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Integer getCandidateScore() {
        return candidateScore;
    }

    public void setCandidateScore(Integer candidateScore) {
        this.candidateScore = candidateScore;
    }

    public Integer getInterviewerScore() {
        return interviewerScore;
    }

    public void setInterviewerScore(Integer interviewerScore) {
        this.interviewerScore = interviewerScore;
    }

    public String getCurrentCode() {
        return currentCode;
    }

    public void setCurrentCode(String currentCode) {
        this.currentCode = currentCode;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Map<String, String> getCodes() {
        if (codes == null) {
            codes = new HashMap<>();
        }
        return codes;
    }

    public void setCodes(Map<String, String> codes) {
        this.codes = codes;
    }
}