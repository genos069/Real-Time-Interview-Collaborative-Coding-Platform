package com.interviewplatform.backend.interview.websocket;

import java.util.List;

public class InterviewWhiteboardMessage {

    private String id;
    private String roomId;
    private String senderUserId;
    private String senderRole;
    private String type; // STROKE, SHAPE, CLEAR, UNDO
    private String tool; // pen, eraser, line, rect, circle
    private String color;
    private Integer size;
    private Double startX;
    private Double startY;
    private Double endX;
    private Double endY;
    private List<WhiteboardPoint> points;
    private String timestamp;

    public InterviewWhiteboardMessage() {
    }

    public InterviewWhiteboardMessage(
            String id,
            String roomId,
            String senderUserId,
            String senderRole,
            String type,
            String tool,
            String color,
            Integer size,
            Double startX,
            Double startY,
            Double endX,
            Double endY,
            List<WhiteboardPoint> points,
            String timestamp
    ) {
        this.id = id;
        this.roomId = roomId;
        this.senderUserId = senderUserId;
        this.senderRole = senderRole;
        this.type = type;
        this.tool = tool;
        this.color = color;
        this.size = size;
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.points = points;
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

    public String getSenderRole() {
        return senderRole;
    }

    public void setSenderRole(String senderRole) {
        this.senderRole = senderRole;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTool() {
        return tool;
    }

    public void setTool(String tool) {
        this.tool = tool;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }

    public Double getStartX() {
        return startX;
    }

    public void setStartX(Double startX) {
        this.startX = startX;
    }

    public Double getStartY() {
        return startY;
    }

    public void setStartY(Double startY) {
        this.startY = startY;
    }

    public Double getEndX() {
        return endX;
    }

    public void setEndX(Double endX) {
        this.endX = endX;
    }

    public Double getEndY() {
        return endY;
    }

    public void setEndY(Double endY) {
        this.endY = endY;
    }

    public List<WhiteboardPoint> getPoints() {
        return points;
    }

    public void setPoints(List<WhiteboardPoint> points) {
        this.points = points;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
