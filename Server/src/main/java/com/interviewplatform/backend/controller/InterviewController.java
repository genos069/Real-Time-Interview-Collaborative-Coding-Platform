package com.interviewplatform.backend.controller;

import com.interviewplatform.backend.dto.CreateInterviewRequest;
import com.interviewplatform.backend.model.Interview;
import com.interviewplatform.backend.service.InterviewService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.interviewplatform.backend.dto.UpdateInterviewRequest;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    // Interview Service
    private final InterviewService interviewService;

    // Constructor
    public InterviewController(
            InterviewService interviewService
    ) {
        this.interviewService = interviewService;
    }

    // Create Interview
    @PostMapping
    public Interview createInterview(
            @RequestBody CreateInterviewRequest request
    ) {
        return interviewService.createInterview(request);
    }

    // Get All Interviews
    @GetMapping
    public List<Interview> getAllInterviews() {
        return interviewService.getAllInterviews();
    }

    // Get Interview By ID
    @GetMapping("/{id}")
    public Interview getInterviewById(
            @PathVariable String id
    ) {
        return interviewService.getInterviewById(id);
    }

    // Update Interview
    @PutMapping("/{id}")
    public Interview updateInterview(
            @PathVariable String id,
            @RequestBody UpdateInterviewRequest request
    ) {
        return interviewService.updateInterview(
                id,
                request
        );
    }

    // Start Interview
    @PutMapping("/{id}/start")
    public Interview startInterview(
            @PathVariable String id
    ) {
        return interviewService.startInterview(id);
    }

    // Delete Interview
    @DeleteMapping("/{id}")
    public String deleteInterview(
            @PathVariable String id
    ) {

        interviewService.deleteInterview(id);

        return "Interview deleted successfully";
    }
}