package com.resumerebuilder.ai.service;

import com.resumerebuilder.ai.model.ResumeData;
import com.resumerebuilder.ai.provider.StructuredResumeExtractor;
import com.resumerebuilder.extraction.exception.DocumentExtractionException;
import com.resumerebuilder.extraction.exception.DocumentNotFoundException;
import com.resumerebuilder.extraction.model.ExtractionResult;
import com.resumerebuilder.firebase.FirestoreService;
import com.resumerebuilder.resume.model.Resume;
import com.resumerebuilder.resume.model.ResumeStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
public class ResumeStructuringService {

    private static final Logger log = LoggerFactory.getLogger(ResumeStructuringService.class);

    private static final String RESUMES_COLLECTION = "resumes";
    private static final String EXTRACTION_SUBCOLLECTION = "extraction";
    private static final String DATA_SUBCOLLECTION = "data";
    private static final String DATA_DOC_ID = "current";
    private static final int MAX_INPUT_CHARS = 100000;

    private final FirestoreService firestoreService;
    private final StructuredResumeExtractor aiExtractor;

    public ResumeStructuringService(FirestoreService firestoreService, StructuredResumeExtractor aiExtractor) {
        this.firestoreService = firestoreService;
        this.aiExtractor = aiExtractor;
    }

    /**
     * Extracts structured AI data from normalized raw resume text using Gemini.
     * Prevents duplicate extractions.
     *
     * @param userId   Validated user ID performing the request
     * @param resumeId The ID of the resume to structure
     * @return Output status and sections processed metadata map
     */
    public Map<String, Object> structureResume(String userId, String resumeId) {
        // 1. Verify ownership
        Resume resume = firestoreService.getDocument(RESUMES_COLLECTION, resumeId, Resume.class);
        if (resume == null || !resume.getUserId().equals(userId)) {
            throw new DocumentNotFoundException("Resume not found or access denied.");
        }

        log.info("Resume structuring started: resumeId={}, currentStatus={}", resumeId, resume.getStatus());

        // 2. Enforce idempotency avoiding duplicate calls
        if (resume.getStatus() == ResumeStatus.STRUCTURED) {
            log.info("Resume already STRUCTURED, skipping extra extraction: resumeId={}", resumeId);
            return buildSuccessResponse(resumeId);
        }

        // 3. Must be EXTRACTED or STRUCTURING_FAILED
        if (resume.getStatus() != ResumeStatus.EXTRACTED
                && resume.getStatus() != ResumeStatus.valueOf("STRUCTURING_FAILED")) {
            throw new IllegalStateException(
                    "Resume is not ready to be structured. Current status: " + resume.getStatus());
        }

        // 4. Retrieve M5 raw extraction text
        ExtractionResult result = firestoreService.getDocument(
                RESUMES_COLLECTION + "/" + resumeId + "/" + EXTRACTION_SUBCOLLECTION,
                resumeId,
                ExtractionResult.class);

        if (result == null || result.getExtractedText() == null) {
            throw new IllegalStateException("Normalized extracted text not found for resume: " + resumeId);
        }

        // 5. Size boundary constraints prior to AI API invocation safely guarding quota
        String rawText = result.getExtractedText();
        if (rawText.length() > MAX_INPUT_CHARS) {
            rawText = rawText.substring(0, MAX_INPUT_CHARS); // Safety clip (text should have been clipped M5 anyway)
        }

        // 6. Transition to STRUCTURING
        updateResumeStatus(resumeId, "STRUCTURING");

        try {
            // 7. Extract data via AI API
            ResumeData data = aiExtractor.extractStructuredData(rawText);

            // 8. Business validation on payload
            if (data == null || data.getPersonalInfo() == null) {
                throw new RuntimeException("AI extraction yielded entirely empty result bounds.");
            }

            // 9. Persist to Firestore structured boundary
            firestoreService.saveDocument(
                    RESUMES_COLLECTION + "/" + resumeId + "/" + DATA_SUBCOLLECTION,
                    DATA_DOC_ID,
                    data);

            // 10. Finalize lifecycle states
            updateResumeStatus(resumeId, ResumeStatus.STRUCTURED.name());

            log.info("Resume successfully STRUCTURED: resumeId={}", resumeId);
            return buildSuccessResponse(resumeId);

        } catch (Exception e) {
            log.warn("Resume structuring failed: resumeId={}. Reason: {}", resumeId, e.getMessage());
            updateResumeStatus(resumeId, "STRUCTURING_FAILED");
            throw new DocumentExtractionException("We couldn't analyze your resume right now. Please try again.", e);
        }
    }

    /**
     * Retrieves structured data for viewing in the frontend.
     */
    public ResumeData getStructuredData(String userId, String resumeId) {
        // Enforce ownership
        Resume resume = firestoreService.getDocument(RESUMES_COLLECTION, resumeId, Resume.class);
        if (resume == null || !resume.getUserId().equals(userId)) {
            throw new DocumentNotFoundException("Resume not found or access denied.");
        }

        // Retrieve structured item safely
        return firestoreService.getDocument(
                RESUMES_COLLECTION + "/" + resumeId + "/" + DATA_SUBCOLLECTION,
                DATA_DOC_ID,
                ResumeData.class);
    }

    /**
     * PUT update functionality storing User overridden data back to structured
     * block.
     * Guaranteed NOT TO RE-INVOKE AI. Standard manual database update tracking
     * manually.
     */
    public void updateStructuredData(String userId, String resumeId, ResumeData data) {
        Resume resume = firestoreService.getDocument(RESUMES_COLLECTION, resumeId, Resume.class);
        if (resume == null || !resume.getUserId().equals(userId)) {
            throw new DocumentNotFoundException("Resume not found or access denied.");
        }

        // Minimal Validation ensures standard bounds logic before pushing changes
        if (data.getPersonalInfo() == null) {
            throw new IllegalArgumentException("Personal info section cannot be completely null off an edit.");
        }

        // Pass along the manual tracking tags dynamically if desired, although the POJO
        // handles structure.
        String now = Instant.now().toString();

        firestoreService.updateDocument(
                RESUMES_COLLECTION, resumeId,
                Map.of("updatedAt", now));

        firestoreService.saveDocument(
                RESUMES_COLLECTION + "/" + resumeId + "/" + DATA_SUBCOLLECTION,
                DATA_DOC_ID,
                data);
    }

    private void updateResumeStatus(String resumeId, String status) {
        String timestamp = Instant.now().toString();
        firestoreService.updateDocument(
                RESUMES_COLLECTION, resumeId,
                Map.of("status", status, "updatedAt", timestamp));
    }

    private Map<String, Object> buildSuccessResponse(String resumeId) {
        return Map.of(
                "resumeId", resumeId,
                "status", "STRUCTURED",
                "sectionsFound", java.util.Arrays.asList(
                        "PERSONAL_INFO",
                        "EDUCATION",
                        "SKILLS",
                        "PROJECTS",
                        "EXPERIENCE",
                        "CERTIFICATIONS"));
    }
}
