package com.interviewplatform.backend.interview.controller;

import com.interviewplatform.backend.interview.dto.CreateInterviewRequest;
import com.interviewplatform.backend.interview.dto.InterviewRoomScoresResponse;
import com.interviewplatform.backend.interview.dto.InterviewScoreRequest;
import com.interviewplatform.backend.interview.dto.InterviewScoreResponse;
import com.interviewplatform.backend.interview.dto.RunInterviewCodeRequest;
import com.interviewplatform.backend.interview.dto.RunInterviewCodeResponse;
import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.model.InterviewScore;
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

    // Get interview room details
    @GetMapping("/{roomId}")
    public ResponseEntity<Interview> getInterviewByRoomId(
            @PathVariable String roomId
    ) {
        Interview interview =
                interviewService.getInterviewByRoomId(roomId);

        return ResponseEntity.ok(interview);
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

    // Finish / End interview
    @PostMapping({ "/{roomId}/finish", "/{roomId}/end" })
    public ResponseEntity<Interview> finishInterview(
            @PathVariable String roomId
    ) {

        Interview interview =
                interviewService.finishInterview(roomId);

        return ResponseEntity.ok(interview);
    }

    // Submit score (unified endpoint)
    @PostMapping("/score")
    public ResponseEntity<InterviewScoreResponse> submitScore(
            @RequestBody InterviewScoreRequest request
    ) {
        String targetId = request.getInterviewId();
        InterviewScore score = interviewService.submitScore(targetId, request.getScore());
        return ResponseEntity.status(HttpStatus.CREATED).body(InterviewScoreResponse.fromEntity(score));
    }

    // Submit score with roomId in path
    @PostMapping("/{roomId}/score")
    public ResponseEntity<InterviewScoreResponse> submitScoreWithRoomId(
            @PathVariable String roomId,
            @RequestBody InterviewScoreRequest request
    ) {
        Integer scoreValue = request != null ? request.getScore() : null;
        InterviewScore score = interviewService.submitScore(roomId, scoreValue);
        return ResponseEntity.status(HttpStatus.CREATED).body(InterviewScoreResponse.fromEntity(score));
    }

    // Get bidirectional scores for a specific interview room
    @GetMapping("/{roomId}/scores")
    public ResponseEntity<InterviewRoomScoresResponse> getInterviewScores(
            @PathVariable String roomId
    ) {
        return ResponseEntity.ok(interviewService.getInterviewScores(roomId));
    }

    // Get all scores submitted by current user
    @GetMapping("/scores/given")
    public ResponseEntity<List<InterviewScoreResponse>> getScoresGivenByCurrentUser() {
        return ResponseEntity.ok(interviewService.getScoresGivenByCurrentUser());
    }

    // Get all scores received by current user
    @GetMapping("/scores/received")
    public ResponseEntity<List<InterviewScoreResponse>> getScoresReceivedByCurrentUser() {
        return ResponseEntity.ok(interviewService.getScoresReceivedByCurrentUser());
    }

    // Score candidate (legacy endpoint)
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


    // Score interviewer (legacy endpoint)
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

    // Get code snapshot
    @GetMapping("/{roomId}/code")
    public ResponseEntity<Map<String, String>> getCodeSnapshot(
            @PathVariable String roomId
    ) {

        Map<String, String> snapshot =
                interviewService.getCodeSnapshot(roomId);

        return ResponseEntity.ok(snapshot);
    }

    // Run interview code directly
    @PostMapping("/{roomId}/run")
    public ResponseEntity<RunInterviewCodeResponse> runCode(
            @PathVariable String roomId,
            @RequestBody RunInterviewCodeRequest request
    ) {

        RunInterviewCodeResponse response =
                interviewService.runCode(roomId, request);

        return ResponseEntity.ok(response);
    }
}