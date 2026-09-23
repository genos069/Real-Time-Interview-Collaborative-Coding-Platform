package com.interviewplatform.backend.repository;

import com.interviewplatform.backend.model.QuestionSubmission;
import com.interviewplatform.backend.model.SubmissionStatus;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface QuestionSubmissionRepository extends MongoRepository<QuestionSubmission, String> {

    List<QuestionSubmission> findByUserId(String userId);

    List<QuestionSubmission> findByQuestionId(String questionId);

    List<QuestionSubmission> findByUserIdAndStatus(
            String userId,
            SubmissionStatus status
    );

    Optional<QuestionSubmission> findByUserIdAndQuestionId(
            String userId,
            String questionId
    );

    // Total Coding Time
    @Aggregation(pipeline = {
            "{ '$match': { 'userId': ?0 } }",
            "{ '$group': { '_id': null, 'total': { '$sum': '$codingTimeSeconds' } } }"
    })
    Long getTotalCodingTimeSeconds(String userId);

}