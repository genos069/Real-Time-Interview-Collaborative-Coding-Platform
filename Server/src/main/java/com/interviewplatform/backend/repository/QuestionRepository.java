package com.interviewplatform.backend.repository;

import com.interviewplatform.backend.model.Difficulty;
import com.interviewplatform.backend.model.Question;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface QuestionRepository extends MongoRepository<Question, String> {

    // Find by MongoDB ID
    Optional<Question> findById(String id);

    // Find by External Problem ID
    Optional<Question> findByExternalProblemId(String externalProblemId);

    // Find by Difficulty
    List<Question> findByDifficulty(Difficulty difficulty);

    // Find by Category
    List<Question> findByCategoryIgnoreCase(String category);

    // Generic Full Question Summaries (used by Practice Questions feature and search)
    @Query(value = "{}", fields = "{ '_id': 1, 'title': 1, 'category': 1, 'difficulty': 1, 'estimatedTime': 1 }")
    List<Question> findAllSummary();

    @Query(value = "{ 'difficulty': ?0 }", fields = "{ '_id': 1, 'title': 1, 'category': 1, 'difficulty': 1, 'estimatedTime': 1 }")
    List<Question> findByDifficultySummary(Difficulty difficulty);

    // Dashboard Bounded Summaries (fast preview limited to 50 questions for Candidate Dashboard)
    @Aggregation(pipeline = {
            "{ '$project': { '_id': 1, 'title': 1, 'category': 1, 'difficulty': 1, 'estimatedTime': 1 } }",
            "{ '$limit': 50 }"
    })
    List<Question> findDashboardPracticeQuestionSummary();

    @Query(value = "{}", fields = "{ '_id': 1, 'title': 1, 'category': 1, 'difficulty': 1, 'estimatedTime': 1 }")
    List<Question> findSummary(Pageable pageable);

    @Query(value = "{ 'difficulty': ?0 }", fields = "{ '_id': 1, 'title': 1, 'category': 1, 'difficulty': 1, 'estimatedTime': 1 }")
    List<Question> findByDifficultySummary(Difficulty difficulty, Pageable pageable);

}