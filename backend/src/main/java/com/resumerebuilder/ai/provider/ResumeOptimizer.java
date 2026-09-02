package com.resumerebuilder.ai.provider;

import com.resumerebuilder.ai.model.ResumeData;

public interface ResumeOptimizer {

    /**
     * Executes targeted contextual AI enhancements to raw resume bounds filtering
     * via a specified role.
     * 
     * @param data       Canonical resume shape representing factual experience
     * @param targetRole string describing role being optimized against
     * @return optimized canonical representation
     */
    ResumeData optimizeResumeData(ResumeData data, String targetRole);
}
