package com.interviewplatform.backend.dto;

public class UpdateUserRequest {

    private String name;

    private String email;

    private String title;

    private String location;

    private String avatar;

    private String about;

    public UpdateUserRequest() {
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

    private java.util.List<String> skills;

    private java.util.List<String> targets;

    private java.util.List<com.interviewplatform.backend.model.Experience> experience;

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