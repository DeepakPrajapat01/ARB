package com.resumerebuilder.extraction.exception;

/**
 * Thrown when the resume document cannot be found in Supabase Storage
 * or the resume metadata does not exist in Firestore.
 */
public class DocumentNotFoundException extends RuntimeException {

    public DocumentNotFoundException(String message) {
        super(message);
    }
}
