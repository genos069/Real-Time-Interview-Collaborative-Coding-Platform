package com.interviewplatform.backend.interviewer.dto.dashboard;

import java.util.ArrayList;
import java.util.List;

public class InterviewerDashboardResponse {

    private int interviewsConducted;

    private int candidatesReviewed;

    private Double averageScoreGiven;

    private List<CandidateReviewItemResponse> recentCandidateReviews = new ArrayList<>();

    public InterviewerDashboardResponse() {
    }

    public InterviewerDashboardResponse(
            int interviewsConducted,
            int candidatesReviewed,
            Double averageScoreGiven,
            List<CandidateReviewItemResponse> recentCandidateReviews
    ) {
        this.interviewsConducted = interviewsConducted;
        this.candidatesReviewed = candidatesReviewed;
        this.averageScoreGiven = averageScoreGiven;
        this.recentCandidateReviews = recentCandidateReviews != null ? recentCandidateReviews : new ArrayList<>();
    }

    public int getInterviewsConducted() {
        return interviewsConducted;
    }

    public void setInterviewsConducted(int interviewsConducted) {
        this.interviewsConducted = interviewsConducted;
    }

    public int getCandidatesReviewed() {
        return candidatesReviewed;
    }

    public void setCandidatesReviewed(int candidatesReviewed) {
        this.candidatesReviewed = candidatesReviewed;
    }

    public Double getAverageScoreGiven() {
        return averageScoreGiven;
    }

    public void setAverageScoreGiven(Double averageScoreGiven) {
        this.averageScoreGiven = averageScoreGiven;
    }

    public List<CandidateReviewItemResponse> getRecentCandidateReviews() {
        return recentCandidateReviews;
    }

    public void setRecentCandidateReviews(List<CandidateReviewItemResponse> recentCandidateReviews) {
        this.recentCandidateReviews = recentCandidateReviews;
    }
}
