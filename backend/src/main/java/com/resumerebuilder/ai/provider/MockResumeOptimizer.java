package com.resumerebuilder.ai.provider;

import com.resumerebuilder.ai.model.ResumeData;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class MockResumeOptimizer implements ResumeOptimizer {

    @Override
    public ResumeData optimizeResumeData(ResumeData data, String targetRole) {
        if (targetRole == null || targetRole.isBlank()) {
            throw new IllegalArgumentException("Target role cannot be blank");
        }

        if (targetRole.equals("FAIL_MOCK")) {
            throw new RuntimeException("Mocked Provider Failure");
        }

        // Deep copy representation logically masking the output block simulating a
        // structured AI return
        ResumeData optimized = new ResumeData();
        optimized.setSchemaVersion(data.getSchemaVersion());
        optimized.setPersonalInfo(data.getPersonalInfo());

        // Mock hallucination behaviors for validation suite limits
        if (targetRole.equals("TEST_HALLUCINATION")) {
            // Append bad metrics
            optimized.setSummary("Successfully increased sales by 500% in React Native.");
            var skills = new com.resumerebuilder.ai.model.Skills();
            skills.setFrameworks(new ArrayList<>(java.util.List.of("React Native", "Angular")));
            optimized.setSkills(skills);

            return optimized;
        }

        // Standard Happy Path mock output mappings
        optimized.setSummary("Highly motivated professional with background in " + targetRole + ".");
        optimized.setSkills(data.getSkills());
        optimized.setProjects(data.getProjects());
        optimized.setExperience(data.getExperience());
        optimized.setEducation(data.getEducation());
        optimized.setCertifications(data.getCertifications());
        optimized.setAchievements(data.getAchievements());

        return optimized;
    }
}
