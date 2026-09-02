package com.resumerebuilder.extraction.model;

/**
 * Carries the raw result from a PDF or DOCX text extractor.
 * Written as a plain POJO for Maven compatibility.
 */
public class ExtractedDocument {

    private String text;
    private int pageCount;
    private int characterCount;

    public ExtractedDocument() {
    }

    public ExtractedDocument(String text, int pageCount) {
        this.text = text;
        this.pageCount = pageCount;
        this.characterCount = text != null ? text.length() : 0;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public int getPageCount() {
        return pageCount;
    }

    public void setPageCount(int pageCount) {
        this.pageCount = pageCount;
    }

    public int getCharacterCount() {
        return characterCount;
    }

    public void setCharacterCount(int characterCount) {
        this.characterCount = characterCount;
    }
}
