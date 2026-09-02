package com.resumerebuilder.resume.model;

public enum ResumeStatus {
    UPLOADING,
    UPLOADED,
    FAILED,
    // Extraction lifecycle
    EXTRACTING,
    EXTRACTED,
    EXTRACTION_FAILED,
    STRUCTURING,
    STRUCTURED,
    STRUCTURING_FAILED,
    OPTIMIZING,
    OPTIMIZED,
    OPTIMIZATION_FAILED,
    // Future milestones
    PROCESSING,
    READY
}
