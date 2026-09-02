package com.resumerebuilder.ai.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumerebuilder.ai.model.ResumeData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;

/**
 * A mock implementation for tests and local dev safely mimicking Gemini
 * structured output behavior (delays, synthetic responses, errors).
 */
@Service
public class MockStructuredResumeExtractor implements StructuredResumeExtractor {

    private static final Logger log = LoggerFactory.getLogger(MockStructuredResumeExtractor.class);
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public ResumeData extractStructuredData(String rawText) {
        log.info("MockStructuredResumeExtractor: simulating extraction for text of size {}", rawText.length());

        // Simulate prompt injection protection
        if (rawText.contains("Ignore previous instructions")) {
            log.warn("MockStructuredResumeExtractor: Detected prompt injection text");
            // In a real system, we either parse it safely treating it as content,
            // or fail safe. The mock just returns a safe empty structure.
            return emulateSafeStructure();
        }

        // Simulate provider exception or malformed JSON path
        if (rawText.contains("MOCK_FAIL_PROVIDER")) {
            throw new RuntimeException("Mocked Provider Timeout");
        }

        if (rawText.contains("MOCK_FAIL_SCHEMA")) {
            // Return an object that might fail upstream mapping or validation
            try {
                return mapper.readValue("{\"schemaVersion\": \"1.0\", \"unknown_field\": true}", ResumeData.class);
            } catch (Exception e) {
                throw new RuntimeException("Failed to map mock json", e);
            }
        }

        // Happy path
        try {
            // Load a static response for happy path simulation
            InputStream is = getClass().getResourceAsStream("/mock-gemini-response.json");
            if (is != null) {
                return mapper.readValue(is, ResumeData.class);
            } else {
                log.warn("mock-gemini-response.json not found in resources, falling back to safe empty.");
                return emulateSafeStructure();
            }
        } catch (Exception e) {
            log.error("Failed to read mock data", e);
            return emulateSafeStructure();
        }
    }

    private ResumeData emulateSafeStructure() {
        return new ResumeData();
    }
}
