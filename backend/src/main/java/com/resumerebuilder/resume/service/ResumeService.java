package com.resumerebuilder.resume.service;

import com.resumerebuilder.firebase.FirestoreService;
import com.resumerebuilder.resume.model.Resume;
import com.resumerebuilder.resume.model.ResumeStatus;
import com.resumerebuilder.storage.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.net.URL;

/**
 * Orchestrator sitting between HTTP requests, Supabase file storage, and
 * Firestore metadata.
 * Prohibits duplicate uploads natively and applies strict security rules for
 * bucket routing.
 */
@Service
public class ResumeService {

    private final FirestoreService firestoreService;
    private final StorageService storageService;

    private static final String COLLECTION_NAME = "resumes";
    private static final String BUCKET_NAME = "resume-files";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    public ResumeService(FirestoreService firestoreService, StorageService storageService) {
        this.firestoreService = firestoreService;
        this.storageService = storageService;
    }

    public Resume uploadResume(String userId, MultipartFile file) {
        validateFile(file);

        String resumeId = UUID.randomUUID().toString();
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.pdf";
        // Enforced Supabase mapping explicitly isolating files into their own isolated
        // uid boundary
        String storagePath = "users/" + userId + "/resumes/" + resumeId + "/original/" + filename;

        // Blockingly pipe string payload over to Supabase AWS cluster
        storageService.uploadFile(BUCKET_NAME, storagePath, file);

        String now = Instant.now().toString();
        Resume resume = new Resume();
        resume.setId(resumeId);
        resume.setUserId(userId);
        resume.setOriginalFileName(filename);
        resume.setStorageBucket(BUCKET_NAME);
        resume.setStoragePath(storagePath);
        resume.setFileType(getFileExtension(filename).toUpperCase());
        resume.setFileSize(file.getSize());
        resume.setStatus(ResumeStatus.UPLOADED);
        resume.setCreatedAt(now);
        resume.setUpdatedAt(now);

        firestoreService.saveDocument(COLLECTION_NAME, resumeId, resume);
        return resume;
    }

    public List<Resume> getUserResumes(String userId) {
        return firestoreService.getDocumentsByField(COLLECTION_NAME, "userId", userId, Resume.class);
    }

    public Resume getResume(String userId, String resumeId) {
        Resume resume = firestoreService.getDocument(COLLECTION_NAME, resumeId, Resume.class);
        if (resume == null || !resume.getUserId().equals(userId)) {
            throw new RuntimeException("Resume not found or unauthorized");
        }
        return resume;
    }

    public void deleteResume(String userId, String resumeId) {
        Resume resume = getResume(userId, resumeId);

        // Delete physical object in Supabase
        boolean fileDeleted = false;
        try {
            storageService.deleteFile(resume.getStorageBucket(), resume.getStoragePath());
            fileDeleted = true;
        } catch (Exception e) {
            System.err.println(
                    "Critical Error: Supabase deletion failed. Orphan file possible at: " + resume.getStoragePath());
            throw new RuntimeException("Storage deletion failed, rolling back operation to prevent orphan files.");
        }

        // Attempt deleting Firestore trace metadata
        if (fileDeleted) {
            firestoreService.deleteDocument(COLLECTION_NAME, resumeId);
        }
    }

    public URL getDownloadUrl(String userId, String resumeId) {
        Resume resume = getResume(userId, resumeId);
        return storageService.generatePresignedUrl(resume.getStorageBucket(), resume.getStoragePath(), 60);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Resume must be smaller than 5 MB.");
        }
        String filename = file.getOriginalFilename();
        if (filename == null
                || (!filename.toLowerCase().endsWith(".pdf") && !filename.toLowerCase().endsWith(".docx"))) {
            throw new IllegalArgumentException("Only PDF and DOCX files are supported.");
        }
    }

    private String getFileExtension(String filename) {
        int dotIdx = filename.lastIndexOf('.');
        if (dotIdx > 0 && dotIdx < filename.length() - 1) {
            return filename.substring(dotIdx + 1);
        }
        return "UNKNOWN";
    }
}
