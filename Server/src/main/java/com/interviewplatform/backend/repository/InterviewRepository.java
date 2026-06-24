package com.interviewplatform.backend.repository;

import com.interviewplatform.backend.model.Interview;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InterviewRepository
        extends MongoRepository<Interview, String> {

}