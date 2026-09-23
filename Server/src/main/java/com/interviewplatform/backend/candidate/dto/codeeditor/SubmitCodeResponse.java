package com.interviewplatform.backend.candidate.dto.codeeditor;

import java.time.LocalDateTime;

public class SubmitCodeResponse {

    // Submission Status
    private String status;

    // Passed Test Cases
    private int passedTestCases;

    // Total Test Cases
    private int totalTestCases;

    // Runtime
    private String runtime;

    // Memory Used
    private String memory;

    // Language
    private String language;

    // Submission Time
    private LocalDateTime submittedAt;

    // Console Output
    private String output;

    // Error Message
    private String error;

    // Default Constructor
    public SubmitCodeResponse() {
    }

    // Getters & Setters

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getPassedTestCases() {
        return passedTestCases;
    }

    public void setPassedTestCases(int passedTestCases) {
        this.passedTestCases = passedTestCases;
    }

    public int getTotalTestCases() {
        return totalTestCases;
    }

    public void setTotalTestCases(int totalTestCases) {
        this.totalTestCases = totalTestCases;
    }

    public String getRuntime() {
        return runtime;
    }

    public void setRuntime(String runtime) {
        this.runtime = runtime;
    }

    public String getMemory() {
        return memory;
    }

    public void setMemory(String memory) {
        this.memory = memory;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getOutput() {
        return output;
    }

    public void setOutput(String output) {
        this.output = output;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}