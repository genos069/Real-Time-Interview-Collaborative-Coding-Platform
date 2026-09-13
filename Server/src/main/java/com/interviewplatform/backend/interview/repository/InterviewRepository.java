// Interview repository

package com.interviewplatform.backend.interview.repository;

import com.interviewplatform.backend.interview.model.Interview;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository
        extends MongoRepository<Interview, String> {


    Optional<Interview> findByRoomId(String roomId);

    // Interviewer current rooms

    List<Interview> findByInterviewerIdAndStatusInOrderByCreatedAtDesc(
            String interviewerId,
            List<String> statuses
    );


    // Interviewer history

    List<Interview> findByInterviewerIdAndStatusOrderByCreatedAtDesc(
            String interviewerId,
            String status
    );


    // Candidate current rooms

    List<Interview> findByCandidateIdAndStatusInOrderByCreatedAtDesc(
            String candidateId,
            List<String> statuses
    );


    // Candidate history

    List<Interview> findByCandidateIdAndStatusOrderByCreatedAtDesc(
            String candidateId,
            String status
    );
}