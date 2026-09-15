package com.interviewplatform.backend.interview.websocket;

public class InterviewChatMessage {

    private String id;
    private String roomId;
    private String senderUserId;
    private String senderName;
    private String senderRole;
    private String text;
    private String timestamp;

    public InterviewChatMessage() {
    }

    public InterviewChatMessage(
            String id,
            String roomId,
            String senderUserId,
            String senderName,
            String senderRole,
            String text,
            String timestamp
    ) {
        this.id = id;
        this.roomId = roomId;
        this.senderUserId = senderUserId;
        this.senderName = senderName;
        this.senderRole = senderRole;
        this.text = text;
        this.timestamp = timestamp;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getSenderUserId() {
        return senderUserId;
    }

    public void setSenderUserId(String senderUserId) {
        this.senderUserId = senderUserId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getSenderRole() {
        return senderRole;
    }

    public void setSenderRole(String senderRole) {
        this.senderRole = senderRole;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
