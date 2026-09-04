package com.resumerebuilder.ai.service;

import com.resumerebuilder.ai.model.ResumeData;
import com.resumerebuilder.ai.model.ResumeOptimization;
import com.resumerebuilder.ai.provider.ResumeOptimizer;
import com.resumerebuilder.firebase.FirestoreService;
import com.resumerebuilder.resume.model.Resume;
import com.resumerebuilder.resume.model.ResumeStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class ResumeOptimizationService {

    private final FirestoreService firestoreService;
    private final ResumeOptimizer resumeOptimizer;
    private final OptimizationChangeValidator changeValidator;

    private static final String RESUMES_COLLECTION = "resumes";
    private static final String DATA_SUBCOLLECTION = "data";
    private static final String DATA_DOC_ID = "current";
    private static final String OPTIMIZATION_SUBCOLLECTION = "optimization";
    private static final String OPTIMIZATION_DOC_ID = "latest";

    public ResumeOptimizationService(FirestoreService firestoreService, ResumeOptimizer resumeOptimizer,
            OptimizationChangeValidator changeValidator) {
        this.firestoreService = firestoreService;
        this.resumeOptimizer = resumeOptimizer;
        this.changeValidator = changeValidator;
    }

    public ResumeOptimization optimizeResume(String userId, String resumeId, String targetRole) {
        Resume resume = firestoreService.getDocument(RESUMES_COLLECTION, resumeId, Resume.class);
        if (resume == null || resume.getUserId() == null || !resume.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Resume not found or unauthorized");
        }

        if (resume.getStatus() != ResumeStatus.STRUCTURED && resume.getStatus() != ResumeStatus.OPTIMIZED
                && resume.getStatus() != ResumeStatus.OPTIMIZATION_FAILED) {
            throw new IllegalStateException("Resume must be in STRUCTURED or OPTIMIZED state to optimize.");
        }

        // Shift State
        firestoreService.updateDocument(RESUMES_COLLECTION, resumeId, Map.of("status", ResumeStatus.OPTIMIZING.name()));

        try {
            ResumeData currentData = firestoreService.getDocument(
                    RESUMES_COLLECTION + "/" + resumeId + "/" + DATA_SUBCOLLECTION, DATA_DOC_ID, ResumeData.class);
            if (currentData == null) {
                throw new IllegalStateException("Valid structural data not found for optimization.");
            }

            // Route block to abstract infrastructure
            ResumeData optResumeData = resumeOptimizer.optimizeResumeData(currentData, targetRole);

            // Halt if AI hallucinated bounds
            changeValidator.validateChanges(currentData, optResumeData);

            ResumeOptimization optRecord = new ResumeOptimization();
            optRecord.setTargetRole(targetRole);
            optRecord.setOriginalData(currentData);
            optRecord.setOptResumeData(optResumeData);
            optRecord.setStatus(ResumeStatus.OPTIMIZED);
            String now = Instant.now().toString();
            optRecord.setCreatedAt(now);
            optRecord.setUpdatedAt(now);

            firestoreService.saveDocument(RESUMES_COLLECTION + "/" + resumeId + "/" + OPTIMIZATION_SUBCOLLECTION,
                    OPTIMIZATION_DOC_ID, optRecord);
            firestoreService.updateDocument(RESUMES_COLLECTION, resumeId,
                    Map.of("updatedAt", now, "targetRole", targetRole));

            return optRecord;
        } catch (Exception e) {
            firestoreService.updateDocument(RESUMES_COLLECTION, resumeId,
                    Map.of("status", ResumeStatus.OPTIMIZATION_FAILED.name()));
            throw new RuntimeException("Optimization failed: " + e.getMessage(), e);
        }
    }

    public void executeMerge(String userId, String resumeId, ResumeData optResumeData) {
        Resume resume = firestoreService.getDocument(RESUMES_COLLECTION, resumeId, Resume.class);
        if (resume == null || resume.getUserId() == null || !resume.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Resume not found or unauthorized");
        }

        ResumeOptimization pending = firestoreService.getDocument(
                RESUMES_COLLECTION + "/" + resumeId + "/" + OPTIMIZATION_SUBCOLLECTION, OPTIMIZATION_DOC_ID,
                ResumeOptimization.class);
        if (pending == null || pending.getStatus() != ResumeStatus.OPTIMIZED) {
            throw new IllegalStateException("No valid pending optimization found.");
        }

        // Preserve current to history
        ResumeData original = pending.getOriginalData();
        String archiveId = UUID.randomUUID().toString();
        firestoreService.saveDocument(RESUMES_COLLECTION + "/" + resumeId + "/data_history", archiveId, original);

        String now = Instant.now().toString();

        // Save new core block
        firestoreService.saveDocument(RESUMES_COLLECTION + "/" + resumeId + "/" + DATA_SUBCOLLECTION, DATA_DOC_ID,
                optResumeData);
        // Clear Pending UI flag
        firestoreService.deleteDocument(RESUMES_COLLECTION + "/" + resumeId + "/" + OPTIMIZATION_SUBCOLLECTION,
                OPTIMIZATION_DOC_ID);
        firestoreService.updateDocument(RESUMES_COLLECTION, resumeId,
                Map.of("updatedAt", now, "status", ResumeStatus.OPTIMIZED.name()));
    }

    public void rejectOptimization(String userId, String resumeId) {
        Resume resume = firestoreService.getDocument(RESUMES_COLLECTION, resumeId, Resume.class);
        if (resume == null || resume.getUserId() == null || !resume.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Resume not found or unauthorized");
        }
        firestoreService.deleteDocument(RESUMES_COLLECTION + "/" + resumeId + "/" + OPTIMIZATION_SUBCOLLECTION,
                OPTIMIZATION_DOC_ID);
    }

    public ResumeOptimization getOptimization(String userId, String resumeId) {
        Resume resume = firestoreService.getDocument(RESUMES_COLLECTION, resumeId, Resume.class);
        if (resume == null || resume.getUserId() == null || !resume.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Resume not found or unauthorized");
        }
        return firestoreService.getDocument(RESUMES_COLLECTION + "/" + resumeId + "/" + OPTIMIZATION_SUBCOLLECTION,
                OPTIMIZATION_DOC_ID, ResumeOptimization.class);
    }
}
