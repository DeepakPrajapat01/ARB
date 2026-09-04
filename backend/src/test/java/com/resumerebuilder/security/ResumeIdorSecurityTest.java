package com.resumerebuilder.security;

import com.resumerebuilder.ai.model.ResumeData;
import com.resumerebuilder.ai.service.ResumeOptimizationService;
import com.resumerebuilder.ai.service.ResumeStructuringService;
import com.resumerebuilder.extraction.exception.DocumentNotFoundException;
import com.resumerebuilder.extraction.service.DocumentExtractionService;
import com.resumerebuilder.firebase.FirestoreService;
import com.resumerebuilder.resume.model.Resume;
import com.resumerebuilder.resume.model.ResumeStatus;
import com.resumerebuilder.resume.service.ResumeService;
import com.resumerebuilder.storage.StorageService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ResumeIdorSecurityTest {

    @Mock
    private FirestoreService firestoreService;

    @Mock
    private StorageService storageService;

    private ResumeService resumeService;

    private static final String USER_A = "user-a-123";
    private static final String USER_B = "user-b-789";
    private static final String RESUME_ID = "resume-a-456";

    private Resume resumeA;

    @BeforeEach
    void setUp() {
        resumeService = new ResumeService(firestoreService, storageService);

        resumeA = new Resume();
        resumeA.setId(RESUME_ID);
        resumeA.setUserId(USER_A);
        resumeA.setStatus(ResumeStatus.UPLOADED);
        resumeA.setStorageBucket("resume-files");
        resumeA.setStoragePath("users/" + USER_A + "/resumes/" + RESUME_ID + "/original/resume.pdf");
    }

    @Test
    @DisplayName("User A can successfully retrieve their own resume")
    void testUserACanAccessOwnResume() {
        when(firestoreService.getDocument("resumes", RESUME_ID, Resume.class)).thenReturn(resumeA);

        Resume result = resumeService.getResume(USER_A, RESUME_ID);
        assertNotNull(result);
        assertEquals(USER_A, result.getUserId());
        assertEquals(RESUME_ID, result.getId());
    }

    @Test
    @DisplayName("IDOR Prevention: User B cannot access User A's resume")
    void testUserBCannotAccessUserAResume() {
        when(firestoreService.getDocument("resumes", RESUME_ID, Resume.class)).thenReturn(resumeA);

        DocumentNotFoundException exception = assertThrows(
                DocumentNotFoundException.class,
                () -> resumeService.getResume(USER_B, RESUME_ID));

        assertTrue(exception.getMessage().contains(RESUME_ID));
    }

    @Test
    @DisplayName("IDOR Prevention: User B cannot delete User A's resume")
    void testUserBCannotDeleteUserAResume() {
        when(firestoreService.getDocument("resumes", RESUME_ID, Resume.class)).thenReturn(resumeA);

        assertThrows(
                DocumentNotFoundException.class,
                () -> resumeService.deleteResume(USER_B, RESUME_ID));

        verify(firestoreService, never()).deleteDocument(anyString(), anyString());
    }

    @Test
    @DisplayName("IDOR Prevention: Non-existent resume ID throws DocumentNotFoundException for any user")
    void testNonExistentResumeId() {
        when(firestoreService.getDocument("resumes", "non-existent-id", Resume.class)).thenReturn(null);

        assertThrows(
                DocumentNotFoundException.class,
                () -> resumeService.getResume(USER_A, "non-existent-id"));
    }
}
