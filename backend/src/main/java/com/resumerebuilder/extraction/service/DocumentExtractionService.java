package com.resumerebuilder.extraction.service;

import com.resumerebuilder.extraction.exception.DocumentExtractionException;
import com.resumerebuilder.extraction.exception.DocumentNotFoundException;
import com.resumerebuilder.extraction.exception.DocumentTooLargeException;
import com.resumerebuilder.extraction.model.ExtractedDocument;
import com.resumerebuilder.extraction.model.ExtractionResponse;
import com.resumerebuilder.extraction.model.ExtractionResult;
import com.resumerebuilder.extraction.parser.DocumentExtractorFactory;
import com.resumerebuilder.extraction.parser.DocumentTextExtractor;
import com.resumerebuilder.firebase.FirestoreService;
import com.resumerebuilder.resume.model.Resume;
import com.resumerebuilder.resume.model.ResumeStatus;
import com.resumerebuilder.storage.StorageService;
import org.apache.tika.detect.DefaultDetector;
import org.apache.tika.detect.Detector;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.mime.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.Map;

/**
 * Orchestrates the full resume text extraction pipeline:
 *
 * 1. Load resume metadata from Firestore, verify ownership
 * 2. Idempotency check (skip if EXTRACTED; allow retry if EXTRACTION_FAILED)
 * 3. Set status → EXTRACTING
 * 4. Download file from Supabase Storage
 * 5. Detect file type via Tika magic-byte detection
 * 6. Validate file size
 * 7. Extract text via DocumentExtractorFactory
 * 8. Normalize text
 * 9. Save ExtractionResult to Firestore subcollection
 * 10. Set status → EXTRACTED
 * 11. On any error: set status → EXTRACTION_FAILED
 */
@Service
public class DocumentExtractionService {

    private static final Logger log = LoggerFactory.getLogger(DocumentExtractionService.class);

    private static final String RESUMES_COLLECTION = "resumes";
    private static final String EXTRACTION_SUBCOLLECTION = "extraction";
    private static final int PREVIEW_MAX_CHARS = 2000;

    @Value("${resume.extraction.max-file-size-bytes:5242880}")
    private long maxFileSizeBytes;

    private final FirestoreService firestoreService;
    private final StorageService storageService;
    private final DocumentExtractorFactory extractorFactory;
    private final TextNormalizationService normalizationService;

    public DocumentExtractionService(
            FirestoreService firestoreService,
            StorageService storageService,
            DocumentExtractorFactory extractorFactory,
            TextNormalizationService normalizationService) {
        this.firestoreService = firestoreService;
        this.storageService = storageService;
        this.extractorFactory = extractorFactory;
        this.normalizationService = normalizationService;
    }

    /**
     * Extract text from a resume. Verifies userId ownership before proceeding.
     *
     * @param userId   Verified Firebase UID from the token
     * @param resumeId The resume document ID
     * @return ExtractionResponse with summary metadata
     */
    public ExtractionResponse extractResume(String userId, String resumeId) {
        // 1. Load resume and verify ownership
        Resume resume = firestoreService.getDocument(RESUMES_COLLECTION, resumeId, Resume.class);
        if (resume == null) {
            throw new DocumentNotFoundException("Resume not found: " + resumeId);
        }
        if (!resume.getUserId().equals(userId)) {
            // Respond the same as not found to prevent enumeration
            throw new DocumentNotFoundException("Resume not found: " + resumeId);
        }

        // 2. Idempotency — return cached result if already extracted
        if (resume.getStatus() == ResumeStatus.EXTRACTED) {
            log.info("Resume already extracted, returning cached result: resumeId={}", resumeId);
            return buildCachedResponse(resumeId);
        }

        // 3. Only proceed from UPLOADED or EXTRACTION_FAILED states
        if (resume.getStatus() == ResumeStatus.EXTRACTING) {
            ExtractionResponse response = new ExtractionResponse();
            response.setResumeId(resumeId);
            response.setStatus("EXTRACTING");
            response.setMessage("Extraction is currently in progress.");
            return response;
        }

        log.info("Resume extraction started: resumeId={}", resumeId);

        // 4. Mark as EXTRACTING
        updateResumeStatus(resumeId, ResumeStatus.EXTRACTING);

        try {
            // 5. Download from Supabase Storage
            InputStream fileStream = storageService.downloadFile(
                    resume.getStorageBucket(), resume.getStoragePath());

            // Wrap in a BufferedInputStream to support mark/reset for Tika detection
            BufferedInputStream buffered = new BufferedInputStream(fileStream);

            // 6. Detect file type via Tika magic bytes
            String detectedMime = detectMimeType(buffered);
            log.info("Detected MIME type for resumeId={}: {}", resumeId, detectedMime);

            // 7. Validate size (stream-based; check bytes available)
            // We read the full bytes once, then pass to extractor
            byte[] fileBytes = buffered.readAllBytes();
            if (fileBytes.length > maxFileSizeBytes) {
                throw new DocumentTooLargeException(
                        "Document exceeds the 5 MB processing limit (" + fileBytes.length + " bytes).");
            }

            // 8. Extract text
            DocumentTextExtractor extractor = extractorFactory.getExtractor(detectedMime);
            ExtractedDocument extracted = extractor.extract(
                    new java.io.ByteArrayInputStream(fileBytes), detectedMime);

            // 9. Normalize text
            String normalizedText = normalizationService.normalize(extracted.getText());

            // 10. Save to Firestore subcollection
            String now = Instant.now().toString();
            ExtractionResult result = new ExtractionResult();
            result.setStatus("EXTRACTED");
            result.setExtractedText(normalizedText);
            result.setPageCount(extracted.getPageCount());
            result.setCharacterCount(normalizedText.length());
            result.setExtractedAt(now);
            result.setUpdatedAt(now);

            firestoreService.saveDocument(
                    RESUMES_COLLECTION + "/" + resumeId + "/" + EXTRACTION_SUBCOLLECTION,
                    resumeId,
                    result);

            // 11. Mark resume as EXTRACTED
            updateResumeStatusWithTimestamp(resumeId, ResumeStatus.EXTRACTED, now);

            log.info("Resume extraction completed: resumeId={}, pages={}, characters={}",
                    resumeId, extracted.getPageCount(), normalizedText.length());

            // 12. Build response
            ExtractionResponse response = new ExtractionResponse();
            response.setResumeId(resumeId);
            response.setStatus("EXTRACTED");
            response.setPageCount(extracted.getPageCount());
            response.setCharacterCount(normalizedText.length());
            response.setExtractedAt(now);
            response.setPreviewText(
                    normalizedText.length() > PREVIEW_MAX_CHARS
                            ? normalizedText.substring(0, PREVIEW_MAX_CHARS)
                            : normalizedText);
            return response;

        } catch (DocumentTooLargeException | DocumentNotFoundException e) {
            log.warn("Resume extraction failed: resumeId={}, reason={}", resumeId, e.getMessage());
            updateResumeStatus(resumeId, ResumeStatus.EXTRACTION_FAILED);
            throw e;
        } catch (Exception e) {
            log.warn("Resume extraction failed: resumeId={}, reason={}", resumeId, e.getMessage());
            updateResumeStatus(resumeId, ResumeStatus.EXTRACTION_FAILED);
            throw new DocumentExtractionException(
                    "We couldn't read this resume. Please upload another PDF or DOCX file.", e);
        }
    }

    /**
     * Retrieves an existing extraction result for display on the resume detail
     * page.
     */
    public ExtractionResponse getExtractionResult(String userId, String resumeId) {
        Resume resume = firestoreService.getDocument(RESUMES_COLLECTION, resumeId, Resume.class);
        if (resume == null || !resume.getUserId().equals(userId)) {
            throw new DocumentNotFoundException("Resume not found: " + resumeId);
        }

        ExtractionResult result = firestoreService.getDocument(
                RESUMES_COLLECTION + "/" + resumeId + "/" + EXTRACTION_SUBCOLLECTION,
                resumeId,
                ExtractionResult.class);

        if (result == null) {
            ExtractionResponse response = new ExtractionResponse();
            response.setResumeId(resumeId);
            response.setStatus(resume.getStatus().name());
            return response;
        }

        ExtractionResponse response = new ExtractionResponse();
        response.setResumeId(resumeId);
        response.setStatus(result.getStatus());
        response.setPageCount(result.getPageCount());
        response.setCharacterCount(result.getCharacterCount());
        response.setExtractedAt(result.getExtractedAt());
        String text = result.getExtractedText();
        if (text != null) {
            response.setPreviewText(
                    text.length() > PREVIEW_MAX_CHARS ? text.substring(0, PREVIEW_MAX_CHARS) : text);
        }
        return response;
    }

    // ---- Private helpers ----

    private String detectMimeType(BufferedInputStream stream) {
        try {
            Detector detector = new DefaultDetector();
            Metadata metadata = new Metadata();
            MediaType mediaType = detector.detect(stream, metadata);
            return mediaType.toString();
        } catch (IOException e) {
            log.warn("Tika MIME detection failed, falling back to application/octet-stream");
            return "application/octet-stream";
        }
    }

    private ExtractionResponse buildCachedResponse(String resumeId) {
        ExtractionResult cached = firestoreService.getDocument(
                RESUMES_COLLECTION + "/" + resumeId + "/" + EXTRACTION_SUBCOLLECTION,
                resumeId,
                ExtractionResult.class);

        ExtractionResponse response = new ExtractionResponse();
        response.setResumeId(resumeId);
        if (cached != null) {
            response.setStatus(cached.getStatus());
            response.setPageCount(cached.getPageCount());
            response.setCharacterCount(cached.getCharacterCount());
            response.setExtractedAt(cached.getExtractedAt());
            String text = cached.getExtractedText();
            if (text != null) {
                response.setPreviewText(
                        text.length() > PREVIEW_MAX_CHARS ? text.substring(0, PREVIEW_MAX_CHARS) : text);
            }
        } else {
            response.setStatus("EXTRACTED");
        }
        return response;
    }

    private void updateResumeStatus(String resumeId, ResumeStatus status) {
        updateResumeStatusWithTimestamp(resumeId, status, Instant.now().toString());
    }

    private void updateResumeStatusWithTimestamp(String resumeId, ResumeStatus status, String timestamp) {
        firestoreService.updateDocument(
                RESUMES_COLLECTION, resumeId,
                Map.of("status", status.name(), "updatedAt", timestamp));
    }
}
