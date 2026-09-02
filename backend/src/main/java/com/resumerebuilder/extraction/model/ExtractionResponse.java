package com.resumerebuilder.extraction.model;

/**
 * API response DTO returned by POST /api/v1/resumes/{id}/extract
 * and GET /api/v1/resumes/{id}/extraction.
 *
 * The full extracted text is NOT included in the summary response
 * to keep the payload small. Use the /extraction endpoint for full preview
 * text.
 */
public class ExtractionResponse {

    private String resumeId;
    private String status;
    private int pageCount;
    private int characterCount;
    private String extractedAt;
    private String message;
    // Preview: first ~2000 chars of extracted text for display
    private String previewText;

    public ExtractionResponse() {
    }

    public String getResumeId() {
        return resumeId;
    }

    public void setResumeId(String resumeId) {
        this.resumeId = resumeId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPreviewText() {
        return previewText;
    }

    public void setPreviewText(String previewText) {
        this.previewText = previewText;
    }
}
