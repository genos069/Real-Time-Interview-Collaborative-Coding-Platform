package com.interviewplatform.backend.service;

import com.interviewplatform.backend.dto.CreateInterviewRequest;
import com.interviewplatform.backend.model.Interview;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.InterviewRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import com.interviewplatform.backend.dto.UpdateInterviewRequest;
import java.util.UUID;

import java.util.List;

@Service
public class InterviewService {

    // Interview Repository
    private final InterviewRepository interviewRepository;

    // User Service
    private final UserService userService;

    // Constructor
    public InterviewService(
            InterviewRepository interviewRepository,
            UserService userService
    ) {
        this.interviewRepository = interviewRepository;
        this.userService = userService;
    }

    // Create Interview
    public Interview createInterview(CreateInterviewRequest request) {

        // Role Validation
        User loggedInUser = userService.getLoggedInUser();

        if (!loggedInUser.getRole().equalsIgnoreCase("interviewer")) {
            throw new RuntimeException(
                    "Only interviewers can create interviews"
            );
        }

        // Create Interview Object
        Interview interview = new Interview();

        interview.setTitle(
                request.getTitle()
        );

        interview.setInterviewerId(
                request.getInterviewerId()
        );

        interview.setCandidateIds(
                request.getCandidateIds()
        );

        interview.setScheduledAt(
                request.getScheduledAt()
        );

        interview.setStatus("SCHEDULED");

        // Creation Time
        interview.setCreatedAt(
                LocalDateTime.now()
        );

        String roomId =
                "INT-" +
                        UUID.randomUUID()
                                .toString()
                                .substring(0, 8)
                                .toUpperCase();

        interview.setRoomId(roomId);

        // Save Interview
        return interviewRepository.save(interview);
    }

    // Get All Interviews
    public List<Interview> getAllInterviews() {
        return interviewRepository.findAll();
    }

    // Get Interview By ID
    public Interview getInterviewById(String interviewId) {

        // Find Interview
        return interviewRepository.findById(interviewId)
                .orElseThrow(() ->
                        new RuntimeException("Interview not found")
                );
    }

    // Update Interview
    public Interview updateInterview(
            String interviewId,
            UpdateInterviewRequest request
    ) {

        // Find Interview
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() ->
                        new RuntimeException("Interview not found")
                );

        // Role Validation
        User loggedInUser = userService.getLoggedInUser();

        if (!loggedInUser.getRole().equalsIgnoreCase("interviewer")) {
            throw new RuntimeException(
                    "Only interviewers can update interviews"
            );
        }

        // Update Fields
        interview.setTitle(
                request.getTitle()
        );

        interview.setCandidateIds(
                request.getCandidateIds()
        );

        interview.setScheduledAt(
                request.getScheduledAt()
        );

        interview.setStatus(
                request.getStatus()
        );

        // Save Changes
        return interviewRepository.save(interview);
    }

    // Delete Interview
    public void deleteInterview(String interviewId) {

        // Find Interview
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() ->
                        new RuntimeException("Interview not found")
                );

        // Role Validation
        User loggedInUser = userService.getLoggedInUser();

        if (!loggedInUser.getRole().equalsIgnoreCase("interviewer")) {
            throw new RuntimeException(
                    "Only interviewers can delete interviews"
            );
        }

        // Delete Interview
        interviewRepository.delete(interview);
    }

    // Start Interview
    public Interview startInterview(
            String id
    ) {

        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Interview not found"
                        ));

        interview.setStatus("ONGOING");

        return interviewRepository.save(interview);
    }
}