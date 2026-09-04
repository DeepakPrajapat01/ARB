package com.resumerebuilder.ai.service;

import com.resumerebuilder.ai.model.ResumeData;
import com.resumerebuilder.ai.model.ResumeOptimization;
import com.resumerebuilder.ai.provider.MockResumeOptimizer;
import com.resumerebuilder.firebase.FirestoreService;
import com.resumerebuilder.resume.model.Resume;
import com.resumerebuilder.resume.model.ResumeStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ResumeOptimizationServiceTest {

        @Mock
        private FirestoreService firestoreService;

        private MockResumeOptimizer mockOptimizer;
        private OptimizationChangeValidator changeValidator;
        private ResumeOptimizationService service;

        @BeforeEach
        void setUp() {
                mockOptimizer = new MockResumeOptimizer();
                changeValidator = new OptimizationChangeValidator();
                service = new ResumeOptimizationService(firestoreService, mockOptimizer, changeValidator);
        }

        private Resume buildResume(String userId, ResumeStatus status) {
                Resume r = new Resume();
                r.setUserId(userId);
                r.setStatus(status);
                return r;
        }

        @Test
        void testOptimizeResume_Success() {
                String userId = "user1";
                String resumeId = "resume1";

                when(firestoreService.getDocument("resumes", resumeId, Resume.class))
                                .thenReturn(buildResume(userId, ResumeStatus.STRUCTURED));

                ResumeData originalData = new ResumeData();
                when(firestoreService.getDocument("resumes/" + resumeId + "/data", "current", ResumeData.class))
                                .thenReturn(originalData);

                ResumeOptimization result = service.optimizeResume(userId, resumeId, "Android Developer");

                assertNotNull(result);
                assertEquals(ResumeStatus.OPTIMIZED, result.getStatus());
                assertEquals("Android Developer", result.getTargetRole());

                // Verify optimized data saved to optimization/latest
                verify(firestoreService).saveDocument(
                                eq("resumes/" + resumeId + "/optimization"), eq("latest"),
                                any(ResumeOptimization.class));
        }

        @Test
        void testOptimizeResume_RejectsUnauthorizedUser() {
                when(firestoreService.getDocument("resumes", "resume1", Resume.class))
                                .thenReturn(buildResume("different-user", ResumeStatus.STRUCTURED));

                assertThrows(com.resumerebuilder.extraction.exception.DocumentNotFoundException.class,
                                () -> service.optimizeResume("user1", "resume1", "Backend Developer"));
        }

        @Test
        void testOptimizeResume_RejectsWrongStatus() {
                when(firestoreService.getDocument("resumes", "resume1", Resume.class))
                                .thenReturn(buildResume("user1", ResumeStatus.EXTRACTED));

                assertThrows(IllegalStateException.class,
                                () -> service.optimizeResume("user1", "resume1", "Backend Developer"));
        }

        @Test
        void testOptimizeResume_HallucinatedMetricRejected() {
                when(firestoreService.getDocument("resumes", "resume1", Resume.class))
                                .thenReturn(buildResume("user1", ResumeStatus.STRUCTURED));

                ResumeData originalData = new ResumeData();
                originalData.setSummary("Software developer.");
                when(firestoreService.getDocument("resumes/resume1/data", "current", ResumeData.class))
                                .thenReturn(originalData);

                // TEST_HALLUCINATION triggers mock to inject "500%" which isn't in original
                RuntimeException ex = assertThrows(RuntimeException.class,
                                () -> service.optimizeResume("user1", "resume1", "TEST_HALLUCINATION"));
                assertTrue(ex.getMessage().contains("Optimization failed"));
        }

        @Test
        void testExecuteMerge_SavesAndClearsPending() {
                String userId = "user1";
                String resumeId = "resume1";

                when(firestoreService.getDocument("resumes", resumeId, Resume.class))
                                .thenReturn(buildResume(userId, ResumeStatus.OPTIMIZED));

                ResumeOptimization pending = new ResumeOptimization();
                pending.setStatus(ResumeStatus.OPTIMIZED);
                pending.setOriginalData(new ResumeData());
                pending.setOptResumeData(new ResumeData());
                when(firestoreService.getDocument("resumes/" + resumeId + "/optimization", "latest",
                                ResumeOptimization.class))
                                .thenReturn(pending);

                ResumeData merged = new ResumeData();
                service.executeMerge(userId, resumeId, merged);

                // Saves merged data to data/current
                verify(firestoreService).saveDocument(eq("resumes/" + resumeId + "/data"), eq("current"), eq(merged));
                // Deletes the pending optimization
                verify(firestoreService).deleteDocument("resumes/" + resumeId + "/optimization", "latest");
        }

        @Test
        void testRejectOptimization_ClearsPending() {
                when(firestoreService.getDocument("resumes", "resume1", Resume.class))
                                .thenReturn(buildResume("user1", ResumeStatus.OPTIMIZED));

                service.rejectOptimization("user1", "resume1");

                verify(firestoreService).deleteDocument("resumes/resume1/optimization", "latest");
        }
}
