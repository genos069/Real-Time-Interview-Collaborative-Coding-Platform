package com.interviewplatform.backend.dto;

public class UserResponse {

    private String id;

    private String name;

    private String email;

    private String role;

    private String title;

    private String location;

    private String avatar;

    private String about;

    private java.util.List<String> skills;
    private java.util.List<String> targets;
    private java.util.List<com.interviewplatform.backend.model.Experience> experience;

    public UserResponse() {
    }

    public UserResponse(
            String id,
            String name,
            String email,
            String role,
            String title,
            String location,
            String avatar,
            String about
    ) {
        this(id, name, email, role, title, location, avatar, about, null, null, null);
    }

    public UserResponse(
            String id,
            String name,
            String email,
            String role,
            String title,
            String location,
            String avatar,
            String about,
            java.util.List<String> skills,
            java.util.List<String> targets,
            java.util.List<com.interviewplatform.backend.model.Experience> experience
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.title = title;
        this.location = location;
        this.avatar = avatar;
        this.about = about;
        this.skills = skills;
        this.targets = targets;
        this.experience = experience;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getAbout() {
        return about;
    }

    public void setAbout(String about) {
        this.about = about;
    }

    public java.util.List<String> getSkills() {
        return skills;
    }

    public void setSkills(java.util.List<String> skills) {
        this.skills = skills;
    }

    public java.util.List<String> getTargets() {
        return targets;
    }

    public void setTargets(java.util.List<String> targets) {
        this.targets = targets;
    }

    public java.util.List<com.interviewplatform.backend.model.Experience> getExperience() {
        return experience;
    }

    public void setExperience(java.util.List<com.interviewplatform.backend.model.Experience> experience) {
        this.experience = experience;
    }
}