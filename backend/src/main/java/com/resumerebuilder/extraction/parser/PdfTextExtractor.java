package com.resumerebuilder.extraction.parser;

import com.resumerebuilder.extraction.exception.InvalidDocumentException;
import com.resumerebuilder.extraction.model.ExtractedDocument;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;

/**
 * Extracts raw text from PDF documents using Apache PDFBox 3.x.
 *
 * Detects image-only (scanned) PDFs and rejects them with a clear error
 * rather than silently marking them as successfully extracted.
 *
 * Does NOT perform OCR — that is a future milestone.
 */
@Component
public class PdfTextExtractor implements DocumentTextExtractor {

    private static final Logger log = LoggerFactory.getLogger(PdfTextExtractor.class);

    // Threshold below which we consider the PDF to be image-only / scanned
    private static final int MIN_TEXT_THRESHOLD = 20;

    @Override
    public ExtractedDocument extract(InputStream inputStream, String mimeType) {
        try (PDDocument document = org.apache.pdfbox.Loader.loadPDF(inputStream.readAllBytes())) {

            int pageCount = document.getNumberOfPages();
            if (pageCount == 0) {
                throw new InvalidDocumentException(
                        "The PDF document contains no pages and cannot be processed.");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String rawText = stripper.getText(document);

            // Detect scanned / image-only PDF
            if (rawText == null || rawText.strip().length() < MIN_TEXT_THRESHOLD) {
                log.warn("PDF extraction produced little or no text — likely a scanned document.");
                throw new InvalidDocumentException(
                        "NO_TEXT_DETECTED: This PDF appears to contain scanned images rather than " +
                                "selectable text. Please upload a PDF with searchable text.");
            }

            log.info("PDF extraction completed: pages={}, characters={}", pageCount, rawText.length());
            return new ExtractedDocument(rawText, pageCount);

        } catch (InvalidDocumentException e) {
            throw e;
        } catch (IOException e) {
            log.warn("PDF extraction failed due to I/O error: {}", e.getMessage());
            throw new InvalidDocumentException(
                    "The PDF file appears to be corrupt or malformed and could not be read.", e);
        } catch (Exception e) {
            log.warn("PDF extraction failed unexpectedly: {}", e.getMessage());
            throw new InvalidDocumentException(
                    "We couldn't read this PDF. Please upload a valid PDF file.", e);
        }
    }
}
