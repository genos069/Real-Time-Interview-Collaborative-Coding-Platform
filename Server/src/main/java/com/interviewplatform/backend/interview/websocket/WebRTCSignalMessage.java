package com.interviewplatform.backend.interview.websocket;

public class WebRTCSignalMessage {

    private String roomId;
    private String senderUserId;
    private String senderRole;
    private String type; // OFFER, ANSWER, or ICE_CANDIDATE
    private String sdp;

    // ICE candidate fields
    private String candidate;
    private String sdpMid;
    private Integer sdpMLineIndex;

    public WebRTCSignalMessage() {
    }

    public WebRTCSignalMessage(
            String roomId,
            String senderUserId,
            String senderRole,
            String type,
            String sdp
    ) {
        this.roomId = roomId;
        this.senderUserId = senderUserId;
        this.senderRole = senderRole;
        this.type = type;
        this.sdp = sdp;
    }

    public WebRTCSignalMessage(
            String roomId,
            String senderUserId,
            String senderRole,
            String type,
            String sdp,
            String candidate,
            String sdpMid,
            Integer sdpMLineIndex
    ) {
        this.roomId = roomId;
        this.senderUserId = senderUserId;
        this.senderRole = senderRole;
        this.type = type;
        this.sdp = sdp;
        this.candidate = candidate;
        this.sdpMid = sdpMid;
        this.sdpMLineIndex = sdpMLineIndex;
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

    public String getSdp() {
        return sdp;
    }

    public void setSdp(String sdp) {
        this.sdp = sdp;
    }

    public String getCandidate() {
        return candidate;
    }

    public void setCandidate(String candidate) {
        this.candidate = candidate;
    }

    public String getSdpMid() {
        return sdpMid;
    }

    public void setSdpMid(String sdpMid) {
        this.sdpMid = sdpMid;
    }

    public Integer getSdpMLineIndex() {
        return sdpMLineIndex;
    }

    public void setSdpMLineIndex(Integer sdpMLineIndex) {
        this.sdpMLineIndex = sdpMLineIndex;
    }
}
