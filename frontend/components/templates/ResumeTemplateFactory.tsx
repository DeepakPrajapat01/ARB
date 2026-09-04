import React from 'react';
import { ResumeData } from '@/lib/api/resumeClient';
import { ATSClassic } from './ATSClassic';
import { DeveloperTemplate } from './DeveloperTemplate';
import { FresherTemplate } from './FresherTemplate';

interface TemplateFactoryProps {
    templateId: string;
    data: ResumeData;
    scale?: number;
}

export function ResumeTemplateFactory({ templateId, data, scale = 1 }: TemplateFactoryProps) {
    let TemplateComponent;
    switch (templateId) {
        case 'developer':
            TemplateComponent = DeveloperTemplate;
            break;
        case 'fresher':
            TemplateComponent = FresherTemplate;
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
