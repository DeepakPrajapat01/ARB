package com.resumerebuilder.extraction.exception;

/**
 * Thrown when text extraction from a PDF or DOCX document fails
 * for any reason (corrupt file, processing error, etc.).
 */
public class DocumentExtractionException extends RuntimeException {

    public DocumentExtractionException(String message) {
        super(message);
    }

    public DocumentExtractionException(String message, Throwable cause) {
        super(message, cause);
    }
}
