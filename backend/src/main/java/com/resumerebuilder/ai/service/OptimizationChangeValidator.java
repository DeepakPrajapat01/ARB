package com.resumerebuilder.ai.service;

import com.resumerebuilder.ai.model.ResumeData;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OptimizationChangeValidator {

    // Regex to match percentages, dollar amounts, and big numbers (e.g. 10k, 5M,
    // 50%)
    private static final Pattern NUMERIC_CLAIM_PATTERN = Pattern.compile(
            "\\d+(?:\\.\\d+)?(?:%|k|m|b|\\+)?(?:\\s*(?:users|requests|revenue))?|\\$\\d+", Pattern.CASE_INSENSITIVE);

    /**
     * Checks if the optimized resume hallucinated any unsupported metrics or facts
     * not present in the original.
     * 
     * @param original  Original source ResumeData
     * @param optimized AI Optimized ResumeData
     * @throws IllegalArgumentException if hallucinated claims are detected.
     */
    public void validateChanges(ResumeData original, ResumeData optimized) {
        String originalTexts = extractAllText(original).toLowerCase();

        List<String> optimizedClaims = extractNumericClaims(extractAllText(optimized));
        for (String claim : optimizedClaims) {
            if (!originalTexts.contains(claim.toLowerCase())) {
                throw new IllegalArgumentException(
                        "Optimization rejected: AI hallucinated unauthorized numeric claim/metric -> " + claim);
            }
        }
    }

    private String extractAllText(ResumeData data) {
        if (data == null)
            return "";
        StringBuilder sb = new StringBuilder();
        if (data.getSummary() != null)
            sb.append(data.getSummary()).append(" ");

        if (data.getExperience() != null) {
            data.getExperience().forEach(e -> {
                if (e.getCompany() != null)
                    sb.append(e.getCompany()).append(" ");
                if (e.getResponsibilities() != null) {
                    e.getResponsibilities().forEach(r -> sb.append(r).append(" "));
                }
            });
        }

        if (data.getProjects() != null) {
            data.getProjects().forEach(p -> {
                if (p.getDescription() != null)
                    sb.append(p.getDescription()).append(" ");
            });
        }
        return sb.toString();
    }

    private List<String> extractNumericClaims(String text) {
        List<String> claims = new ArrayList<>();
        Matcher matcher = NUMERIC_CLAIM_PATTERN.matcher(text);
        while (matcher.find()) {
            claims.add(matcher.group());
        }
        return claims;
    }
}
