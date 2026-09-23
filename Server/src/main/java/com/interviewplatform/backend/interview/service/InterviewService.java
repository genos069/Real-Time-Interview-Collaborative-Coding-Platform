// Interview service

package com.interviewplatform.backend.interview.service;

import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerClient;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerRequest;
import com.interviewplatform.backend.integration.onlinecompiler.OnlineCompilerResponse;
import com.interviewplatform.backend.interview.dto.CreateInterviewRequest;
import com.interviewplatform.backend.interview.dto.InterviewRoomScoresResponse;
import com.interviewplatform.backend.interview.dto.InterviewScoreResponse;
import com.interviewplatform.backend.interview.dto.RunInterviewCodeRequest;
import com.interviewplatform.backend.interview.dto.RunInterviewCodeResponse;
import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.model.InterviewScore;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.repository.InterviewScoreRepository;
import com.interviewplatform.backend.interview.websocket.InterviewEventMessage;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.repository.UserRepository;
import com.interviewplatform.backend.bot.exception.ApiException;
import com.interviewplatform.backend.notification.model.NotificationType;
import com.interviewplatform.backend.notification.service.NotificationService;
import com.interviewplatform.backend.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class InterviewService {

    private static final Logger log = LoggerFactory.getLogger(InterviewService.class);

    private final InterviewRepository interviewRepository;

    private final UserRepository userRepository;

    private final UserService userService;

    private final OnlineCompilerClient onlineCompilerClient;

    private final InterviewScoreRepository interviewScoreRepository;

    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    private final NotificationService notificationService;

    @org.springframework.beans.factory.annotation.Autowired
    public InterviewService(
            InterviewRepository interviewRepository,
            UserRepository userRepository,
            UserService userService,
            OnlineCompilerClient onlineCompilerClient,
            @org.springframework.beans.factory.annotation.Autowired(required = false) InterviewScoreRepository interviewScoreRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate,
            @org.springframework.beans.factory.annotation.Autowired(required = false) NotificationService notificationService
    ) {
        this.interviewRepository = interviewRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.onlineCompilerClient = onlineCompilerClient;
        this.interviewScoreRepository = interviewScoreRepository;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
    }

    public InterviewService(
            InterviewRepository interviewRepository,
            UserRepository userRepository,
            UserService userService,
            OnlineCompilerClient onlineCompilerClient,
            InterviewScoreRepository interviewScoreRepository,
            org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate
    ) {
        this(interviewRepository, userRepository, userService, onlineCompilerClient, interviewScoreRepository, messagingTemplate, null);
    }

    public InterviewService(
            InterviewRepository interviewRepository,
            UserRepository userRepository,
            UserService userService,
            OnlineCompilerClient onlineCompilerClient,
            org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate
    ) {
        this(interviewRepository, userRepository, userService, onlineCompilerClient, null, messagingTemplate, null);
    }

    public InterviewService(
            InterviewRepository interviewRepository,
            UserRepository userRepository,
            UserService userService,
            OnlineCompilerClient onlineCompilerClient
    ) {
        this(interviewRepository, userRepository, userService, onlineCompilerClient, null, null, null);
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

            throw new ApiException(
                    "Only interviewers can create interviews",
                    HttpStatus.FORBIDDEN
            );
        }


        // Find candidate

        User candidate;
        if (request.getCandidateEmail() != null && !request.getCandidateEmail().trim().isEmpty()) {
            String email = request.getCandidateEmail().trim();
            candidate = userRepository.findByEmailIgnoreCase(email)
                    .orElseGet(() -> userRepository.findByEmail(email)
                            .orElseThrow(() ->
                                    new ApiException(
                                            "Candidate not found with email: " + email,
                                            HttpStatus.NOT_FOUND
                                    )
                            )
                    );
        } else if (request.getCandidateId() != null && !request.getCandidateId().trim().isEmpty()) {
            candidate = userRepository.findById(
                            request.getCandidateId().trim()
                    )
                    .orElseThrow(() ->
                            new ApiException(
                                    "Candidate not found",
                                    HttpStatus.NOT_FOUND
                            )
                    );
        } else {
            throw new ApiException(
                    "Candidate email or candidate ID is required",
                    HttpStatus.BAD_REQUEST
            );
        }


        // Candidate validation

        if (!"candidate".equalsIgnoreCase(
                candidate.getRole()
        )) {

            throw new ApiException(
                    "The selected user is not a candidate",
                    HttpStatus.BAD_REQUEST
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

        Interview savedInterview = interviewRepository.save(
                interview
        );

        if (notificationService != null) {
            String formattedTime = now.format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a"));
            notificationService.createAndSendNotification(
                    candidate.getId(),
                    NotificationType.INTERVIEW_SCHEDULED,
                    "Interview Scheduled",
                    "Your interview \"" + savedInterview.getTitle() + "\" has been scheduled for " + formattedTime + ".",
                    savedInterview.getId(),
                    savedInterview.getRoomId()
            );
        }

        return savedInterview;
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

    // Get interview by roomId with room membership authorization
    public Interview getInterviewByRoomId(String roomId) {
        if (roomId == null || roomId.trim().isEmpty()) {
            throw new ApiException("Room ID is required", HttpStatus.BAD_REQUEST);
        }

        Interview interview = interviewRepository.findByRoomId(roomId)
                .orElseThrow(() -> new ApiException("Interview room not found", HttpStatus.NOT_FOUND));

        User user = userService.getLoggedInUser();
        if (user == null) {
            throw new ApiException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        boolean authorized = false;
        if ("interviewer".equalsIgnoreCase(user.getRole())) {
            authorized = user.getId().equals(interview.getInterviewerId());
        } else if ("candidate".equalsIgnoreCase(user.getRole())) {
            authorized = user.getId().equals(interview.getCandidateId());
        } else if ("observer".equalsIgnoreCase(user.getRole())) {
            authorized = interview.getObserverId() != null && user.getId().equals(interview.getObserverId());
        }

        if (!authorized) {
            throw new ApiException("You are not authorized to access this interview room", HttpStatus.FORBIDDEN);
        }

        return interview;
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

        Interview savedInterview = interviewRepository.save(
                interview
        );

        log.info("Interview room {} started by interviewer {}", roomId, interviewer.getEmail());

        if (notificationService != null && savedInterview.getCandidateJoinedAt() == null) {
            notificationService.createAndSendNotification(
                    savedInterview.getCandidateId(),
                    NotificationType.INTERVIEWER_WAITING,
                    "Interviewer is Waiting",
                    "Your interviewer is waiting for you to join the interview.",
                    savedInterview.getId(),
                    savedInterview.getRoomId()
            );
        }

        return savedInterview;
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

    // Finish interview
    public Interview finishInterview(String roomId) {
        if (roomId == null || roomId.trim().isEmpty()) {
            throw new ApiException("Room ID is required", HttpStatus.BAD_REQUEST);
        }

        // Get logged-in user
        User interviewer = userService.getLoggedInUser();
        if (interviewer == null) {
            throw new ApiException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        // Role validation
        if (!"interviewer".equalsIgnoreCase(interviewer.getRole())) {
            throw new ApiException(
                    "Only interviewers can finish interviews",
                    HttpStatus.FORBIDDEN
            );
        }

        // Find interview
        Interview interview = interviewRepository.findByRoomId(roomId)
                .orElseThrow(() ->
                        new ApiException(
                                "Interview room not found",
                                HttpStatus.NOT_FOUND
                        )
                );

        // Ownership validation
        if (!interviewer.getId().equals(interview.getInterviewerId())) {
            throw new ApiException(
                    "You are not authorized to finish this interview",
                    HttpStatus.FORBIDDEN
            );
        }

        // Safe idempotent handling for repeated finish requests
        if ("COMPLETED".equalsIgnoreCase(interview.getStatus())) {
            return interview;
        }

        // Status validation
        if (!"ACTIVE".equalsIgnoreCase(interview.getStatus())) {
            throw new ApiException(
                    "Interview cannot be finished. Current status: " + interview.getStatus(),
                    HttpStatus.BAD_REQUEST
            );
        }

        // End interview
        LocalDateTime now = LocalDateTime.now();
        interview.setStatus("COMPLETED");
        interview.setEndedAt(now);
        interview.setUpdatedAt(now);

        // Save interview
        Interview savedInterview = interviewRepository.save(interview);

        log.info("Interview room {} completed by interviewer {}", roomId, interviewer.getEmail());

        // Broadcast real-time completion event to room topic
        if (messagingTemplate != null) {
            try {
                InterviewEventMessage eventMessage = new InterviewEventMessage(
                        roomId,
                        "INTERVIEW_COMPLETED",
                        "COMPLETED",
                        "Interview has been completed by the interviewer.",
                        interviewer.getRole(),
                        interviewer.getId()
                );
                messagingTemplate.convertAndSend(
                        "/topic/interview/" + roomId + "/events",
                        eventMessage
                );
            } catch (Exception e) {
                log.warn("Failed to broadcast interview completion event for room {}: {}", roomId, e.getMessage());
            }
        }

        // Send notifications for interview completion and pending evaluation
        if (notificationService != null) {
            // Notify Candidate
            notificationService.createAndSendNotification(
                    savedInterview.getCandidateId(),
                    NotificationType.INTERVIEW_COMPLETED,
                    "Interview Completed",
                    "Your interview \"" + savedInterview.getTitle() + "\" has been completed.",
                    savedInterview.getId(),
                    savedInterview.getRoomId()
            );

            // Notify Interviewer
            notificationService.createAndSendNotification(
                    savedInterview.getInterviewerId(),
                    NotificationType.INTERVIEW_COMPLETED,
                    "Interview Completed",
                    "The interview \"" + savedInterview.getTitle() + "\" has been completed.",
                    savedInterview.getId(),
                    savedInterview.getRoomId()
            );

            // Evaluation Pending notification for Interviewer
            if (savedInterview.getCandidateScore() == null) {
                notificationService.createAndSendNotification(
                        savedInterview.getInterviewerId(),
                        NotificationType.EVALUATION_PENDING,
                        "Evaluation Pending",
                        "You have an interview evaluation waiting for your review.",
                        savedInterview.getId(),
                        savedInterview.getRoomId()
                );
            }
        }

        return savedInterview;
    }

    // End interview (alias for finishInterview)
    public Interview endInterview(String roomId) {
        return finishInterview(roomId);
    }

    // Mutual Interview Scoring

    public InterviewScore submitScore(
            String interviewIdOrRoomId,
            Integer score
    ) {
        if (interviewIdOrRoomId == null || interviewIdOrRoomId.trim().isEmpty()) {
            throw new ApiException(
                    "Interview ID is required",
                    HttpStatus.BAD_REQUEST
            );
        }

        User currentUser = userService.getLoggedInUser();
        if (currentUser == null) {
            throw new ApiException(
                    "Unauthorized",
                    HttpStatus.UNAUTHORIZED
            );
        }

        if (score == null || score < 0 || score > 100) {
            throw new ApiException(
                    "Score must be between 0 and 100",
                    HttpStatus.BAD_REQUEST
            );
        }

        String targetId = interviewIdOrRoomId.trim();
        Interview interview = interviewRepository.findByRoomId(targetId)
                .orElseGet(() -> interviewRepository.findById(targetId)
                        .orElseThrow(() -> new ApiException(
                                "Interview room not found",
                                HttpStatus.NOT_FOUND
                        )));

        if (!"COMPLETED".equalsIgnoreCase(interview.getStatus())) {
            throw new ApiException(
                    "Interview must be completed before submitting evaluation",
                    HttpStatus.BAD_REQUEST
            );
        }

        boolean isInterviewer = currentUser.getId().equals(interview.getInterviewerId());
        boolean isCandidate = currentUser.getId().equals(interview.getCandidateId());

        if (!isInterviewer && !isCandidate) {
            throw new ApiException(
                    "You are not authorized to score this interview",
                    HttpStatus.FORBIDDEN
            );
        }

        if (isInterviewer && isCandidate) {
            throw new ApiException(
                    "User cannot score themselves",
                    HttpStatus.BAD_REQUEST
            );
        }

        String scorerUserId = currentUser.getId();
        String scorerRole = isInterviewer ? "INTERVIEWER" : "CANDIDATE";
        String recipientUserId = isInterviewer ? interview.getCandidateId() : interview.getInterviewerId();
        String recipientRole = isInterviewer ? "CANDIDATE" : "INTERVIEWER";

        if (scorerUserId.equals(recipientUserId)) {
            throw new ApiException(
                    "User cannot score themselves",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (interviewScoreRepository != null) {
            boolean alreadySubmitted = interviewScoreRepository.existsByInterviewIdAndScorerUserId(interview.getId(), scorerUserId)
                    || interviewScoreRepository.existsByRoomIdAndScorerUserId(interview.getRoomId(), scorerUserId);
            if (alreadySubmitted) {
                throw new ApiException(
                    "Score has already been submitted for this interview",
                    HttpStatus.CONFLICT
                );
            }
        }

        LocalDateTime now = LocalDateTime.now();
        InterviewScore interviewScore = new InterviewScore(
                interview.getId(),
                interview.getRoomId(),
                scorerUserId,
                scorerRole,
                recipientUserId,
                recipientRole,
                score,
                now,
                now
        );

        InterviewScore savedScore = interviewScore;
        if (interviewScoreRepository != null) {
            savedScore = interviewScoreRepository.save(interviewScore);
        }

        // Update Interview entity evaluation score
        if (isInterviewer) {
            interview.setCandidateScore(score);
        } else {
            interview.setInterviewerScore(score);
        }
        interview.setUpdatedAt(now);
        interviewRepository.save(interview);

        // Send notification to the score recipient
        if (notificationService != null) {
            if (isInterviewer) {
                notificationService.createAndSendNotification(
                        recipientUserId,
                        NotificationType.INTERVIEW_SCORE_RECEIVED,
                        "Interview Score Received",
                        "Your interviewer submitted your interview score.",
                        interview.getId(),
                        interview.getRoomId()
                );
            } else {
                notificationService.createAndSendNotification(
                        recipientUserId,
                        NotificationType.CANDIDATE_REVIEW_RECEIVED,
                        "Candidate Review Received",
                        currentUser.getName() + " submitted their interview review.",
                        interview.getId(),
                        interview.getRoomId()
                );
            }
        }

        return savedScore;
    }

    public InterviewRoomScoresResponse getInterviewScores(String interviewIdOrRoomId) {
        if (interviewIdOrRoomId == null || interviewIdOrRoomId.trim().isEmpty()) {
            throw new ApiException(
                    "Interview ID is required",
                    HttpStatus.BAD_REQUEST
            );
        }

        User currentUser = userService.getLoggedInUser();
        if (currentUser == null) {
            throw new ApiException(
                    "Unauthorized",
                    HttpStatus.UNAUTHORIZED
            );
        }

        String targetId = interviewIdOrRoomId.trim();
        Interview interview = interviewRepository.findByRoomId(targetId)
                .orElseGet(() -> interviewRepository.findById(targetId)
                        .orElseThrow(() -> new ApiException(
                                "Interview room not found",
                                HttpStatus.NOT_FOUND
                        )));

        boolean isInterviewer = currentUser.getId().equals(interview.getInterviewerId());
        boolean isCandidate = currentUser.getId().equals(interview.getCandidateId());
        if (!isInterviewer && !isCandidate) {
            throw new ApiException(
                    "You are not authorized to view scores for this interview",
                    HttpStatus.FORBIDDEN
            );
        }

        List<InterviewScore> scores = new ArrayList<>();
        if (interviewScoreRepository != null) {
            scores = interviewScoreRepository.findByRoomId(interview.getRoomId());
            if (scores.isEmpty() && interview.getId() != null) {
                scores = interviewScoreRepository.findByInterviewId(interview.getId());
            }
        }

        List<InterviewScoreResponse> scoreResponses = scores.stream()
                .map(InterviewScoreResponse::fromEntity)
                .collect(Collectors.toList());

        return new InterviewRoomScoresResponse(
                interview.getId(),
                interview.getRoomId(),
                interview.getCandidateScore(),
                interview.getInterviewerScore(),
                scoreResponses
        );
    }

    public List<InterviewScoreResponse> getScoresGivenByCurrentUser() {
        User currentUser = userService.getLoggedInUser();
        if (currentUser == null) {
            throw new ApiException(
                    "Unauthorized",
                    HttpStatus.UNAUTHORIZED
            );
        }

        if (interviewScoreRepository == null) {
            return new ArrayList<>();
        }

        return interviewScoreRepository.findByScorerUserIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(InterviewScoreResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<InterviewScoreResponse> getScoresReceivedByCurrentUser() {
        User currentUser = userService.getLoggedInUser();
        if (currentUser == null) {
            throw new ApiException(
                    "Unauthorized",
                    HttpStatus.UNAUTHORIZED
            );
        }

        if (interviewScoreRepository == null) {
            return new ArrayList<>();
        }

        return interviewScoreRepository.findByRecipientUserIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(InterviewScoreResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // Submit candidate score (legacy method)
    public Interview submitCandidateScore(
            String roomId,
            Integer score
    ) {
        submitScore(roomId, score);
        return interviewRepository.findByRoomId(roomId)
                .orElseThrow(() -> new ApiException("Interview room not found", HttpStatus.NOT_FOUND));
    }

    // Submit interviewer score (legacy method)
    public Interview submitInterviewerScore(
            String roomId,
            Integer score
    ) {
        submitScore(roomId, score);
        return interviewRepository.findByRoomId(roomId)
                .orElseThrow(() -> new ApiException("Interview room not found", HttpStatus.NOT_FOUND));
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
        submitScore(roomId, score);
        return interviewRepository.findByRoomId(roomId)
                .orElseThrow(() -> new ApiException("Interview room not found", HttpStatus.NOT_FOUND));
    }


    // Score interviewer
    public Interview scoreInterviewer(
            String roomId,
            Integer score
    ) {
        submitScore(roomId, score);
        return interviewRepository.findByRoomId(roomId)
                .orElseThrow(() -> new ApiException("Interview room not found", HttpStatus.NOT_FOUND));
    }

    public static final String DEFAULT_JAVA_TEMPLATE =
            "public class Main {\n" +
            "    public static void main(String[] args) {\n" +
            "        // Write your solution here\n" +
            "    }\n" +
            "}\n";

    public static final String DEFAULT_PYTHON_TEMPLATE =
            "def main():\n" +
            "    # Write your solution here\n" +
            "    pass\n\n\n" +
            "if __name__ == \"__main__\":\n" +
            "    main()\n";

    public static final String DEFAULT_CPP_TEMPLATE =
            "#include <iostream>\n" +
            "using namespace std;\n\n" +
            "int main() {\n" +
            "    // Write your solution here\n" +
            "    return 0;\n" +
            "}\n";

    public static String normalizeLanguage(String lang) {
        if (lang == null || lang.trim().isEmpty()) {
            return "Java";
        }
        String lower = lang.trim().toLowerCase();
        if ("python".equals(lower) || "python3".equals(lower)) {
            return "Python";
        }
        if ("cpp".equals(lower) || "c++".equals(lower)) {
            return "C++";
        }
        if ("java".equals(lower)) {
            return "Java";
        }
        return lang.trim();
    }

    public static String getDefaultTemplate(String lang) {
        String normalized = normalizeLanguage(lang);
        if ("Python".equalsIgnoreCase(normalized)) {
            return DEFAULT_PYTHON_TEMPLATE;
        }
        if ("C++".equalsIgnoreCase(normalized)) {
            return DEFAULT_CPP_TEMPLATE;
        }
        return DEFAULT_JAVA_TEMPLATE;
    }

    // Update code snapshot
    public Interview updateCodeSnapshot(
            String roomId,
            String code,
            String language
    ) {
        Interview interview =
                interviewRepository.findByRoomId(roomId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Interview room not found"
                                )
                        );

        String normalizedLang = normalizeLanguage(
                language != null && !language.trim().isEmpty()
                        ? language
                        : interview.getLanguage()
        );
        interview.setLanguage(normalizedLang);

        Map<String, String> codesMap = interview.getCodes();
        if (codesMap == null) {
            codesMap = new HashMap<>();
        }

        if (code != null) {
            codesMap.put(normalizedLang, code);
            interview.setCurrentCode(code);
        } else {
            // Language-only switch (code is null):
            // Look up whether code was already saved for this language in this room.
            String existingCode = codesMap.get(normalizedLang);
            if (existingCode != null && !existingCode.trim().isEmpty()) {
                interview.setCurrentCode(existingCode);
            } else {
                // Initialize currentCode with the appropriate starter template for the new language
                String starter = getDefaultTemplate(normalizedLang);
                interview.setCurrentCode(starter);
                codesMap.put(normalizedLang, starter);
            }
        }

        interview.setCodes(codesMap);
        interview.setUpdatedAt(
                LocalDateTime.now()
        );

        return interviewRepository.save(interview);
    }

    // Get code snapshot
    public Map<String, String> getCodeSnapshot(String roomId) {
        User user = userService.getLoggedInUser();

        Interview interview =
                interviewRepository.findByRoomId(roomId)
                        .orElseThrow(() ->
                                new ApiException(
                                        "Interview room not found",
                                        HttpStatus.NOT_FOUND
                                )
                        );

        boolean authorized = false;
        if ("interviewer".equalsIgnoreCase(user.getRole())) {
            authorized = user.getId().equals(interview.getInterviewerId());
        } else if ("candidate".equalsIgnoreCase(user.getRole())) {
            authorized = user.getId().equals(interview.getCandidateId());
        }

        if (!authorized) {
            throw new ApiException(
                    "You are not authorized to access this interview room",
                    HttpStatus.FORBIDDEN
            );
        }

        String currentLang = normalizeLanguage(interview.getLanguage());
        Map<String, String> codesMap = interview.getCodes();
        String currentCode = interview.getCurrentCode();

        // Ensure active currentCode is never empty or inconsistent
        if (currentCode == null || currentCode.trim().isEmpty()) {
            if (codesMap != null && codesMap.containsKey(currentLang)) {
                currentCode = codesMap.get(currentLang);
            } else {
                currentCode = getDefaultTemplate(currentLang);
            }
        }

        Map<String, String> snapshot = new HashMap<>();
        snapshot.put("roomId", interview.getRoomId());
        snapshot.put("currentCode", currentCode);
        snapshot.put("language", currentLang);

        // Include saved code per language so client can restore entire session state on reload
        if (codesMap != null) {
            for (Map.Entry<String, String> entry : codesMap.entrySet()) {
                if (entry.getKey() != null && entry.getValue() != null) {
                    snapshot.put("code_" + normalizeLanguage(entry.getKey()), entry.getValue());
                }
            }
        }

        return snapshot;
    }

    // Run interview code directly using OnlineCompilerClient
    public RunInterviewCodeResponse runCode(String roomId, RunInterviewCodeRequest request) {
        if (roomId == null || roomId.trim().isEmpty()) {
            throw new IllegalArgumentException("Room ID is required");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        if (request.getLanguage() == null || request.getLanguage().trim().isEmpty()) {
            throw new IllegalArgumentException("Programming language is required");
        }
        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Source code is required");
        }

        Interview interview = interviewRepository.findByRoomId(roomId)
                .orElseThrow(() -> new ApiException("Interview room not found", HttpStatus.NOT_FOUND));

        if (!"ACTIVE".equalsIgnoreCase(interview.getStatus())) {
            throw new ApiException("Interview room is not active", HttpStatus.BAD_REQUEST);
        }

        User user = userService.getLoggedInUser();
        if (user == null) {
            throw new ApiException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        boolean isInterviewer = user.getId().equals(interview.getInterviewerId());
        boolean isCandidate = user.getId().equals(interview.getCandidateId());
        if (!isInterviewer && !isCandidate) {
            throw new ApiException("You are not authorized to access this interview room", HttpStatus.FORBIDDEN);
        }

        String normalized = normalizeLanguage(request.getLanguage());
        String compiler;
        if ("Java".equalsIgnoreCase(normalized)) {
            compiler = "openjdk-25";
        } else if ("Python".equalsIgnoreCase(normalized)) {
            compiler = "python-3.14";
        } else if ("C++".equalsIgnoreCase(normalized)) {
            compiler = "g++-15";
        } else {
            throw new IllegalArgumentException("Unsupported language: " + request.getLanguage());
        }

        String codeToExecute = request.getCode();
        if ("Java".equalsIgnoreCase(normalized)) {
            codeToExecute = normalizeJavaExecutionSource(codeToExecute);
        }

        OnlineCompilerRequest compilerRequest = new OnlineCompilerRequest();
        compilerRequest.setCompiler(compiler);
        compilerRequest.setCode(codeToExecute);
        compilerRequest.setInput(request.getInput() != null ? request.getInput() : "");

        try {
            OnlineCompilerResponse compilerResponse = onlineCompilerClient.execute(compilerRequest);
            RunInterviewCodeResponse response = new RunInterviewCodeResponse();
            if (compilerResponse != null) {
                response.setStatus(compilerResponse.getStatus());
                response.setOutput(compilerResponse.getOutput());
                response.setError(compilerResponse.getError());
                response.setExitCode(compilerResponse.getExitCode());
                response.setExecutionTime(compilerResponse.getExecutionTime());
                response.setMemory(compilerResponse.getMemory());
            } else {
                response.setStatus("ERROR");
                response.setError("No response received from compiler service");
            }
            return response;
        } catch (RestClientException ex) {
            RunInterviewCodeResponse errorResponse = new RunInterviewCodeResponse();
            errorResponse.setStatus("ERROR");
            errorResponse.setError("Compiler service communication error: " + (ex.getMessage() != null ? ex.getMessage() : "Unable to reach compiler service"));
            return errorResponse;
        } catch (Exception ex) {
            RunInterviewCodeResponse errorResponse = new RunInterviewCodeResponse();
            errorResponse.setStatus("ERROR");
            errorResponse.setError("Execution failed: " + (ex.getMessage() != null ? ex.getMessage() : "Compiler service unavailable"));
            return errorResponse;
        }
    }

    // --- Java Multi-Class Execution Normalization ---

    private static final Pattern TYPE_DECL_PATTERN = Pattern.compile(
            "\\b(class|interface|enum|record)\\s+([A-Za-z_$][A-Za-z0-9_$]*)"
    );

    private static final Pattern PUBLIC_MODIFIER_PATTERN = Pattern.compile("\\bpublic\\b");

    private static final Pattern MAIN_METHOD_PATTERN = Pattern.compile(
            "\\b(?:public\\s+static|static\\s+public)\\s+void\\s+main\\s*\\(\\s*(?:final\\s+)?(?:@\\w+\\s+)?(?:java\\s*\\.\\s*lang\\s*\\.\\s*)?String\\s*(?:\\[\\s*\\]\\s*(?:@\\w+\\s+)?\\w+|\\.\\.\\.\\s*(?:@\\w+\\s+)?\\w+|\\w+\\s*\\[\\s*\\])\\s*\\)"
    );

    private static class TopLevelTypeBlock {
        int startIndex;
        int openBraceIndex;
        int closeBraceIndex;
        int endIndex;
        String name;
        String keyword;
        boolean isPublic;
        boolean hasMain;
    }

    /**
     * Normalizes Java source code for execution only:
     * If the source contains multiple top-level classes and helper classes appear before
     * the executable entry-point class (the class containing main, or public class),
     * this reorders top-level classes so that the entry-point class appears first.
     * Imports, package declarations, comments, nested classes, and method bodies are preserved.
     */
    public static String normalizeJavaExecutionSource(String source) {
        if (source == null || source.trim().isEmpty()) {
            return source;
        }

        try {
            String cleaned = maskCommentsAndLiterals(source);
            List<TopLevelTypeBlock> blocks = findTopLevelTypeBlocks(source, cleaned);

            if (blocks.size() <= 1) {
                return source;
            }

            int entryIndex = determineEntryPointIndex(blocks);
            // If no entry point found, or entry point is already the first class, return unchanged
            if (entryIndex <= 0) {
                return source;
            }

            // Determine preamble (package and import statements before first class)
            int lastPkgOrImportEnd = 0;
            Matcher pkgOrImportMatcher = Pattern.compile("\\b(package|import)\\b[^;]+;").matcher(cleaned);
            while (pkgOrImportMatcher.find()) {
                if (pkgOrImportMatcher.start() < blocks.get(0).openBraceIndex) {
                    int end = pkgOrImportMatcher.end();
                    while (end < source.length() && source.charAt(end) != '\n' && source.charAt(end) != '\r') {
                        end++;
                    }
                    if (end < source.length() && source.charAt(end) == '\r') {
                        end++;
                    }
                    if (end < source.length() && source.charAt(end) == '\n') {
                        end++;
                    }
                    lastPkgOrImportEnd = Math.max(lastPkgOrImportEnd, end);
                }
            }

            if (lastPkgOrImportEnd >= blocks.get(0).openBraceIndex) {
                return source;
            }

            String preamble = source.substring(0, lastPkgOrImportEnd);
            blocks.get(0).startIndex = lastPkgOrImportEnd;

            StringBuilder sb = new StringBuilder();
            String trimmedPreamble = preamble.trim();
            if (!trimmedPreamble.isEmpty()) {
                sb.append(trimmedPreamble).append("\n\n");
            }

            // Entry point class comes first
            sb.append(source.substring(blocks.get(entryIndex).startIndex, blocks.get(entryIndex).endIndex).trim());

            // Helper classes follow in original relative order
            for (int i = 0; i < blocks.size(); i++) {
                if (i != entryIndex) {
                    sb.append("\n\n");
                    sb.append(source.substring(blocks.get(i).startIndex, blocks.get(i).endIndex).trim());
                }
            }

            // Preserve any trailing content after the last class
            int lastClassEnd = blocks.get(blocks.size() - 1).endIndex;
            if (lastClassEnd < source.length()) {
                String trailing = source.substring(lastClassEnd).trim();
                if (!trailing.isEmpty()) {
                    sb.append("\n\n").append(trailing);
                }
            }
            sb.append("\n");

            return sb.toString();
        } catch (Exception ex) {
            // Conservative fallback: preserve original source if parsing encounters an unexpected case
            return source;
        }
    }

    private static List<TopLevelTypeBlock> findTopLevelTypeBlocks(String source, String cleaned) {
        List<TopLevelTypeBlock> blocks = new ArrayList<>();
        int len = cleaned.length();
        int braceDepth = 0;
        int currentBlockStart = 0;
        int currentBlockOpenBrace = -1;

        for (int i = 0; i < len; i++) {
            char c = cleaned.charAt(i);
            if (c == '{') {
                if (braceDepth == 0) {
                    currentBlockOpenBrace = i;
                }
                braceDepth++;
            } else if (c == '}') {
                braceDepth--;
                if (braceDepth == 0 && currentBlockOpenBrace != -1) {
                    int closeBraceIndex = i;
                    int endIndex = (i + 1 < len && source.charAt(i + 1) == ';') ? i + 2 : i + 1;

                    String header = cleaned.substring(currentBlockStart, currentBlockOpenBrace);
                    Matcher matcher = TYPE_DECL_PATTERN.matcher(header);
                    String lastKeyword = null;
                    String lastName = null;
                    while (matcher.find()) {
                        lastKeyword = matcher.group(1);
                        lastName = matcher.group(2);
                    }

                    if (lastKeyword != null && lastName != null) {
                        TopLevelTypeBlock block = new TopLevelTypeBlock();
                        block.startIndex = currentBlockStart;
                        block.openBraceIndex = currentBlockOpenBrace;
                        block.closeBraceIndex = closeBraceIndex;
                        block.endIndex = endIndex;
                        block.keyword = lastKeyword;
                        block.name = lastName;
                        block.isPublic = PUBLIC_MODIFIER_PATTERN.matcher(header).find();

                        String body = cleaned.substring(currentBlockOpenBrace, closeBraceIndex + 1);
                        block.hasMain = MAIN_METHOD_PATTERN.matcher(body).find();

                        blocks.add(block);
                        currentBlockStart = endIndex;
                    }

                    currentBlockOpenBrace = -1;
                }
            }
        }

        // If braces are unbalanced, source has syntax error; return empty to avoid corrupting
        if (braceDepth != 0) {
            return new ArrayList<>();
        }

        return blocks;
    }

    private static int determineEntryPointIndex(List<TopLevelTypeBlock> blocks) {
        List<Integer> mainIndices = new ArrayList<>();
        for (int i = 0; i < blocks.size(); i++) {
            if (blocks.get(i).hasMain) {
                mainIndices.add(i);
            }
        }

        if (mainIndices.size() == 1) {
            return mainIndices.get(0);
        } else if (mainIndices.size() > 1) {
            // If multiple classes have main, prefer the public one
            for (int idx : mainIndices) {
                if (blocks.get(idx).isPublic) {
                    return idx;
                }
            }
            return mainIndices.get(0);
        }

        // No class contains main; check if there is a single public class
        List<Integer> publicIndices = new ArrayList<>();
        for (int i = 0; i < blocks.size(); i++) {
            if (blocks.get(i).isPublic) {
                publicIndices.add(i);
            }
        }

        if (publicIndices.size() == 1) {
            return publicIndices.get(0);
        }

        return -1;
    }

    private static String maskCommentsAndLiterals(String source) {
        if (source == null) {
            return "";
        }
        int len = source.length();
        char[] cleaned = new char[len];
        int i = 0;

        while (i < len) {
            char c = source.charAt(i);

            // Single-line comment: //
            if (c == '/' && i + 1 < len && source.charAt(i + 1) == '/') {
                cleaned[i++] = ' ';
                cleaned[i++] = ' ';
                while (i < len && source.charAt(i) != '\n' && source.charAt(i) != '\r') {
                    cleaned[i++] = ' ';
                }
            }
            // Multi-line block comment: /* ... */
            else if (c == '/' && i + 1 < len && source.charAt(i + 1) == '*') {
                cleaned[i++] = ' ';
                cleaned[i++] = ' ';
                while (i < len) {
                    if (source.charAt(i) == '*' && i + 1 < len && source.charAt(i + 1) == '/') {
                        cleaned[i++] = ' ';
                        cleaned[i++] = ' ';
                        break;
                    }
                    char b = source.charAt(i);
                    cleaned[i++] = (b == '\n' || b == '\r') ? b : ' ';
                }
            }
            // Text block (Java 15+): """ ... """
            else if (c == '"' && i + 2 < len && source.charAt(i + 1) == '"' && source.charAt(i + 2) == '"') {
                cleaned[i++] = ' ';
                cleaned[i++] = ' ';
                cleaned[i++] = ' ';
                while (i < len) {
                    if (source.charAt(i) == '\\' && i + 1 < len) {
                        cleaned[i++] = ' ';
                        char esc = source.charAt(i);
                        cleaned[i++] = (esc == '\n' || esc == '\r') ? esc : ' ';
                        continue;
                    }
                    if (source.charAt(i) == '"' && i + 2 < len && source.charAt(i + 1) == '"' && source.charAt(i + 2) == '"') {
                        cleaned[i++] = ' ';
                        cleaned[i++] = ' ';
                        cleaned[i++] = ' ';
                        break;
                    }
                    char tb = source.charAt(i);
                    cleaned[i++] = (tb == '\n' || tb == '\r') ? tb : ' ';
                }
            }
            // Standard string literal: " ... "
            else if (c == '"') {
                cleaned[i++] = ' ';
                while (i < len) {
                    char sChar = source.charAt(i);
                    if (sChar == '\\' && i + 1 < len) {
                        cleaned[i++] = ' ';
                        char esc = source.charAt(i);
                        cleaned[i++] = (esc == '\n' || esc == '\r') ? esc : ' ';
                        continue;
                    }
                    if (sChar == '"') {
                        cleaned[i++] = ' ';
                        break;
                    }
                    if (sChar == '\n' || sChar == '\r') {
                        // Unterminated string literal on this line
                        cleaned[i++] = sChar;
                        break;
                    }
                    cleaned[i++] = ' ';
                }
            }
            // Character literal: ' ... '
            else if (c == '\'') {
                cleaned[i++] = ' ';
                while (i < len) {
                    char chChar = source.charAt(i);
                    if (chChar == '\\' && i + 1 < len) {
                        cleaned[i++] = ' ';
                        char esc = source.charAt(i);
                        cleaned[i++] = (esc == '\n' || esc == '\r') ? esc : ' ';
                        continue;
                    }
                    if (chChar == '\'') {
                        cleaned[i++] = ' ';
                        break;
                    }
                    if (chChar == '\n' || chChar == '\r') {
                        cleaned[i++] = chChar;
                        break;
                    }
                    cleaned[i++] = ' ';
                }
            }
            // Normal source character
            else {
                cleaned[i] = c;
                i++;
            }
        }

        return new String(cleaned);
    }
}