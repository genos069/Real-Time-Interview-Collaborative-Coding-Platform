package com.interviewplatform.backend.config;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
public class MongoIndexConfig {

    private static final Logger log = LoggerFactory.getLogger(MongoIndexConfig.class);
    private final MongoTemplate mongoTemplate;

    public MongoIndexConfig(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initIndexes() {
        try {
            // interviews: userId + createdAt desc
            mongoTemplate.getCollection("interviews").createIndex(
                    new Document("userId", 1).append("createdAt", -1)
            );
            // interviews: candidateId + status
            mongoTemplate.getCollection("interviews").createIndex(
                    new Document("candidateId", 1).append("status", 1)
            );
            // question_submissions: userId + status
            mongoTemplate.getCollection("question_submissions").createIndex(
                    new Document("userId", 1).append("status", 1)
            );
            // interview_scores: recipientUserId + scorerRole
            mongoTemplate.getCollection("interview_scores").createIndex(
                    new Document("recipientUserId", 1).append("scorerRole", 1)
            );
            // users: email
            mongoTemplate.getCollection("users").createIndex(
                    new Document("email", 1)
            );
            // questions: difficulty
            mongoTemplate.getCollection("questions").createIndex(
                    new Document("difficulty", 1)
            );
            log.info("MongoDB secondary indexes verified/created successfully.");
        } catch (Exception e) {
            log.warn("Non-fatal: Could not ensure Mongo indexes: {}", e.getMessage());
        }
    }
}
