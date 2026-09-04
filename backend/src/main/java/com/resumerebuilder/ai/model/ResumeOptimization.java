package com.resumerebuilder.ai.model;

import com.resumerebuilder.resume.model.ResumeStatus;

public class ResumeOptimization {
    private String targetRole;
    private ResumeData originalData;
    private ResumeData optResumeData;
    private ResumeStatus status;
    private String createdAt;
    private String updatedAt;

    // Getters and Setters
    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public ResumeData getOriginalData() {
        return originalData;
    }

    public void setOriginalData(ResumeData originalData) {
        this.originalData = originalData;
    }

    public ResumeData getOptResumeData() {
        return optResumeData;
    }

    public void setOptResumeData(ResumeData optResumeData) {
        this.optResumeData = optResumeData;
    }

    public ResumeStatus getStatus() {
        return status;
    }

    public void setStatus(ResumeStatus status) {
        this.status = status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
