import React from 'react';
import { OptResumeData } from '@/lib/api/resumeClient';

function normalizeUrl(url: string | null | undefined): string | undefined {
    if (!url) return undefined;
    const trimmed = url.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('mailto:')) {
        return trimmed;
    }
    return `https://${trimmed}`;
}

export function DeveloperTemplate({ data }: { data: OptResumeData }) {
    if (!data) return null;
    const { personalInfo, summary, experience, education, skills, projects, certifications } = data;

    const SKILL_LABELS: Record<string, string> = {
        programmingLanguages: 'Languages',
        frameworks: 'Frameworks',
        libraries: 'Libraries',
        databases: 'Databases',
        tools: 'Tools',
        cloudPlatforms: 'Cloud',
        other: 'Other',
    };

    return (
        <div className="resume-page" style={{ fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}>
            {/* ── Header Bar ──────────────────────────────────────────── */}
            <div className="border-b-2 border-black pb-3 mb-4">
                <h1 className="text-[20px] font-bold tracking-tight mb-1 text-black">
                    {personalInfo?.name || 'Your Name'}
                </h1>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-black text-[10px] mt-1">
                    {personalInfo?.email && <span>{personalInfo.email}</span>}
                    {personalInfo?.email && personalInfo?.phone && <span>|</span>}
                    {personalInfo?.phone && <span>{personalInfo.phone}</span>}
                    {(personalInfo?.email || personalInfo?.phone) && personalInfo?.location && <span>|</span>}
                    {personalInfo?.location && <span>{personalInfo.location}</span>}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-black text-[10px] mt-1">
                    {personalInfo?.linkedin && (
                        <a href={normalizeUrl(personalInfo.linkedin)} target="_blank" rel="noopener noreferrer" className="text-black underline break-all">LinkedIn</a>
                    )}
                    {personalInfo?.linkedin && personalInfo?.github && <span>|</span>}
                    {personalInfo?.github && (
                        <a href={normalizeUrl(personalInfo.github)} target="_blank" rel="noopener noreferrer" className="text-black underline break-all">GitHub</a>
                    )}
                    {(personalInfo?.linkedin || personalInfo?.github) && personalInfo?.portfolio && <span>|</span>}
                    {personalInfo?.portfolio && (
                        <a href={normalizeUrl(personalInfo.portfolio)} target="_blank" rel="noopener noreferrer" className="text-black underline break-all">Portfolio</a>
                    )}
                </div>
            </div>

            {/* ── Body: Sidebar + Main ──────────────────────────────────── */}
            <div className="flex gap-4">
                {/* Sidebar */}
                <div className="w-[50mm] border-r border-black pr-4 shrink-0">
                    {/* Skills */}
                    {skills && Object.keys(skills).length > 0 && (
                        <div className="mb-4">
                            <h2 className="text-[12px] font-bold uppercase tracking-widest text-black mb-2 border-b border-black pb-0.5">
                                Skills
                            </h2>
                            <div className="space-y-2">
                                {Object.entries(skills).map(([cat, items]) =>
                                    Array.isArray(items) && items.length > 0 ? (
                                        <div key={cat}>
                                            <p className="text-[10px] font-bold text-black mb-0.5">
                                                {SKILL_LABELS[cat] ?? cat}
                                            </p>
                                            <p className="text-[10px] text-black leading-[1.3]">
                                                {(items as string[]).join(' · ')}
                                            </p>
                                        </div>
                                    ) : null
                                )}
                            </div>
                        </div>
                    )}

                    {/* Certifications */}
                    {certifications && certifications.length > 0 && (
                        <div className="mb-4 text-left">
                            <h2 className="text-[12px] font-bold uppercase tracking-widest text-black mb-2 border-b border-black pb-0.5">
                                Certifications
                            </h2>
                            <ul className="space-y-2 text-left">
                                {certifications.map((cert, i) => (
                                    <li key={i} className="text-[10px] text-black">
                                        <p className="font-bold text-black">{cert.name}</p>
                                        <p className="text-black">{cert.issuer}</p>
                                        {cert.date && <p className="text-black">{cert.date}</p>}
                                        {cert.credentialUrl && (
                                            <a href={normalizeUrl(cert.credentialUrl)} className="text-black underline text-[10px]">Credential</a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 pr-2">
                    {/* Summary */}
                    {summary && (
                        <section className="mb-4 text-left">
                            <h2 className="text-[12px] font-bold uppercase tracking-widest text-black mb-1.5 border-b border-black pb-0.5">
                                Summary
                            </h2>
                            <p className="text-[10px] leading-[1.3] text-black text-left">{summary}</p>
                        </section>
                    )}

                    {/* Experience */}
                    {experience && experience.length > 0 && (
                        <section className="mb-4 text-left">
                            <h2 className="text-[12px] font-bold uppercase tracking-widest text-black mb-1.5 border-b border-black pb-0.5">
                                Experience
                            </h2>
                            {experience.map((exp, i) => (
                                <div key={i} className="mb-3 break-inside-avoid text-left">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-bold text-black text-[11px]">{exp.position}</p>
                                        <p className="text-[10px] font-bold text-black whitespace-nowrap ml-2">
                                            {exp.startDate} – {exp.endDate || 'Present'}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-black italic mb-1">
                                        {exp.company}{exp.location ? ` · ${exp.location}` : ''}
                                    </p>
                                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                                        <ul className="list-disc pl-4 space-y-0.5 mt-1 text-left">
                                            {exp.responsibilities.map((r, ri) => (
                                                <li key={ri} className="text-[10px] text-black leading-[1.3] text-left">{r}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Projects */}
                    {projects && projects.length > 0 && (
                        <section className="mb-4 text-left">
                            <h2 className="text-[12px] font-bold uppercase tracking-widest text-black mb-1.5 border-b border-black pb-0.5">
                                Projects
                            </h2>
                            {projects.map((proj, i) => (
                                <div key={i} className="mb-2 break-inside-avoid text-left">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-bold text-black text-[11px]">{proj.name}</p>
                                        <span className="text-[10px] font-bold text-black whitespace-nowrap ml-2 flex gap-1.5 items-center">
                                            <span>{(proj.startDate && proj.endDate) ? `${proj.startDate} - ${proj.endDate}` : (proj.endDate || proj.startDate || '')}</span>
                                            {proj.githubUrl && (
                                                <>
                                                    {(proj.startDate || proj.endDate) && <span className="font-normal mx-0.5">|</span>}
                                                    <a href={normalizeUrl(proj.githubUrl)} className="text-black underline font-normal">GitHub</a>
                                                </>
                                            )}
                                            {proj.url && (
                                                <>
                                                    {(proj.startDate || proj.endDate || proj.githubUrl) && <span className="font-normal mx-0.5">|</span>}
                                                    <a href={normalizeUrl(proj.url)} className="text-black underline font-normal">Live Demo</a>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    {proj.technologies && proj.technologies.length > 0 && (
                                        <p className="text-[10px] text-black italic mb-0.5">{proj.technologies.join(' · ')}</p>
                                    )}
                                    {proj.description && proj.description.length > 0 && (
                                        <p className="text-[10px] leading-[1.3] text-black mt-1 text-left whitespace-pre-wrap">{proj.description}</p>
                                    )}
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Education */}
                    {education && education.length > 0 && (
                        <section className="mb-4 text-left">
                            <h2 className="text-[12px] font-bold uppercase tracking-widest text-black mb-1.5 border-b border-black pb-0.5">
                                Education
                            </h2>
                            {education.map((edu, i) => (
                                <div key={i} className="mb-2 break-inside-avoid text-left">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-bold text-black text-[11px]">{edu.institution}</p>
                                        <p className="text-[10px] font-bold text-black whitespace-nowrap ml-2">
                                            {edu.startDate && edu.endDate
                                                ? `${edu.startDate} – ${edu.endDate}`
                                                : edu.endDate ?? edu.startDate}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-black italic">
                                        {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                                        {edu.grade ? ` · Grade: ${edu.grade}` : ''}
                                    </p>
                                </div>
                            ))}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
