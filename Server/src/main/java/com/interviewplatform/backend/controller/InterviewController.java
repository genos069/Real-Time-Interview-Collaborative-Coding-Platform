package com.interviewplatform.backend.controller;

import com.interviewplatform.backend.dto.CreateInterviewRequest;
import com.interviewplatform.backend.model.Interview;
import com.interviewplatform.backend.service.InterviewService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @PostMapping
    public Interview createInterview(
            @RequestBody CreateInterviewRequest request) {

        return interviewService.createInterview(request);
    }

    @GetMapping
    public List<Interview> getAllInterviews() {
        return interviewService.getAllInterviews();
    }
}