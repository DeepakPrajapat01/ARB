package com.resumerebuilder.extraction.parser;

import com.resumerebuilder.extraction.exception.UnsupportedDocumentTypeException;
import org.springframework.stereotype.Component;

/**
 * Routes incoming documents to the correct {@link DocumentTextExtractor}
 * based on the MIME type detected by Apache Tika (magic-byte detection).
 *
 * Supported types:
 * - application/pdf → PdfTextExtractor
 * - application/vnd.openxmlformats... → DocxTextExtractor
 */
@Component
public class DocumentExtractorFactory {

    private static final String PDF_MIME = "application/pdf";
    private static final String DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    private final PdfTextExtractor pdfExtractor;
    private final DocxTextExtractor docxExtractor;

    public DocumentExtractorFactory(PdfTextExtractor pdfExtractor, DocxTextExtractor docxExtractor) {
        this.pdfExtractor = pdfExtractor;
        this.docxExtractor = docxExtractor;
    }

    /**
     * Returns the appropriate extractor for a given detected MIME type.
     *
     * @param detectedMimeType The MIME type returned by Tika magic-byte detection
     * @return The matching DocumentTextExtractor
     * @throws UnsupportedDocumentTypeException if the type is not PDF or DOCX
     */
    public DocumentTextExtractor getExtractor(String detectedMimeType) {
        if (PDF_MIME.equalsIgnoreCase(detectedMimeType)) {
            return pdfExtractor;
        } else if (DOCX_MIME.equalsIgnoreCase(detectedMimeType)) {
            return docxExtractor;
        } else {
            throw new UnsupportedDocumentTypeException(
                    "Unsupported document type: '" + detectedMimeType +
                            "'. Only PDF and DOCX resumes are supported.");
        }
    }
}
