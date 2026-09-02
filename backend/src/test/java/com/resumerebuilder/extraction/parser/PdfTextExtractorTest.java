package com.resumerebuilder.extraction.parser;

import com.resumerebuilder.extraction.exception.InvalidDocumentException;
import com.resumerebuilder.extraction.model.ExtractedDocument;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.*;

class PdfTextExtractorTest {

    private final PdfTextExtractor extractor = new PdfTextExtractor();

    // ---- Helpers ----

    private byte[] createPdfWithText(String text) throws IOException {
        try (PDDocument doc = new PDDocument();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                cs.newLineAtOffset(50, 700);
                cs.showText(text);
                cs.endText();
            }
            doc.save(out);
            return out.toByteArray();
        }
    }

    private byte[] createEmptyPdf() throws IOException {
        // 0-page PDF
        try (PDDocument doc = new PDDocument();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            doc.save(out);
            return out.toByteArray();
        }
    }

    private byte[] createMultiPagePdf() throws IOException {
        try (PDDocument doc = new PDDocument();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            for (int i = 1; i <= 3; i++) {
                PDPage page = new PDPage();
                doc.addPage(page);
                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    cs.beginText();
                    cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    cs.newLineAtOffset(50, 700);
                    cs.showText("Page " + i + " content here for resume section");
                    cs.endText();
                }
            }
            doc.save(out);
            return out.toByteArray();
        }
    }

    // ---- Tests ----

    @Test
    void validPdf_extractsText() throws IOException {
        byte[] pdfBytes = createPdfWithText("John Doe Software Engineer EDUCATION B.Tech CS");
        ExtractedDocument result = extractor.extract(new ByteArrayInputStream(pdfBytes), "application/pdf");
        assertThat(result.getText()).contains("John Doe");
        assertThat(result.getPageCount()).isEqualTo(1);
        assertThat(result.getCharacterCount()).isGreaterThan(0);
    }

    @Test
    void multiPagePdf_extractsAllPages() throws IOException {
        byte[] pdfBytes = createMultiPagePdf();
        ExtractedDocument result = extractor.extract(new ByteArrayInputStream(pdfBytes), "application/pdf");
        assertThat(result.getPageCount()).isEqualTo(3);
        assertThat(result.getText()).contains("Page 1");
        assertThat(result.getText()).contains("Page 3");
    }

    @Test
    void emptyPdf_throwsInvalidDocumentException() throws IOException {
        byte[] pdfBytes = createEmptyPdf();
        assertThatThrownBy(() -> extractor.extract(new ByteArrayInputStream(pdfBytes), "application/pdf"))
                .isInstanceOf(InvalidDocumentException.class);
    }

    @Test
    void malformedBytes_throwsInvalidDocumentException() {
        byte[] garbage = "this is not a pdf file at all !!!".getBytes();
        assertThatThrownBy(() -> extractor.extract(new ByteArrayInputStream(garbage), "application/pdf"))
                .isInstanceOf(InvalidDocumentException.class);
    }

    @Test
    void imagePdf_noTextDetected_throwsInvalidDocumentException() throws IOException {
        // PDF with a page but no text content streams → simulates image-only PDF
        try (PDDocument doc = new PDDocument();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            doc.addPage(new PDPage()); // page with no text
            doc.save(out);
            byte[] pdfBytes = out.toByteArray();

            assertThatThrownBy(() -> extractor.extract(new ByteArrayInputStream(pdfBytes), "application/pdf"))
                    .isInstanceOf(InvalidDocumentException.class)
                    .hasMessageContaining("NO_TEXT_DETECTED");
        }
    }
}
