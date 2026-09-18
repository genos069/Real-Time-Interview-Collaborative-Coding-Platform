package com.interviewplatform.backend.interview.dto;

import java.util.ArrayList;
import java.util.List;

public class InterviewRoomScoresResponse {

    private String interviewId;
    private String roomId;
    private Integer candidateScore; // Score given to the candidate (by interviewer)
    private Integer interviewerScore; // Score given to the interviewer (by candidate)
    private List<InterviewScoreResponse> scores = new ArrayList<>();

    public InterviewRoomScoresResponse() {
    }

    public InterviewRoomScoresResponse(
            String interviewId,
            String roomId,
            Integer candidateScore,
            Integer interviewerScore,
            List<InterviewScoreResponse> scores
    ) {
        this.interviewId = interviewId;
        this.roomId = roomId;
        this.candidateScore = candidateScore;
        this.interviewerScore = interviewerScore;
        this.scores = scores != null ? scores : new ArrayList<>();
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

    public List<InterviewScoreResponse> getScores() {
        return scores;
    }

    public void setScores(List<InterviewScoreResponse> scores) {
        this.scores = scores;
    }
}
