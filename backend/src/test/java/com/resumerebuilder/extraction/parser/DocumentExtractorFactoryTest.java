package com.resumerebuilder.extraction.parser;

import com.resumerebuilder.extraction.exception.UnsupportedDocumentTypeException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class DocumentExtractorFactoryTest {

    private final DocumentExtractorFactory factory = new DocumentExtractorFactory(
            new PdfTextExtractor(),
            new DocxTextExtractor());

    @Test
    void pdfMimeType_returnsPdfExtractor() {
        assertThat(factory.getExtractor("application/pdf"))
                .isInstanceOf(PdfTextExtractor.class);
    }

    @Test
    void docxMimeType_returnsDocxExtractor() {
        assertThat(factory.getExtractor(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .isInstanceOf(DocxTextExtractor.class);
    }

    @Test
    void imageMimeType_throwsUnsupportedDocumentTypeException() {
        assertThatThrownBy(() -> factory.getExtractor("image/jpeg"))
                .isInstanceOf(UnsupportedDocumentTypeException.class);
    }

    @Test
    void unknownMimeType_throwsUnsupportedDocumentTypeException() {
        assertThatThrownBy(() -> factory.getExtractor("application/octet-stream"))
                .isInstanceOf(UnsupportedDocumentTypeException.class);
    }

    @Test
    void nullMimeType_throwsUnsupportedDocumentTypeException() {
        assertThatThrownBy(() -> factory.getExtractor(null))
                .isInstanceOf(UnsupportedDocumentTypeException.class);
    }
}
