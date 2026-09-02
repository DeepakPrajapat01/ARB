package com.resumerebuilder.ai.provider;

import com.resumerebuilder.ai.model.ResumeData;

/**
 * Interface abstracting the AI provider logic to extract structured
 * ResumeData from raw text.
 */
public interface StructuredResumeExtractor {

    /**
     * Extracts structured resume data from raw text.
     *
     * @param rawText normalized raw resume text
     * @return populated ResumeData object
     */
    ResumeData extractStructuredData(String rawText);

}
