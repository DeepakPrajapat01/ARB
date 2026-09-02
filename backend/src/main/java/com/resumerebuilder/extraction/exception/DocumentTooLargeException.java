package com.resumerebuilder.extraction.exception;

/**
 * Thrown when a document exceeds the configured processing size limit.
 */
public class DocumentTooLargeException extends RuntimeException {

    public DocumentTooLargeException(String message) {
        super(message);
    }
}
