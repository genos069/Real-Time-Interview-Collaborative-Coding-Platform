package com.interviewplatform.backend.interview.websocket;

public class CodeSyncMessage {

    private String roomId;
    private String senderUserId;
    private String senderRole;
    private String code;
    private String language;
    private Integer cursorPosition;

    public CodeSyncMessage() {
    }

    public CodeSyncMessage(
            String roomId,
            String senderUserId,
            String senderRole,
            String code,
            String language,
            Integer cursorPosition
    ) {
        this.roomId = roomId;
        this.senderUserId = senderUserId;
        this.senderRole = senderRole;
        this.code = code;
        this.language = language;
        this.cursorPosition = cursorPosition;
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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Integer getCursorPosition() {
        return cursorPosition;
    }

    public void setCursorPosition(Integer cursorPosition) {
        this.cursorPosition = cursorPosition;
    }
}
