package com.interviewplatform.backend.dto;

public class AuthResponse {

    private String id;
    private String name;
    private String email;
    private String role;
    private String token;
    private String avatar;

    public AuthResponse(String id,
                        String name,
                        String email,
                        String role,
                        String token) {
        this(id, name, email, role, token, "");
    }

    public AuthResponse(String id,
                        String name,
                        String email,
                        String role,
                        String token,
                        String avatar) {

        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.token = token;
        this.avatar = avatar;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public String getToken() {
        return token;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }
}