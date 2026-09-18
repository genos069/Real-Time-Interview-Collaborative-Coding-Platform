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
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserService userService;

    @Autowired
    public NotificationService(
            NotificationRepository notificationRepository,
            @Autowired(required = false) SimpMessagingTemplate messagingTemplate,
            UserService userService
    ) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
        this.userService = userService;
    }

    public Notification createAndSendNotification(
            String recipientUserId,
            NotificationType type,
            String title,
            String message,
            String relatedInterviewId,
            String roomId
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

        Notification notification = new Notification(
                recipientUserId,
                type,
                title,
                message,
                relatedInterviewId,
                roomId
        );

        Notification saved = notificationRepository.save(notification);

        // Deliver in real-time via STOMP broker to user destination
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/notifications/" + recipientUserId, saved);
            } catch (Exception e) {
                System.err.println("Failed to send real-time notification to user " + recipientUserId + ": " + e.getMessage());
            }
        }

        return saved;
    }

    public List<Notification> getNotificationsForCurrentUser() {
        User currentUser = userService.getLoggedInUser();
        if (currentUser == null) {
            return Collections.emptyList();
        }
        return notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(currentUser.getId());
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
