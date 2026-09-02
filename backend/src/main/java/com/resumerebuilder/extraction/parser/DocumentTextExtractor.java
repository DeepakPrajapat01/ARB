package com.resumerebuilder.extraction.parser;

import com.resumerebuilder.extraction.model.ExtractedDocument;

import java.io.InputStream;

/**
 * Common abstraction for PDF and DOCX document text extractors.
 * Implementations are isolated from the rest of the application so that
 * PDFBox and Apache POI remain internal implementation details.
 */
public interface DocumentTextExtractor {

    /**
     * Extract raw text from the given document input stream.
     *
     * @param inputStream InputStream of the document bytes (caller must close)
     * @param mimeType    Detected MIME type (e.g. "application/pdf")
     * @return ExtractedDocument with raw text, page count, and character count
     */
    ExtractedDocument extract(InputStream inputStream, String mimeType);
}
