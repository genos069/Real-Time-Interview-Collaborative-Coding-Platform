package com.interviewplatform.backend.interview.websocket;

public class InterviewEventMessage {

    private String roomId;
    private String event;
    private String status;
    private String message;
    private String initiatorRole;
    private String initiatorId;
    private long timestamp;

    public InterviewEventMessage() {
    }

    public InterviewEventMessage(
            String roomId,
            String event,
            String status,
            String message,
            String initiatorRole,
            String initiatorId
    ) {
        this.roomId = roomId;
        this.event = event;
        this.status = status;
        this.message = message;
        this.initiatorRole = initiatorRole;
        this.initiatorId = initiatorId;
        this.timestamp = System.currentTimeMillis();
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getEvent() {
        return event;
    }

    public void setEvent(String event) {
        this.event = event;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getInitiatorRole() {
        return initiatorRole;
    }

    public void setInitiatorRole(String initiatorRole) {
        this.initiatorRole = initiatorRole;
    }

    public String getInitiatorId() {
        return initiatorId;
    }

    public void setInitiatorId(String initiatorId) {
        this.initiatorId = initiatorId;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}
