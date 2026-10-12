package com.interviewplatform.backend.notification.service;

import com.interviewplatform.backend.bot.exception.ApiException;
import com.interviewplatform.backend.model.User;
import com.interviewplatform.backend.notification.model.Notification;
import com.interviewplatform.backend.notification.model.NotificationType;
import com.interviewplatform.backend.notification.repository.NotificationRepository;
import com.interviewplatform.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.interviewplatform.backend.interview.model.Interview;
import com.interviewplatform.backend.interview.repository.InterviewRepository;
import com.interviewplatform.backend.interview.repository.InterviewScoreRepository;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserService userService;
    private final InterviewRepository interviewRepository;
    private final InterviewScoreRepository interviewScoreRepository;

    @Autowired
    public NotificationService(
            NotificationRepository notificationRepository,
            @Autowired(required = false) SimpMessagingTemplate messagingTemplate,
            UserService userService,
            @Autowired(required = false) InterviewRepository interviewRepository,
            @Autowired(required = false) InterviewScoreRepository interviewScoreRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
        this.userService = userService;
        this.interviewRepository = interviewRepository;
        this.interviewScoreRepository = interviewScoreRepository;
    }

    public NotificationService(
            NotificationRepository notificationRepository,
            SimpMessagingTemplate messagingTemplate,
            UserService userService
    ) {
        this(notificationRepository, messagingTemplate, userService, null, null);
    }

    public Notification createAndSendNotification(
            String recipientUserId,
            NotificationType type,
            String title,
            String message,
            String relatedInterviewId,
            String roomId
    ) {
        return createAndSendNotification(
                recipientUserId,
                type,
                title,
                message,
                relatedInterviewId,
                roomId,
                null
        );
    }

    public Notification createAndSendNotification(
            String recipientUserId,
            NotificationType type,
            String title,
            String message,
            String relatedInterviewId,
            String roomId,
            String interviewTitle
    ) {
        if (recipientUserId == null || recipientUserId.trim().isEmpty()) {
            return null;
        }

        // Duplicate prevention
        if (roomId != null && !roomId.trim().isEmpty() &&
                notificationRepository.existsByRecipientUserIdAndTypeAndRoomId(recipientUserId, type, roomId)) {
            return null;
        }

        if (relatedInterviewId != null && !relatedInterviewId.trim().isEmpty() &&
                notificationRepository.existsByRecipientUserIdAndTypeAndRelatedInterviewId(recipientUserId, type, relatedInterviewId)) {
            return null;
        }

        if ((interviewTitle == null || interviewTitle.trim().isEmpty()) && interviewRepository != null) {
            if (relatedInterviewId != null && !relatedInterviewId.trim().isEmpty()) {
                interviewTitle = interviewRepository.findById(relatedInterviewId)
                        .map(Interview::getTitle)
                        .orElse(null);
            }
            if ((interviewTitle == null || interviewTitle.trim().isEmpty()) && roomId != null && !roomId.trim().isEmpty()) {
                interviewTitle = interviewRepository.findByRoomId(roomId)
                        .map(Interview::getTitle)
                        .orElse(null);
            }
        }

        Notification notification = new Notification(
                recipientUserId,
                type,
                title,
                message,
                relatedInterviewId,
                roomId,
                interviewTitle
        );

        Notification saved = notificationRepository.save(notification);

        // Deliver in real-time via STOMP broker to user destination
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/notifications/" + recipientUserId, saved);
            } catch (Exception e) {
                log.warn("Failed to send real-time notification to user {}: {}", recipientUserId, e.getMessage());
            }
        }

        return saved;
    }

    public List<Notification> getNotificationsForCurrentUser() {
        User currentUser = userService.getLoggedInUser();
        if (currentUser == null) {
            return Collections.emptyList();
        }
        syncPendingReviewNotifications(currentUser);
        List<Notification> notifs = notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(currentUser.getId());
        if (interviewRepository != null) {
            for (Notification n : notifs) {
                if (n.getInterviewTitle() == null || n.getInterviewTitle().trim().isEmpty()) {
                    String title = null;
                    if (n.getRelatedInterviewId() != null && !n.getRelatedInterviewId().trim().isEmpty()) {
                        title = interviewRepository.findById(n.getRelatedInterviewId()).map(Interview::getTitle).orElse(null);
                    }
                    if ((title == null || title.trim().isEmpty()) && n.getRoomId() != null && !n.getRoomId().trim().isEmpty()) {
                        title = interviewRepository.findByRoomId(n.getRoomId()).map(Interview::getTitle).orElse(null);
                    }
                    if (title != null && !title.trim().isEmpty()) {
                        n.setInterviewTitle(title);
                        try {
                            notificationRepository.save(n);
                        } catch (Exception ignored) {
                        }
                    }
                }
            }
        }
        return notifs;
    }

    public void syncPendingReviewNotifications(User currentUser) {
        if (currentUser == null || interviewRepository == null) {
            return;
        }

        try {
            String userId = currentUser.getId();

            // 1. Check completed interviews where current user was interviewer
            List<Interview> asInterviewer = interviewRepository.findByInterviewerIdAndStatusOrderByCreatedAtDesc(userId, "COMPLETED");
            if (asInterviewer != null) {
                for (Interview interview : asInterviewer) {
                    boolean alreadyScored = interview.getCandidateScore() != null;
                    if (!alreadyScored && interviewScoreRepository != null) {
                        alreadyScored = interviewScoreRepository.existsByInterviewIdAndScorerUserId(interview.getId(), userId)
                                || interviewScoreRepository.existsByRoomIdAndScorerUserId(interview.getRoomId(), userId);
                    }

                    if (alreadyScored) {
                        resolvePendingEvaluation(userId, interview.getId(), interview.getRoomId());
                    } else {
                        createAndSendNotification(
                                userId,
                                NotificationType.EVALUATION_PENDING,
                                "Evaluation Pending",
                                "You have an interview evaluation waiting for your review.",
                                interview.getId(),
                                interview.getRoomId(),
                                interview.getTitle()
                        );
                    }
                }
            }

            // 2. Check completed interviews where current user was candidate
            List<Interview> asCandidate = interviewRepository.findByCandidateIdAndStatusOrderByCreatedAtDesc(userId, "COMPLETED");
            if (asCandidate != null) {
                for (Interview interview : asCandidate) {
                    boolean alreadyScored = interview.getInterviewerScore() != null;
                    if (!alreadyScored && interviewScoreRepository != null) {
                        alreadyScored = interviewScoreRepository.existsByInterviewIdAndScorerUserId(interview.getId(), userId)
                                || interviewScoreRepository.existsByRoomIdAndScorerUserId(interview.getRoomId(), userId);
                    }

                    if (alreadyScored) {
                        resolvePendingEvaluation(userId, interview.getId(), interview.getRoomId());
                    } else {
                        createAndSendNotification(
                                userId,
                                NotificationType.EVALUATION_PENDING,
                                "Evaluation Pending",
                                "You have an interview review waiting for your feedback.",
                                interview.getId(),
                                interview.getRoomId(),
                                interview.getTitle()
                        );
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to sync pending review notifications for user {}: {}", currentUser.getId(), e.getMessage());
        }
    }

    public void deleteNotification(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new ApiException("Notification ID is required", HttpStatus.BAD_REQUEST);
        }

        User currentUser = userService.getLoggedInUser();
        if (currentUser == null) {
            throw new ApiException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        Notification notification = notificationRepository.findByIdAndRecipientUserId(id, currentUser.getId())
                .orElseThrow(() -> new ApiException("Notification not found", HttpStatus.NOT_FOUND));

        notificationRepository.delete(notification);
    }

    public void clearAllNotifications() {
        User currentUser = userService.getLoggedInUser();
        if (currentUser == null) {
            throw new ApiException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        List<Notification> userNotifs = notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(currentUser.getId());
        if (!userNotifs.isEmpty()) {
            notificationRepository.deleteAll(userNotifs);
        }
    }

    public void resolvePendingEvaluation(String recipientUserId, String relatedInterviewId, String roomId) {
        if (recipientUserId == null || recipientUserId.trim().isEmpty()) {
            return;
        }

        List<Notification> userNotifs = notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(recipientUserId);
        for (Notification n : userNotifs) {
            if (n.getType() == NotificationType.EVALUATION_PENDING) {
                boolean match = false;
                if (relatedInterviewId != null && !relatedInterviewId.trim().isEmpty() &&
                        relatedInterviewId.equals(n.getRelatedInterviewId())) {
                    match = true;
                }
                if (roomId != null && !roomId.trim().isEmpty() &&
                        roomId.equals(n.getRoomId())) {
                    match = true;
                }
                if (match) {
                    notificationRepository.delete(n);
                }
            }
        }
    }

    public Notification markAsRead(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new ApiException("Notification ID is required", HttpStatus.BAD_REQUEST);
        }

        User currentUser = userService.getLoggedInUser();
        if (currentUser == null) {
            throw new ApiException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        Notification notification = notificationRepository.findByIdAndRecipientUserId(id, currentUser.getId())
                .orElseThrow(() -> new ApiException("Notification not found", HttpStatus.NOT_FOUND));

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllAsRead() {
        User currentUser = userService.getLoggedInUser();
        if (currentUser == null) {
            throw new ApiException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        List<Notification> unread = notificationRepository.findByRecipientUserIdAndReadFalse(currentUser.getId());
        if (!unread.isEmpty()) {
            for (Notification n : unread) {
                n.setRead(true);
            }
            notificationRepository.saveAll(unread);
        }
    }
}
