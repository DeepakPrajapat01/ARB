package com.resumerebuilder.ai.provider;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumerebuilder.ai.config.GeminiProperties;
import com.resumerebuilder.ai.model.ResumeData;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Primary
@Service
public class GeminiResumeOptimizer implements ResumeOptimizer {

    private final GeminiProperties geminiProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final Map<String, Object> jsonSchema;

    public GeminiResumeOptimizer(GeminiProperties geminiProperties, RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        this.geminiProperties = geminiProperties;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.jsonSchema = loadSchema();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> loadSchema() {
        try {
            String schemaContent = new ClassPathResource("gemini-schema.json")
                    .getContentAsString(StandardCharsets.UTF_8);
            return objectMapper.readValue(schemaContent, Map.class);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load Gemini JSON Schema file internally", e);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public ResumeData optimizeResumeData(ResumeData data, String targetRole) {
        String url = geminiProperties.getBaseUrl() + "/v1beta/models/" + geminiProperties.getModel()
                + ":generateContent?key=" + geminiProperties.getApiKey();

        String promptInstructions = """
                You are a senior technical recruiter and professional resume optimizer.
                Your task is to take the provided verified CANONICAL RESUME JSON and return an OPTIMIZED VERSION of the identical schema based around the TARGET ROLE of: %s.

                STRICT INSTRUCTIONS (CRITICAL):
                1. DO NOT INVENT ANY INFORMATION. No fabricated companies, no fabricated dates, no fabricated metrics, no fabricated URLs.
                2. If no summary exists, seamlessly generate a concise 2-4 sentence professional summary based ONLY around the given facts present below in Context. Do not claim undocumented years of experience.
                3. Rewrite weak project descriptions into professional action-oriented bullet points (e.g. STAR method bounds) utilizing existing facts.
                4. Reorder skills and projects so the most relevant items to the Target Role are displayed earlier. DO NOT introduce new technologies that the candidate did not list.
                5. Return the payload matching the schema definitions directly.

                <RESUME_DATA>
                %s
                </RESUME_DATA>
                """;

        String jsonPayload;
        try {
            jsonPayload = objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to stringify resume data input", e);
        }

        String safePrompt = String.format(promptInstructions, targetRole, jsonPayload);

        Map<String, Object> configurationProperties = new HashMap<>();
        configurationProperties.put("responseMimeType", "application/json");
        configurationProperties.put("responseSchema", this.jsonSchema);

        Map<String, Object> payload = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", safePrompt)))),
                "generationConfig", configurationProperties);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(payload, headers), Map.class);

            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (!parts.isEmpty()) {
                        String jsonResponse = (String) parts.get(0).get("text");
                        return objectMapper.readValue(jsonResponse, ResumeData.class);
                    }
                }
            }
            throw new RuntimeException("Gemini mapped a blank block externally without catching.");
        } catch (Exception e) {
            throw new RuntimeException("Gemini Structuring block optimization payload error: " + e.getMessage(), e);
        }
    }
}
