package com.resumerebuilder.extraction.exception;

/**
 * Thrown when a document is structurally invalid (corrupt, truncated,
 * image-only PDF, etc.)
 * and cannot be parsed for text content.
 */
public class InvalidDocumentException extends RuntimeException {

    public InvalidDocumentException(String message) {
        super(message);
    }

    public InvalidDocumentException(String message, Throwable cause) {
        super(message, cause);
    }
}
