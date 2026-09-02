package com.resumerebuilder.extraction.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Performs safe, lossless cleanup of raw text extracted from PDF/DOCX
 * documents.
 *
 * Rules applied:
 * - Normalize line endings (CRLF → LF, CR → LF)
 * - Trim leading/trailing whitespace from each line
 * - Collapse 3+ consecutive blank lines into 2 blank lines
 * - Trim overall result
 * - Cap at configurable max character count (default 100,000)
 *
 * Does NOT:
 * - Rewrite sentences
 * - Change wording
 * - Reorder content
 * - Remove meaningful punctuation
 * - Classify sections
 */
@Service
public class TextNormalizationService {

    @Value("${resume.extraction.max-characters:100000}")
    private int maxCharacters;

    /**
     * Normalize the raw extracted text from a document.
     *
     * @param rawText The raw text produced by a document extractor
     * @return A cleaned version of the text, faithful to the source
     */
    public String normalize(String rawText) {
        if (rawText == null) {
            return "";
        }

        // 1. Normalize line endings
        String normalized = rawText.replace("\r\n", "\n").replace("\r", "\n");

        // 2. Trim each line
        String[] lines = normalized.split("\n");
        StringBuilder sb = new StringBuilder(normalized.length());
        int consecutiveBlankLines = 0;

        for (String line : lines) {
            String trimmed = line.stripTrailing();

            if (trimmed.isEmpty()) {
                consecutiveBlankLines++;
                // Collapse more than 2 consecutive blank lines
                if (consecutiveBlankLines <= 2) {
                    sb.append("\n");
                }
            } else {
                consecutiveBlankLines = 0;
                sb.append(trimmed).append("\n");
            }
        }

        // 3. Overall trim
        String result = sb.toString().strip();

        // 4. Cap at max characters
        if (result.length() > maxCharacters) {
            result = result.substring(0, maxCharacters);
        }

        return result;
    }
}
