package com.interviewplatform.backend.interviewer.service;

import com.interviewplatform.backend.bot.exception.ApiException;
import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.model.InterviewScore;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.repository.InterviewScoreRepository;
import com.interviewplatform.backend.interviewer.dto.dashboard.CandidateReviewItemResponse;
import com.interviewplatform.backend.interviewer.dto.dashboard.InterviewerDashboardResponse;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.UserRepository;
import com.interviewplatform.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InterviewerDashboardService {

    private final UserService userService;
    private final InterviewRepository interviewRepository;
    private final InterviewScoreRepository interviewScoreRepository;
    private final UserRepository userRepository;

    private static final String[] COLOR_PALETTE = {
            "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"
    };

    public InterviewerDashboardService(
            UserService userService,
            InterviewRepository interviewRepository,
            InterviewScoreRepository interviewScoreRepository,
            UserRepository userRepository
    ) {
        this.userService = userService;
        this.interviewRepository = interviewRepository;
        this.interviewScoreRepository = interviewScoreRepository;
        this.userRepository = userRepository;
    }

    public InterviewerDashboardResponse getDashboard() {
        User interviewer = userService.getLoggedInUser();
        if (interviewer == null) {
            throw new ApiException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        if (!"interviewer".equalsIgnoreCase(interviewer.getRole())) {
            throw new ApiException("Only interviewers can access interviewer dashboard", HttpStatus.FORBIDDEN);
        }

        List<Interview> completedInterviews = interviewRepository
                .findByInterviewerIdAndStatusOrderByCreatedAtDesc(interviewer.getId(), "COMPLETED");

        int interviewsConducted = completedInterviews.size();

        List<InterviewScore> scoresGiven = interviewScoreRepository != null
                ? interviewScoreRepository.findByScorerUserIdAndScorerRoleOrderByCreatedAtDesc(interviewer.getId(), "INTERVIEWER")
                : new ArrayList<>();

        int candidatesReviewed = scoresGiven.size();

        Double averageScoreGiven = null;
        if (!scoresGiven.isEmpty()) {
            double avg = scoresGiven.stream()
                    .mapToInt(InterviewScore::getScore)
                    .average()
                    .orElse(0.0);
            averageScoreGiven = Math.round(avg * 10.0) / 10.0;
        }

        Map<String, Interview> interviewByRoomId = completedInterviews.stream()
                .filter(i -> i.getRoomId() != null)
                .collect(Collectors.toMap(Interview::getRoomId, i -> i, (existing, replace) -> existing));

        Map<String, Interview> interviewById = completedInterviews.stream()
                .filter(i -> i.getId() != null)
                .collect(Collectors.toMap(Interview::getId, i -> i, (existing, replace) -> existing));

        List<CandidateReviewItemResponse> recentReviews = new ArrayList<>();
        int colorIndex = 0;

        for (InterviewScore score : scoresGiven) {
            Interview interview = null;
            if (score.getRoomId() != null) {
                interview = interviewByRoomId.get(score.getRoomId());
            }
            if (interview == null && score.getInterviewId() != null) {
                interview = interviewById.get(score.getInterviewId());
            }

            Optional<User> candidateOpt = score.getRecipientUserId() != null
                    ? userRepository.findById(score.getRecipientUserId())
                    : Optional.empty();

            String candidateName = "Candidate";
            String candidateEmail = "";
            String candidateTitle = "Software Engineer";
            if (candidateOpt.isPresent()) {
                User candidateUser = candidateOpt.get();
                if (candidateUser.getName() != null && !candidateUser.getName().trim().isEmpty()) {
                    candidateName = candidateUser.getName();
                } else if (interview != null && interview.getCandidateEmail() != null) {
                    candidateName = interview.getCandidateEmail();
                }
                if (candidateUser.getEmail() != null) {
                    candidateEmail = candidateUser.getEmail();
                } else if (interview != null && interview.getCandidateEmail() != null) {
                    candidateEmail = interview.getCandidateEmail();
                }
                if (candidateUser.getTitle() != null && !candidateUser.getTitle().trim().isEmpty()) {
                    candidateTitle = candidateUser.getTitle();
                }
            } else if (interview != null && interview.getCandidateEmail() != null) {
                candidateName = interview.getCandidateEmail();
                candidateEmail = interview.getCandidateEmail();
            }

            String targetRole = interview != null && interview.getTargetRole() != null
                    ? interview.getTargetRole()
                    : candidateTitle;

            String interviewTitle = interview != null ? interview.getTitle() : "Technical Interview";
            String roomId = score.getRoomId() != null ? score.getRoomId() : (interview != null ? interview.getRoomId() : "");

            int scoreVal = score.getScore() != null ? score.getScore() : 0;
            String decision = scoreVal >= 80 ? "Advance" : (scoreVal >= 60 ? "Hold" : "Reject");
            String initials = getInitials(candidateName);
            String color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
            colorIndex++;

            recentReviews.add(new CandidateReviewItemResponse(
                    score.getRecipientUserId(),
                    candidateName,
                    candidateEmail,
                    targetRole,
                    scoreVal,
                    score.getInterviewId(),
                    roomId,
                    interviewTitle,
                    decision,
                    initials,
                    color,
                    score.getCreatedAt()
            ));
        }

        return new InterviewerDashboardResponse(
                interviewsConducted,
                candidatesReviewed,
                averageScoreGiven,
                recentReviews
        );
    }

    private String getInitials(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "C";
        }
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        return ("" + parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
}
