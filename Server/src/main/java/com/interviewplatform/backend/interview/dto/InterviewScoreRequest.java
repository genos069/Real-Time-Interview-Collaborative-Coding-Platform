package com.interviewplatform.backend.interview.dto;

public class InterviewScoreRequest {

    private String interviewId;

    private Integer score;

    // Constructors

    public InterviewScoreRequest() {
    }

    public InterviewScoreRequest(Integer score) {
        this.score = score;
    }

    public InterviewScoreRequest(String interviewId, Integer score) {
        this.interviewId = interviewId;
        this.score = score;
    }

    // Getters and Setters

    public String getInterviewId() {
        return interviewId;
    }

    public void setInterviewId(String interviewId) {
        this.interviewId = interviewId;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }
}