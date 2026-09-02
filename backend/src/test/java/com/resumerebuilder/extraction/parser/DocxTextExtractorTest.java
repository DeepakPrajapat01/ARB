package com.resumerebuilder.extraction.parser;

import com.resumerebuilder.extraction.exception.InvalidDocumentException;
import com.resumerebuilder.extraction.model.ExtractedDocument;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.*;

class DocxTextExtractorTest {

    private final DocxTextExtractor extractor = new DocxTextExtractor();

    // ---- Helpers ----

    private byte[] createDocxWithParagraphs(String... texts) throws IOException {
        try (XWPFDocument doc = new XWPFDocument();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            for (String text : texts) {
                XWPFParagraph para = doc.createParagraph();
                XWPFRun run = para.createRun();
                run.setText(text);
            }
            doc.write(out);
            return out.toByteArray();
        }
    }

    private byte[] createDocxWithTable(String[][] tableData) throws IOException {
        try (XWPFDocument doc = new XWPFDocument();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            XWPFTable table = doc.createTable(tableData.length, tableData[0].length);
            for (int r = 0; r < tableData.length; r++) {
                XWPFTableRow row = table.getRow(r);
                for (int c = 0; c < tableData[r].length; c++) {
                    row.getCell(c).setText(tableData[r][c]);
                }
            }
            doc.write(out);
            return out.toByteArray();
        }
    }

    // ---- Tests ----

    @Test
    void normalDocx_extractsParagraphs() throws IOException {
        byte[] docxBytes = createDocxWithParagraphs(
                "John Doe", "john@example.com", "EDUCATION", "B.Tech Computer Science");
        ExtractedDocument result = extractor.extract(new ByteArrayInputStream(docxBytes),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        assertThat(result.getText()).contains("John Doe");
        assertThat(result.getText()).contains("EDUCATION");
        assertThat(result.getCharacterCount()).isGreaterThan(0);
    }

    @Test
    void docxWithTable_extractsTableCells() throws IOException {
        String[][] tableData = {
                { "Name", "University" },
                { "John Doe", "MIT" }
        };
        byte[] docxBytes = createDocxWithTable(tableData);
        ExtractedDocument result = extractor.extract(new ByteArrayInputStream(docxBytes),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        assertThat(result.getText()).contains("Name");
        assertThat(result.getText()).contains("University");
        assertThat(result.getText()).contains("John Doe");
    }

    @Test
    void emptyDocx_returnsEmptyText() throws IOException {
        try (XWPFDocument doc = new XWPFDocument();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            doc.write(out);
            byte[] docxBytes = out.toByteArray();
            ExtractedDocument result = extractor.extract(
                    new ByteArrayInputStream(docxBytes),
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            assertThat(result).isNotNull();
            assertThat(result.getText()).isEmpty();
        }
    }

    @Test
    void malformedDocxBytes_throwsInvalidDocumentException() {
        byte[] garbage = "this is absolutely not a docx file".getBytes();
        assertThatThrownBy(() -> extractor.extract(new ByteArrayInputStream(garbage),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .isInstanceOf(InvalidDocumentException.class);
    }
}
