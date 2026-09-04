'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TemplateInfo {
    id: string;
    name: string;
    description: string;
    bestFor: string;
    previewColor: string; // Tailwind bg class for the thumbnail accent
}

const TEMPLATES: TemplateInfo[] = [
    {
        id: 'ats-classic',
        name: 'ATS Classic',
        description: 'Traditional serif layout optimized for Applicant Tracking Systems.',
        bestFor: 'Corporate roles, large companies, any industry',
        previewColor: 'bg-gray-800',
    },
    {
        id: 'developer',
        name: 'Developer',
        description: 'Technical two-column layout with sidebar highlighting your skills stack.',
        bestFor: 'Software engineers, backend/frontend/full-stack roles',
        previewColor: 'bg-slate-700',
    },
    {
        id: 'fresher',
        name: 'Fresher',
        description: 'Clean single-column layout that puts education first — ideal for new graduates.',
        bestFor: 'Students, recent graduates, first jobs',
        previewColor: 'bg-indigo-700',
    },
];

// Simple visual thumbnail for the card
function TemplateThumbnail({ color, isSelected }: { color: string; isSelected: boolean }) {
    return (
        <div className={`relative w-full aspect-[210/297] rounded-md overflow-hidden border-2 transition-colors ${isSelected ? 'border-primary' : 'border-muted'}`}>
            {/* Simulated header */}
            <div className={`${color} h-[14%] w-full`} />
            {/* Simulated content lines */}
            <div className="p-2 space-y-1.5 bg-white h-full">
                {[80, 60, 70, 55, 65, 50, 60].map((w, i) => (
                    <div key={i} className="bg-gray-200 rounded-sm h-1.5" style={{ width: `${w}%` }} />
                ))}
                <div className="pt-1 space-y-1">
                    {[90, 75, 55].map((w, i) => (
                        <div key={i} className="bg-gray-100 rounded-sm h-1" style={{ width: `${w}%` }} />
                    ))}
                </div>
            </div>
            {isSelected && (
                <div className="absolute top-1.5 right-1.5 bg-primary rounded-full p-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </div>
            )}
        </div>
    );
}

interface TemplateSelectorProps {
    selectedId: string;
    onSelect: (id: string) => void;
}

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
    return (
        <div className="space-y-3">
            <div>
                <h3 className="font-semibold text-sm">Choose Template</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Only affects presentation — your resume content stays the same.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {TEMPLATES.map(tmpl => (
                    <button
                        key={tmpl.id}
                        onClick={() => onSelect(tmpl.id)}
                        className={`group w-full text-left p-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${selectedId === tmpl.id
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-muted hover:border-primary/40 hover:bg-muted/40'
                            }`}
                    >
                        <div className="flex gap-3">
                            {/* Thumbnail */}
                            <div className="w-[72px] shrink-0">
                                <TemplateThumbnail color={tmpl.previewColor} isSelected={selectedId === tmpl.id} />
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm">{tmpl.name}</span>
                                    {selectedId === tmpl.id && (
                                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Selected</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed mb-1">{tmpl.description}</p>
                                <p className="text-xs text-muted-foreground/70">
                                    <span className="font-medium text-muted-foreground">Best for:</span> {tmpl.bestFor}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
