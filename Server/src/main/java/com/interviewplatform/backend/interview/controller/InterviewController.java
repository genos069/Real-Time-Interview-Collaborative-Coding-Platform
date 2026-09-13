package com.interviewplatform.backend.interview.controller;

import com.interviewplatform.backend.interview.dto.CreateInterviewRequest;
import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.service.InterviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    // Service
    private final InterviewService interviewService;

    // Constructor
    public InterviewController(
            InterviewService interviewService
    ) {
        this.interviewService = interviewService;
    }

    // Create Interview
    @PostMapping
    public ResponseEntity<Interview> createInterview(
            @RequestBody CreateInterviewRequest request
    ) {

        Interview interview =
                interviewService.createInterview(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(interview);
    }

    // Current rooms

    @GetMapping("/current")
    public ResponseEntity<List<Interview>> getCurrentRooms() {

        return ResponseEntity.ok(
                interviewService.getCurrentRooms()
        );
    }

    // Start interview

    @PostMapping("/{roomId}/start")
    public ResponseEntity<Interview> startInterview(
            @PathVariable String roomId
    ) {

        Interview interview =
                interviewService.startInterview(roomId);

        return ResponseEntity.ok(interview);
    }


    // Interview history

    @GetMapping("/history")
    public ResponseEntity<List<Interview>> getInterviewHistory() {

        return ResponseEntity.ok(
                interviewService.getInterviewHistory()
        );
    }

    // Join interview

    @PostMapping("/{roomId}/join")
    public ResponseEntity<Interview> joinInterview(
            @PathVariable String roomId
    ) {

        Interview interview =
                interviewService.joinInterview(roomId);

        return ResponseEntity.ok(interview);
    }

    // End interview

    @PostMapping("/{roomId}/end")
    public ResponseEntity<Interview> endInterview(
            @PathVariable String roomId
    ) {

        Interview interview =
                interviewService.endInterview(roomId);

        return ResponseEntity.ok(interview);
    }

    // Score candidate
    @PutMapping("/{roomId}/score/candidate")
    public ResponseEntity<Interview> scoreCandidate(
            @PathVariable String roomId,
            @RequestBody Map<String, Integer> request
    ) {

        Interview interview =
                interviewService.scoreCandidate(
                        roomId,
                        request.get("score")
                );

        return ResponseEntity.ok(interview);
    }


    // Score interviewer
    @PutMapping("/{roomId}/score/interviewer")
    public ResponseEntity<Interview> scoreInterviewer(
            @PathVariable String roomId,
            @RequestBody Map<String, Integer> request
    ) {

        Interview interview =
                interviewService.scoreInterviewer(
                        roomId,
                        request.get("score")
                );

        return ResponseEntity.ok(interview);
    }
}