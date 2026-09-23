package com.interviewplatform.backend.candidate.service;

import com.interviewplatform.backend.model.QuestionSubmission;
import com.interviewplatform.backend.model.SubmissionStatus;
import com.interviewplatform.backend.repository.QuestionSubmissionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class QuestionSubmissionService {

    private final QuestionSubmissionRepository questionSubmissionRepository;

    public QuestionSubmissionService(
            QuestionSubmissionRepository questionSubmissionRepository
    ) {
        this.questionSubmissionRepository = questionSubmissionRepository;
    }

    public QuestionSubmission saveSubmission(
            String userId,
            String questionId,
            String language,
            String code,
            int passedTestCases,
            int totalTestCases,
            long codingTimeSeconds
    ) {

        Optional<QuestionSubmission> existing =
                questionSubmissionRepository.findByUserIdAndQuestionId(
                        userId,
                        questionId
                );

        QuestionSubmission submission = existing.orElse(new QuestionSubmission());

        submission.setUserId(userId);
        submission.setQuestionId(questionId);
        submission.setLanguage(language);
        submission.setCode(code);
        submission.setCodingTimeSeconds(
                submission.getCodingTimeSeconds() + codingTimeSeconds
        );

        submission.setPassedTestCases(passedTestCases);
        submission.setTotalTestCases(totalTestCases);

        if (passedTestCases == totalTestCases) {
            submission.setStatus(SubmissionStatus.SOLVED);
        } else {
            submission.setStatus(SubmissionStatus.ATTEMPTED);
        }

        submission.setSubmittedAt(LocalDateTime.now());

        return questionSubmissionRepository.save(submission);
    }

    public boolean isSolved(String userId, String questionId) {

        return questionSubmissionRepository
                .findByUserIdAndQuestionId(userId, questionId)
                .map(s -> s.getStatus() == SubmissionStatus.SOLVED)
                .orElse(false);
    }

    public Set<String> getSolvedQuestionIds(String userId) {
        if (userId == null) {
            return Set.of();
        }

        return questionSubmissionRepository
                .findByUserIdAndStatus(userId, SubmissionStatus.SOLVED)
                .stream()
                .map(QuestionSubmission::getQuestionId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    public long getSolvedCount(String userId) {

        return questionSubmissionRepository
                .findByUserId(userId)
                .stream()
                .filter(s -> s.getStatus() == SubmissionStatus.SOLVED)
                .count();
    }

    // Total Coding Time
    public long getTotalCodingTimeSeconds(String userId) {

        Long totalCodingTime =
                questionSubmissionRepository.getTotalCodingTimeSeconds(userId);

        return totalCodingTime == null ? 0L : totalCodingTime;
    }

    // Consolidated stats (single query to avoid 3 separate round trips)
    public UserSubmissionStats getUserSubmissionStats(String userId) {
        if (userId == null) {
            return new UserSubmissionStats(0L, 0L, Set.of());
        }

        List<QuestionSubmission> submissions = questionSubmissionRepository.findByUserId(userId);
        long solvedCount = 0;
        long totalCodingTime = 0;
        Set<String> solvedQuestionIds = new java.util.HashSet<>();

        for (QuestionSubmission s : submissions) {
            totalCodingTime += s.getCodingTimeSeconds();
            if (s.getStatus() == SubmissionStatus.SOLVED) {
                solvedCount++;
                if (s.getQuestionId() != null) {
                    solvedQuestionIds.add(s.getQuestionId());
                }
            }
        }

        return new UserSubmissionStats(solvedCount, totalCodingTime, solvedQuestionIds);
    }

    public static class UserSubmissionStats {
        private final long solvedCount;
        private final long totalCodingTimeSeconds;
        private final Set<String> solvedQuestionIds;

        public UserSubmissionStats(long solvedCount, long totalCodingTimeSeconds, Set<String> solvedQuestionIds) {
            this.solvedCount = solvedCount;
            this.totalCodingTimeSeconds = totalCodingTimeSeconds;
            this.solvedQuestionIds = solvedQuestionIds;
        }

        public long getSolvedCount() {
            return solvedCount;
        }

        public long getTotalCodingTimeSeconds() {
            return totalCodingTimeSeconds;
        }

        public Set<String> getSolvedQuestionIds() {
            return solvedQuestionIds;
        }
    }
}