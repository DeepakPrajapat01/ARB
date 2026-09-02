package com.resumerebuilder.pdf.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.auth.FirebaseToken;
import com.resumerebuilder.firebase.FirebaseTokenService;
import com.resumerebuilder.firebase.FirestoreService;
import com.resumerebuilder.pdf.model.PdfMetadata;
import com.resumerebuilder.pdf.service.PdfGenerationService;
import com.resumerebuilder.resume.model.Resume;
import com.resumerebuilder.resume.service.ResumeService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/resumes")
public class PdfController {

    private final PdfGenerationService pdfGenerationService;
    private final ResumeService resumeService;
    private final FirestoreService firestoreService;
    private final ObjectMapper objectMapper;
    private final FirebaseTokenService firebaseTokenService;

    public PdfController(
            PdfGenerationService pdfGenerationService,
            ResumeService resumeService,
            FirestoreService firestoreService,
            ObjectMapper objectMapper,
            FirebaseTokenService firebaseTokenService) {
        this.pdfGenerationService = pdfGenerationService;
        this.resumeService = resumeService;
        this.firestoreService = firestoreService;
        this.objectMapper = objectMapper;
        this.firebaseTokenService = firebaseTokenService;
    }

    /**
     * POST /api/v1/resumes/{id}/pdf
     * Generates a PDF for the given resume using the specified templateId.
     * Requires a valid Firebase ID token in the Authorization header.
     */
    @PostMapping("/{id}/pdf")
    public ResponseEntity<?> generatePdf(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        FirebaseToken token = firebaseTokenService.extractToken(request);
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Unauthorized: valid Firebase token required.");
        }
        String userId = token.getUid();

        Resume resume = resumeService.getResume(userId, id);
        if (resume == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Resume not found.");
        }

        String templateId = body.getOrDefault("templateId", "ats-classic");

        try {
            // Fetch structured resume data to compute a content hash
            Object resumeData = firestoreService.getDocument("resumes", id + "/data/current", Object.class);
            if (resumeData == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Resume has not been structured yet. Run AI Analysis first.");
            }

            String json = objectMapper.writeValueAsString(resumeData);
            String rawHashTarget = templateId + ":" + json;
            String contentHash = bytesToHex(
                    MessageDigest.getInstance("SHA-256")
                            .digest(rawHashTarget.getBytes(StandardCharsets.UTF_8)))
                    .substring(0, 8);

            PdfMetadata meta = pdfGenerationService.generatePdf(id, templateId, userId, contentHash);
            String downloadUrl = pdfGenerationService.generateDownloadUrl(id, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("downloadUrl", downloadUrl);
            response.put("status", meta.getStatus());
            response.put("hash", contentHash);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "PDF generation failed: " + e.getMessage()));
        }
    }

    /**
     * GET /api/v1/resumes/{id}/pdf/download
     * Returns a short-lived signed URL for the most recently generated PDF.
     */
    @GetMapping("/{id}/pdf/download")
    public ResponseEntity<?> getDownloadUrl(
            @PathVariable String id,
            HttpServletRequest request) {

        FirebaseToken token = firebaseTokenService.extractToken(request);
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String userId = token.getUid();

        Resume resume = resumeService.getResume(userId, id);
        if (resume == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        try {
            String downloadUrl = pdfGenerationService.generateDownloadUrl(id, userId);
            return ResponseEntity.ok(Map.of("downloadUrl", downloadUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "No PDF found for this resume: " + e.getMessage()));
        }
    }

    private String bytesToHex(byte[] hash) {
        StringBuilder hexString = new StringBuilder(2 * hash.length);
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1)
                hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
