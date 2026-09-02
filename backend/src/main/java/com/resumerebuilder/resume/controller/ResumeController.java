package com.resumerebuilder.resume.controller;

import com.google.firebase.auth.FirebaseToken;
import com.resumerebuilder.ai.model.OptimizationRequest;
import com.resumerebuilder.ai.model.ResumeData;
import com.resumerebuilder.ai.model.ResumeOptimization;
import com.resumerebuilder.ai.service.ResumeOptimizationService;
import com.resumerebuilder.ai.service.ResumeStructuringService;
import com.resumerebuilder.extraction.model.ExtractionResponse;
import com.resumerebuilder.extraction.service.DocumentExtractionService;
import com.resumerebuilder.firebase.FirebaseTokenService;
import com.resumerebuilder.resume.model.Resume;
import com.resumerebuilder.resume.service.ResumeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

import java.net.URL;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/resumes")
public class ResumeController {

    private final ResumeService resumeService;
    private final FirebaseTokenService firebaseTokenService;
    private final DocumentExtractionService documentExtractionService;
    private final ResumeStructuringService resumeStructuringService;
    private final ResumeOptimizationService optimizationService;

    public ResumeController(ResumeService resumeService,
            FirebaseTokenService firebaseTokenService,
            DocumentExtractionService documentExtractionService,
            ResumeStructuringService resumeStructuringService,
            ResumeOptimizationService optimizationService) {
        this.resumeService = resumeService;
        this.firebaseTokenService = firebaseTokenService;
        this.documentExtractionService = documentExtractionService;
        this.resumeStructuringService = resumeStructuringService;
        this.optimizationService = optimizationService;
    }

    // ── Upload ─────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> uploadResume(HttpServletRequest request, @RequestParam("file") MultipartFile file) {
        try {
            FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);
            Resume resume = resumeService.uploadResume(token.getUid(), file);
            return ResponseEntity.ok(resume);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("Firebase Token")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // ── List / Get / Delete ────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<?> getUserResumes(HttpServletRequest request) {
        try {
            FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);
            List<Resume> resumes = resumeService.getUserResumes(token.getUid());
            return ResponseEntity.ok(Map.of("resumes", resumes));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getResume(HttpServletRequest request, @PathVariable String id) {
        try {
            FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);
            Resume resume = resumeService.getResume(token.getUid(), id);
            return ResponseEntity.ok(resume);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResume(HttpServletRequest request, @PathVariable String id) {
        try {
            FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);
            resumeService.deleteResume(token.getUid(), id);
            return ResponseEntity.ok(Map.of("message", "Resume deleted securely"));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadResume(HttpServletRequest request, @PathVariable String id) {
        try {
            FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);
            URL url = resumeService.getDownloadUrl(token.getUid(), id);
            return ResponseEntity.ok(Map.of("url", url.toString()));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
    }

    // ── Extraction (Milestone 5) ────────────────────────────────────────────────

    /**
     * POST /api/v1/resumes/{id}/extract
     * Triggers text extraction from the file in Supabase Storage.
     */
    @PostMapping("/{id}/extract")
    public ResponseEntity<?> extractResume(HttpServletRequest request, @PathVariable String id) {
        FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);
        ExtractionResponse result = documentExtractionService.extractResume(token.getUid(), id);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/v1/resumes/{id}/extraction
     * Returns the existing extraction result without re-triggering extraction.
     */
    @GetMapping("/{id}/extraction")
    public ResponseEntity<?> getExtractionResult(HttpServletRequest request, @PathVariable String id) {
        FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);
        ExtractionResponse result = documentExtractionService.getExtractionResult(token.getUid(), id);
        return ResponseEntity.ok(result);
    }

    // ── Structuring (Milestone 6) ───────────────────────────────────────────────

    /**
     * POST /api/v1/resumes/{id}/structure
     * Triggers AI structuring pipeline from extracted text → ResumeData.
     */
    @PostMapping("/{id}/structure")
    public ResponseEntity<?> structureResume(HttpServletRequest request, @PathVariable String id) {
        try {
            FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);
            Map<String, Object> result = resumeStructuringService.structureResume(token.getUid(), id);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            if (e.getMessage() != null
                    && (e.getMessage().contains("Firebase Token") || e.getMessage().contains("Authorization"))) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "AI analysis failed"));
        }
    }

    /**
     * GET /api/v1/resumes/{id}/data
     * Returns the current structured ResumeData without calling AI.
     */
    @GetMapping("/{id}/data")
    public ResponseEntity<?> getStructuredData(HttpServletRequest request, @PathVariable String id) {
        try {
            FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);
            ResumeData data = resumeStructuringService.getStructuredData(token.getUid(), id);
            if (data == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Structured data not found. Ensure extraction ran successfully."));
            }
            return ResponseEntity.ok(data);
        } catch (RuntimeException e) {
            if (e.getMessage() != null
                    && (e.getMessage().contains("Firebase Token") || e.getMessage().contains("Authorization"))) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to retrieve data"));
        }
    }

    /**
     * PUT /api/v1/resumes/{id}/data
     * Saves manual user edits to the structured data — does NOT call AI.
     */
    @PutMapping("/{id}/data")
    public ResponseEntity<?> updateStructuredData(HttpServletRequest request, @PathVariable String id,
            @RequestBody ResumeData data) {
        FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);
        resumeStructuringService.updateStructuredData(token.getUid(), id, data);
        return ResponseEntity.ok(Map.of("status", "SUCCESS"));
    }

    // ── Optimization (Milestone 7) ─────────────────────────────────────────────

    /**
     * POST /api/v1/resumes/{id}/optimize
     * Triggers AI optimization of the current validated ResumeData for a target
     * role.
     */
    @PostMapping("/{id}/optimize")
    public ResponseEntity<?> optimizeResume(HttpServletRequest request, @PathVariable String id,
            @RequestBody OptimizationRequest optimizationRequest) {
        try {
            FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);
            String targetRole = optimizationRequest.getTargetRole();
            if (targetRole == null || targetRole.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Target role is required."));
            }
            ResumeOptimization result = optimizationService.optimizeResume(token.getUid(), id, targetRole.trim());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/v1/resumes/{id}/optimization
     * Returns the latest pending optimization for user review.
     */
    @GetMapping("/{id}/optimization")
    public ResponseEntity<?> getPendingOptimization(HttpServletRequest request, @PathVariable String id) {
        try {
            FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);
            ResumeOptimization result = optimizationService.getOptimization(token.getUid(), id);
            if (result == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/v1/resumes/{id}/optimization/accept
     * Accepts (all or partial) AI changes. Client sends the final merged
     * ResumeData.
     */
    @PostMapping("/{id}/optimization/accept")
    public ResponseEntity<?> acceptOptimization(HttpServletRequest request, @PathVariable String id,
            @RequestBody ResumeData mergedData) {
        try {
            FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);
            optimizationService.executeMerge(token.getUid(), id, mergedData);
            return ResponseEntity.ok(Map.of("message", "Optimization accepted and saved successfully."));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/v1/resumes/{id}/optimization/reject
     * Rejects the pending optimization — current ResumeData is left unchanged.
     */
    @PostMapping("/{id}/optimization/reject")
    public ResponseEntity<?> rejectOptimization(HttpServletRequest request, @PathVariable String id) {
        try {
            FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);
            optimizationService.rejectOptimization(token.getUid(), id);
            return ResponseEntity.ok(Map.of("message", "Optimization rejected. Original data preserved."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
