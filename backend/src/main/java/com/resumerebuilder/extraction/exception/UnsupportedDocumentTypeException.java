package com.resumerebuilder.extraction.exception;

/**
 * Thrown when the uploaded document's actual file type (as detected
 * via magic bytes) is neither PDF nor DOCX.
 */
public class UnsupportedDocumentTypeException extends RuntimeException {

    public UnsupportedDocumentTypeException(String message) {
        super(message);
    }
}
