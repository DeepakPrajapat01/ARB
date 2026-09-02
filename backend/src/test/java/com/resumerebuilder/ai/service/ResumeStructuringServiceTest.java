package com.resumerebuilder.ai.service;

import com.resumerebuilder.ai.model.PersonalInfo;
import com.resumerebuilder.ai.model.ResumeData;
import com.resumerebuilder.ai.provider.MockStructuredResumeExtractor;
import com.resumerebuilder.extraction.model.ExtractionResult;
import com.resumerebuilder.firebase.FirestoreService;
import com.resumerebuilder.resume.model.Resume;
import com.resumerebuilder.resume.model.ResumeStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ResumeStructuringServiceTest {

        @Mock
        private FirestoreService firestoreService;

        // Use actual mock implementation instead of Mockito to test its mapping safely
        private MockStructuredResumeExtractor mockExtractor = new MockStructuredResumeExtractor();

        private ResumeStructuringService service;

        @BeforeEach
        void setUp() {
                service = new ResumeStructuringService(firestoreService, mockExtractor);
        }

        @Test
        void testStructureResume_Success() {
                // Arrange
                String userId = "user123";
                String resumeId = "resume123";

                Resume resume = new Resume();
                resume.setUserId(userId);
                resume.setStatus(ResumeStatus.EXTRACTED);

                ExtractionResult extractionResult = new ExtractionResult();
                extractionResult.setExtractedText("John Doe, Software Engineer. Built cool stuff.");

                when(firestoreService.getDocument("resumes", resumeId, Resume.class)).thenReturn(resume);
                when(firestoreService.getDocument("resumes/" + resumeId + "/extraction", resumeId,
                                ExtractionResult.class))
                                .thenReturn(extractionResult);

                // Act
                Map<String, Object> result = service.structureResume(userId, resumeId);

                // Assert
                assertNotNull(result);
                assertEquals("STRUCTURED", result.get("status"));

                // Verify state changes
                verify(firestoreService).updateDocument(eq("resumes"), eq(resumeId),
                                argThat(map -> ((Map<?, ?>) map).get("status").equals("STRUCTURING")));
                verify(firestoreService).updateDocument(eq("resumes"), eq(resumeId),
                                argThat(map -> ((Map<?, ?>) map).get("status").equals("STRUCTURED")));

                // Verify structured data is saved
                verify(firestoreService).saveDocument(eq("resumes/" + resumeId + "/data"), eq("current"),
                                any(ResumeData.class));
        }

        @Test
        void testStructureResume_Idempotent_SkipsIfAlreadyStructured() {
                String userId = "user123";
                String resumeId = "resume123";

                Resume resume = new Resume();
                resume.setUserId(userId);
                resume.setStatus(ResumeStatus.STRUCTURED);

                when(firestoreService.getDocument("resumes", resumeId, Resume.class)).thenReturn(resume);

                Map<String, Object> result = service.structureResume(userId, resumeId);

                assertEquals("STRUCTURED", result.get("status"));
                // Never queries for extraction result since it's already done
                verify(firestoreService, never()).getDocument(eq("resumes/" + resumeId + "/extraction"), anyString(),
                                eq(ExtractionResult.class));
        }

        @Test
        void testUpdateStructuredData_Success() {
                String userId = "user123";
                String resumeId = "resume123";

                Resume resume = new Resume();
                resume.setUserId(userId);

                when(firestoreService.getDocument("resumes", resumeId, Resume.class)).thenReturn(resume);

                ResumeData newData = new ResumeData();
                newData.setPersonalInfo(new PersonalInfo()); // ensure not null boundary passes

                service.updateStructuredData(userId, resumeId, newData);

                // Checks it saved timestamps on root and pushed object to data subcollection
                // correctly
                verify(firestoreService).saveDocument(eq("resumes/" + resumeId + "/data"), eq("current"), eq(newData));
                verify(firestoreService).updateDocument(eq("resumes"), eq(resumeId),
                                argThat(map -> ((Map<?, ?>) map).containsKey("updatedAt")));
        }
}
