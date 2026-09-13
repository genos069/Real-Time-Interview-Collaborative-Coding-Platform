// Interview service

package com.interviewplatform.backend.interview.service;

import com.interviewplatform.backend.interview.dto.CreateInterviewRequest;
import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.UserRepository;
import com.interviewplatform.backend.service.UserService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class InterviewService {

    private final InterviewRepository interviewRepository;

    private final UserRepository userRepository;

    private final UserService userService;

    public InterviewService(
            InterviewRepository interviewRepository,
            UserRepository userRepository,
            UserService userService
    ) {
        this.interviewRepository = interviewRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }


    // Create Interview

    public Interview createInterview(
            CreateInterviewRequest request
    ) {

        // Get logged-in interviewer

        User interviewer =
                userService.getLoggedInUser();


        // Role validation

        if (!"interviewer".equalsIgnoreCase(
                interviewer.getRole()
        )) {

            throw new RuntimeException(
                    "Only interviewers can create interviews"
            );
        }


        // Find candidate

        User candidate =
                userRepository.findById(
                                request.getCandidateId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Candidate not found"
                                )
                        );


        // Candidate validation

        if (!"candidate".equalsIgnoreCase(
                candidate.getRole()
        )) {

            throw new RuntimeException(
                    "The selected user is not a candidate"
            );
        }


        // Create interview room

        Interview interview =
                new Interview();


        interview.setTitle(
                request.getTitle()
        );

        interview.setTargetRole(
                request.getTargetRole()
        );

        interview.setInterviewType(
                request.getInterviewType()
        );


        // Participants

        interview.setInterviewerId(
                interviewer.getId()
        );

        interview.setCandidateId(
                candidate.getId()
        );

        interview.setCandidateEmail(
                candidate.getEmail()
        );


        // Candidate notes

        interview.setCandidateNotes(
                request.getCandidateNotes()
        );


        // Generate unique room ID

        String roomId =
                "INT-" +
                        UUID.randomUUID()
                                .toString()
                                .substring(0, 8)
                                .toUpperCase();

        interview.setRoomId(roomId);


        // Initial status

        interview.setStatus(
                "CREATED"
        );


        // Creation timestamp

        LocalDateTime now =
                LocalDateTime.now();

        interview.setCreatedAt(now);

        interview.setUpdatedAt(now);


        // Save room

        return interviewRepository.save(
                interview
        );
    }

    // Current rooms

    public List<Interview> getCurrentRooms() {

        User user = userService.getLoggedInUser();

        List<String> activeStatuses = List.of(
                "CREATED",
                "ACTIVE"
        );

        if ("interviewer".equalsIgnoreCase(user.getRole())) {

            return interviewRepository
                    .findByInterviewerIdAndStatusInOrderByCreatedAtDesc(
                            user.getId(),
                            activeStatuses
                    );
        }

        if ("candidate".equalsIgnoreCase(user.getRole())) {

            return interviewRepository
                    .findByCandidateIdAndStatusInOrderByCreatedAtDesc(
                            user.getId(),
                            activeStatuses
                    );
        }

        throw new RuntimeException(
                "Invalid user role"
        );
    }

    // Start interview

    public Interview startInterview(String roomId) {

        // Get logged-in user

        User interviewer =
                userService.getLoggedInUser();


        // Role validation

        if (!"interviewer".equalsIgnoreCase(
                interviewer.getRole()
        )) {

            throw new RuntimeException(
                    "Only interviewers can start interviews"
            );
        }


        // Find interview

        Interview interview =
                interviewRepository.findByRoomId(roomId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Interview room not found"
                                )
                        );


        // Ownership validation

        if (!interviewer.getId().equals(
                interview.getInterviewerId()
        )) {

            throw new RuntimeException(
                    "You are not the interviewer of this room"
            );
        }


        // Status validation

        if (!"CREATED".equalsIgnoreCase(
                interview.getStatus()
        )) {

            throw new RuntimeException(
                    "Interview cannot be started. Current status: "
                            + interview.getStatus()
            );
        }


        // Start interview

        LocalDateTime now =
                LocalDateTime.now();

        interview.setStatus(
                "ACTIVE"
        );

        interview.setStartedAt(now);

        interview.setUpdatedAt(now);


        // Save interview

        return interviewRepository.save(
                interview
        );
    }

    // Join interview

    public Interview joinInterview(String roomId) {

        // Get logged-in user

        User candidate =
                userService.getLoggedInUser();


        // Role validation

        if (!"candidate".equalsIgnoreCase(
                candidate.getRole()
        )) {

            throw new RuntimeException(
                    "Only candidates can join interviews"
            );
        }


        // Find room

        Interview interview =
                interviewRepository.findByRoomId(roomId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Interview room not found"
                                )
                        );


        // Status validation

        if (!"ACTIVE".equalsIgnoreCase(
                interview.getStatus()
        )) {

            throw new RuntimeException(
                    "Interview is not active"
            );
        }


        // Candidate validation

        if (!candidate.getId().equals(
                interview.getCandidateId()
        )) {

            throw new RuntimeException(
                    "You are not the candidate assigned to this interview"
            );
        }


        // Return validated room

        return interview;
    }

    // End interview

    public Interview endInterview(String roomId) {

        // Get logged-in user

        User interviewer =
                userService.getLoggedInUser();


        // Role validation

        if (!"interviewer".equalsIgnoreCase(
                interviewer.getRole()
        )) {

            throw new RuntimeException(
                    "Only interviewers can end interviews"
            );
        }


        // Find interview

        Interview interview =
                interviewRepository.findByRoomId(roomId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Interview room not found"
                                )
                        );


        // Ownership validation

        if (!interviewer.getId().equals(
                interview.getInterviewerId()
        )) {

            throw new RuntimeException(
                    "You are not the interviewer of this room"
            );
        }


        // Status validation

        if (!"ACTIVE".equalsIgnoreCase(
                interview.getStatus()
        )) {

            throw new RuntimeException(
                    "Only active interviews can be ended"
            );
        }


        // End interview

        LocalDateTime now =
                LocalDateTime.now();

        interview.setStatus(
                "COMPLETED"
        );

        interview.setEndedAt(now);

        interview.setUpdatedAt(now);


        // Save interview

        return interviewRepository.save(
                interview
        );
    }

    // Submit candidate score

    public Interview submitCandidateScore(
            String roomId,
            Integer score
    ) {

        // Get logged-in user

        User interviewer =
                userService.getLoggedInUser();


        // Role validation

        if (!"interviewer".equalsIgnoreCase(
                interviewer.getRole()
        )) {

            throw new RuntimeException(
                    "Only interviewers can submit candidate scores"
            );
        }


        // Score validation

        if (score == null || score < 0 || score > 100) {

            throw new RuntimeException(
                    "Score must be between 0 and 100"
            );
        }


        // Find interview

        Interview interview =
                interviewRepository.findByRoomId(roomId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Interview room not found"
                                )
                        );


        // Ownership validation

        if (!interviewer.getId().equals(
                interview.getInterviewerId()
        )) {

            throw new RuntimeException(
                    "You are not the interviewer of this room"
            );
        }


        // Interview status validation

        if (!"COMPLETED".equalsIgnoreCase(
                interview.getStatus()
        )) {

            throw new RuntimeException(
                    "Interview must be completed before submitting evaluation"
            );
        }


        // Save candidate score

        interview.setCandidateScore(score);

        interview.setUpdatedAt(
                LocalDateTime.now()
        );


        // Save

        return interviewRepository.save(
                interview
        );
    }

    // Submit interviewer score

    public Interview submitInterviewerScore(
            String roomId,
            Integer score
    ) {

        // Get logged-in user

        User candidate =
                userService.getLoggedInUser();


        // Role validation

        if (!"candidate".equalsIgnoreCase(
                candidate.getRole()
        )) {

            throw new RuntimeException(
                    "Only candidates can submit interviewer scores"
            );
        }


        // Score validation

        if (score == null || score < 0 || score > 100) {

            throw new RuntimeException(
                    "Score must be between 0 and 100"
            );
        }


        // Find interview

        Interview interview =
                interviewRepository.findByRoomId(roomId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Interview room not found"
                                )
                        );


        // Ownership validation

        if (!candidate.getId().equals(
                interview.getCandidateId()
        )) {

            throw new RuntimeException(
                    "You are not the candidate assigned to this room"
            );
        }


        // Interview status validation

        if (!"COMPLETED".equalsIgnoreCase(
                interview.getStatus()
        )) {

            throw new RuntimeException(
                    "Interview must be completed before submitting evaluation"
            );
        }


        // Save interviewer score

        interview.setInterviewerScore(score);

        interview.setUpdatedAt(
                LocalDateTime.now()
        );


        // Save

        return interviewRepository.save(
                interview
        );
    }

    // History

    public List<Interview> getInterviewHistory() {

        User user = userService.getLoggedInUser();

        if ("interviewer".equalsIgnoreCase(user.getRole())) {

            return interviewRepository
                    .findByInterviewerIdAndStatusOrderByCreatedAtDesc(
                            user.getId(),
                            "COMPLETED"
                    );
        }

        if ("candidate".equalsIgnoreCase(user.getRole())) {

            return interviewRepository
                    .findByCandidateIdAndStatusOrderByCreatedAtDesc(
                            user.getId(),
                            "COMPLETED"
                    );
        }

        throw new RuntimeException(
                "Invalid user role"
        );
    }

    // Score candidate
    public Interview scoreCandidate(
            String roomId,
            Integer score
    ) {

        // Get interviewer
        User interviewer =
                userService.getLoggedInUser();

        // Role validation
        if (!"interviewer".equalsIgnoreCase(
                interviewer.getRole()
        )) {
            throw new RuntimeException(
                    "Only interviewers can score candidates"
            );
        }

        // Validate score
        if (score == null || score < 0 || score > 100) {
            throw new RuntimeException(
                    "Score must be between 0 and 100"
            );
        }

        // Find interview
        Interview interview =
                interviewRepository.findByRoomId(roomId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Interview room not found"
                                )
                        );

        // Ownership validation
        if (!interviewer.getId().equals(
                interview.getInterviewerId()
        )) {
            throw new RuntimeException(
                    "You are not the interviewer of this room"
            );
        }

        // Set score
        interview.setCandidateScore(score);

        interview.setUpdatedAt(
                LocalDateTime.now()
        );

        // Save
        return interviewRepository.save(interview);
    }


    // Score interviewer
    public Interview scoreInterviewer(
            String roomId,
            Integer score
    ) {

        // Get candidate
        User candidate =
                userService.getLoggedInUser();

        // Role validation
        if (!"candidate".equalsIgnoreCase(
                candidate.getRole()
        )) {
            throw new RuntimeException(
                    "Only candidates can score interviewers"
            );
        }

        // Validate score
        if (score == null || score < 0 || score > 100) {
            throw new RuntimeException(
                    "Score must be between 0 and 100"
            );
        }

        // Find interview
        Interview interview =
                interviewRepository.findByRoomId(roomId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Interview room not found"
                                )
                        );

        // Ownership validation
        if (!candidate.getId().equals(
                interview.getCandidateId()
        )) {
            throw new RuntimeException(
                    "You are not the candidate of this room"
            );
        }

        // Set score
        interview.setInterviewerScore(score);

        interview.setUpdatedAt(
                LocalDateTime.now()
        );

        // Save
        return interviewRepository.save(interview);
    }
}