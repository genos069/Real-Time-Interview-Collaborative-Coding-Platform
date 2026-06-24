package com.interviewplatform.backend.service;

import com.interviewplatform.backend.dto.CreateInterviewRequest;
import com.interviewplatform.backend.model.Interview;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.InterviewRepository;
import org.springframework.stereotype.Service;

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

        // Save Interview
        return interviewRepository.save(interview);
    }

    // Get All Interviews
    public List<Interview> getAllInterviews() {
        return interviewRepository.findAll();
    }
}