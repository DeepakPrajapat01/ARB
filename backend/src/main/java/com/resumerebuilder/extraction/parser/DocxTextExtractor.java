package com.resumerebuilder.extraction.parser;

import com.resumerebuilder.extraction.exception.InvalidDocumentException;
import com.resumerebuilder.extraction.model.ExtractedDocument;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

/**
 * Extracts raw text from DOCX documents using Apache POI XWPF.
 *
 * Extracts both paragraphs and table cell text in logical row order,
 * since many resumes use tables for layout.
 */
@Component
public class DocxTextExtractor implements DocumentTextExtractor {

    private static final Logger log = LoggerFactory.getLogger(DocxTextExtractor.class);

    @Override
    public ExtractedDocument extract(InputStream inputStream, String mimeType) {
        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            StringBuilder sb = new StringBuilder();

            // Extract paragraphs and tables in document order
            // Apache POI's body elements preserve the original document order
            for (var element : document.getBodyElements()) {
                if (element instanceof XWPFParagraph paragraph) {
                    String text = paragraph.getText();
                    if (text != null && !text.isBlank()) {
                        sb.append(text).append("\n");
                    }
                } else if (element instanceof XWPFTable table) {
                    extractTableText(table, sb);
                }
            }

            String rawText = sb.toString();

            // DOCX always reports 1 "page" at the data level; page count is not reliable
            // from POI without rendering. We report 1 for DOCX consistently.
            int pageCount = 1;

            log.info("DOCX extraction completed: characters={}", rawText.length());
            return new ExtractedDocument(rawText, pageCount);

        } catch (IOException e) {
            log.warn("DOCX extraction failed due to I/O error: {}", e.getMessage());
            throw new InvalidDocumentException(
                    "The DOCX file appears to be corrupt or malformed and could not be read.", e);
        } catch (Exception e) {
            log.warn("DOCX extraction failed unexpectedly: {}", e.getMessage());
            throw new InvalidDocumentException(
                    "We couldn't read this DOCX file. Please upload a valid .docx file.", e);
        }
    }

    /**
     * Extracts text from a table in logical row-then-cell order.
     * Cell text is separated by newlines to preserve readability.
     */
    private void extractTableText(XWPFTable table, StringBuilder sb) {
        List<XWPFTableRow> rows = table.getRows();
        for (XWPFTableRow row : rows) {
            List<XWPFTableCell> cells = row.getTableCells();
            for (XWPFTableCell cell : cells) {
                String cellText = cell.getText();
                if (cellText != null && !cellText.isBlank()) {
                    sb.append(cellText.strip()).append("\n");
                }
            }
        }
        sb.append("\n"); // blank line after each table
    }
}
