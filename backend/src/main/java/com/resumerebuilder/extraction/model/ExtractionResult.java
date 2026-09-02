package com.resumerebuilder.extraction.model;

/**
 * Firestore document model stored at:
 * resumes/{resumeId}/extraction/{resumeId}
 *
 * Stores the extraction result separately from the main resume document
 * to avoid Firestore's 1 MB per-document limit.
 */
public class ExtractionResult {

    private String status;
    private String extractedText;
    private int pageCount;
    private int characterCount;
    private String extractedAt;
    private String updatedAt;

    public ExtractionResult() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }

    public int getPageCount() {
        return pageCount;
    }

    public void setPageCount(int pageCount) {
        this.pageCount = pageCount;
    }

    public int getCharacterCount() {
        return characterCount;
    }

    public void setCharacterCount(int characterCount) {
        this.characterCount = characterCount;
    }

    public String getExtractedAt() {
        return extractedAt;
    }

    public void setExtractedAt(String extractedAt) {
        this.extractedAt = extractedAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
