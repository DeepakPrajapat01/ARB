package com.resumerebuilder.common;

import com.resumerebuilder.extraction.exception.DocumentExtractionException;
import com.resumerebuilder.extraction.exception.DocumentNotFoundException;
import com.resumerebuilder.extraction.exception.DocumentTooLargeException;
import com.resumerebuilder.extraction.exception.InvalidDocumentException;
import com.resumerebuilder.extraction.exception.UnsupportedDocumentTypeException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", Instant.now().toString());
        errorDetails.put("status", HttpStatus.BAD_REQUEST.value());
        errorDetails.put("error", "VALIDATION_ERROR");

        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        errorDetails.put("message", "Validation failed for one or more fields");
        errorDetails.put("details", fieldErrors);

        return ResponseEntity.badRequest().body(errorDetails);
    }

    @ExceptionHandler(DocumentNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleDocumentNotFound(DocumentNotFoundException ex) {
        return extractionError(HttpStatus.NOT_FOUND, "DOCUMENT_NOT_FOUND",
                "Resume not found or you do not have permission to access it.");
    }

    @ExceptionHandler(UnsupportedDocumentTypeException.class)
    public ResponseEntity<Map<String, Object>> handleUnsupportedType(UnsupportedDocumentTypeException ex) {
        return extractionError(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_DOCUMENT_TYPE",
                "Only PDF and DOCX files are supported. Please upload a valid resume file.");
    }

    @ExceptionHandler(DocumentTooLargeException.class)
    public ResponseEntity<Map<String, Object>> handleTooLarge(DocumentTooLargeException ex) {
        return extractionError(HttpStatus.PAYLOAD_TOO_LARGE, "DOCUMENT_TOO_LARGE",
                "This document is too large to process. Please upload a resume under 5 MB.");
    }

    @ExceptionHandler(InvalidDocumentException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidDocument(InvalidDocumentException ex) {
        String userMessage = ex.getMessage() != null && ex.getMessage().startsWith("NO_TEXT_DETECTED")
                ? "This PDF appears to contain scanned images rather than selectable text. " +
                        "Please upload a PDF with searchable text, or try a DOCX version."
                : "We couldn't read this resume. The file may be corrupt or in an unsupported format.";

        return extractionError(HttpStatus.UNPROCESSABLE_ENTITY, "DOCUMENT_EXTRACTION_FAILED", userMessage);
    }

    @ExceptionHandler(DocumentExtractionException.class)
    public ResponseEntity<Map<String, Object>> handleExtractionFailed(DocumentExtractionException ex) {
        return extractionError(HttpStatus.UNPROCESSABLE_ENTITY, "DOCUMENT_EXTRACTION_FAILED",
                "We couldn't read this resume. Please upload another PDF or DOCX file.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", Instant.now().toString());
        errorDetails.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        errorDetails.put("error", "INTERNAL_SERVER_ERROR");
        errorDetails.put("message", "An unexpected error occurred. Please try again.");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorDetails);
    }

    private ResponseEntity<Map<String, Object>> extractionError(HttpStatus status, String error, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
