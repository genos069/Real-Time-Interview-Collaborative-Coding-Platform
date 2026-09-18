package com.interviewplatform.backend.interview.repository;

import com.interviewplatform.backend.interview.model.InterviewScore;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewScoreRepository extends MongoRepository<InterviewScore, String> {

    Optional<InterviewScore> findByInterviewIdAndScorerUserId(String interviewId, String scorerUserId);

    Optional<InterviewScore> findByRoomIdAndScorerUserId(String roomId, String scorerUserId);

    boolean existsByInterviewIdAndScorerUserId(String interviewId, String scorerUserId);

    boolean existsByRoomIdAndScorerUserId(String roomId, String scorerUserId);

    boolean existsByInterviewIdAndScorerUserIdAndRecipientUserId(String interviewId, String scorerUserId, String recipientUserId);

    List<InterviewScore> findByScorerUserIdOrderByCreatedAtDesc(String scorerUserId);

    List<InterviewScore> findByRecipientUserIdOrderByCreatedAtDesc(String recipientUserId);

    List<InterviewScore> findByRecipientUserIdAndScorerRoleOrderByCreatedAtDesc(String recipientUserId, String scorerRole);

    List<InterviewScore> findByScorerUserIdAndScorerRoleOrderByCreatedAtDesc(String scorerUserId, String scorerRole);

    List<InterviewScore> findByInterviewId(String interviewId);

    List<InterviewScore> findByRoomId(String roomId);
}
