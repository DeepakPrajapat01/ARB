package com.resumerebuilder.extraction.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

class TextNormalizationServiceTest {

    private final TextNormalizationService service = createService(100_000);

    private static TextNormalizationService createService(int maxChars) {
        TextNormalizationService s = new TextNormalizationService();
        ReflectionTestUtils.setField(s, "maxCharacters", maxChars);
        return s;
    }

    @Test
    void nullInput_returnsEmpty() {
        assertThat(service.normalize(null)).isEmpty();
    }

    @Test
    void windowsLineEndings_normalizedToUnix() {
        String input = "Line1\r\nLine2\r\nLine3";
        String result = service.normalize(input);
        assertThat(result).doesNotContain("\r\n");
        assertThat(result).contains("Line1\nLine2\nLine3");
    }

    @Test
    void crLineEndings_normalizedToUnix() {
        String input = "Line1\rLine2\rLine3";
        String result = service.normalize(input);
        assertThat(result).doesNotContain("\r");
        assertThat(result).contains("Line1\nLine2\nLine3");
    }

    @Test
    void excessiveBlankLines_collapsed() {
        String input = "Section1\n\n\n\n\nSection2";
        String result = service.normalize(input);
        // Should not have more than 2 consecutive blank lines
        assertThat(result).doesNotContain("\n\n\n\n");
        assertThat(result).contains("Section1");
        assertThat(result).contains("Section2");
    }

    @Test
    void leadingAndTrailingSpaces_trimmed() {
        String input = "  John Doe  \n  Software Engineer  \n";
        String result = service.normalize(input);
        assertThat(result).startsWith("John Doe");
        assertThat(result).contains("Software Engineer");
        assertThat(result).doesNotContain("  John");
    }

    @Test
    void textBeyondMaxChars_isCapped() {
        TextNormalizationService limited = createService(50);
        String longText = "A".repeat(200);
        String result = limited.normalize(longText);
        assertThat(result.length()).isLessThanOrEqualTo(50);
    }

    @Test
    void sectionHeadings_preserved() {
        String input = "EDUCATION\nB.Tech CS\n\nSKILLS\nJava, Python";
        String result = service.normalize(input);
        assertThat(result).contains("EDUCATION");
        assertThat(result).contains("SKILLS");
        assertThat(result).contains("Java, Python");
    }

    @Test
    void emptyInput_returnsEmpty() {
        assertThat(service.normalize("")).isEmpty();
        assertThat(service.normalize("   ")).isEmpty();
    }
}
