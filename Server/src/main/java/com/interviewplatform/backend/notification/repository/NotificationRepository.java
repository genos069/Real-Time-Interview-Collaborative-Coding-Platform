package com.interviewplatform.backend.notification.repository;

import com.interviewplatform.backend.notification.model.Notification;
import com.interviewplatform.backend.notification.model.NotificationType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(String recipientUserId);

    long countByRecipientUserIdAndReadFalse(String recipientUserId);

    boolean existsByRecipientUserIdAndTypeAndRoomId(
            String recipientUserId,
            NotificationType type,
            String roomId
    );

    boolean existsByRecipientUserIdAndTypeAndRelatedInterviewId(
            String recipientUserId,
            NotificationType type,
            String relatedInterviewId
    );

    Optional<Notification> findByIdAndRecipientUserId(String id, String recipientUserId);

    List<Notification> findByRecipientUserIdAndReadFalse(String recipientUserId);
}
