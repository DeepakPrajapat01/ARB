import React from 'react';
import { ResumeData } from '@/lib/api/resumeClient';
import { ATSClassic } from './ATSClassic';

interface TemplateFactoryProps {
    templateId: string;
    data: ResumeData;
    scale?: number;
}

export function ResumeTemplateFactory({ templateId, data, scale = 1 }: TemplateFactoryProps) {
    // Determine which template to render based on templateId
    let TemplateComponent;
    switch (templateId) {
        case 'developer':
            // Fallback to ATS Classic until developer template is created
            TemplateComponent = ATSClassic;
            break;
        case 'fresher':
            TemplateComponent = ATSClassic;
            break;
        case 'ats-classic':
        default:
            TemplateComponent = ATSClassic;
    }

    return (
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
            <TemplateComponent data={data} />
        </div>
    );
}
