package com.interviewplatform.backend.interview.dto;

public class RunInterviewCodeResponse {

    private String status;
    private String output;
    private String error;
    private Integer exitCode;
    private String executionTime;
    private String memory;

    public RunInterviewCodeResponse() {
    }

    public RunInterviewCodeResponse(
            String status,
            String output,
            String error,
            Integer exitCode,
            String executionTime,
            String memory
    ) {
        this.status = status;
        this.output = output;
        this.error = error;
        this.exitCode = exitCode;
        this.executionTime = executionTime;
        this.memory = memory;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public Integer getExitCode() {
        return exitCode;
    }

    public void setExitCode(Integer exitCode) {
        this.exitCode = exitCode;
    }

    public String getExecutionTime() {
        return executionTime;
    }

    public void setExecutionTime(String executionTime) {
        this.executionTime = executionTime;
    }

    public String getMemory() {
        return memory;
    }

    public void setMemory(String memory) {
        this.memory = memory;
    }
}
