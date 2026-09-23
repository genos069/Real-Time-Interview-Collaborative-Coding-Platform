package com.interviewplatform.backend.bot.repository;

import com.interviewplatform.backend.bot.entity.Interview;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface AIInterviewRepository extends MongoRepository<Interview, String> {
    List<Interview> findByUserIdOrderByCreatedAtDesc(String userId);

    @Query(value = "{ 'userId': ?0 }", fields = "{ 'questions': 0, 'answers': 0, 'evaluation.questionAnalysis': 0, 'evaluation.strengths': 0, 'evaluation.weaknesses': 0, 'evaluation.improvements': 0, 'evaluation.hiringRecommendation': 0 }", sort = "{ 'createdAt': -1 }")
    List<Interview> findSummaryByUserIdOrderByCreatedAtDesc(String userId);
}
