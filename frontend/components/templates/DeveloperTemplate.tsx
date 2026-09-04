import React from 'react';
import { ResumeData } from '@/lib/api/resumeClient';

/**
 * Developer Template — Technical two-column layout.
 * Left sidebar: contact, skills, certifications.
 * Right main: summary, experience, projects, education.
 */
export function DeveloperTemplate({ data }: { data: ResumeData }) {
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
        <div
            className="bg-white text-gray-900 w-[210mm] min-h-[297mm] mx-auto box-border print:shadow-none"
            style={{ fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', fontSize: '10.5pt' }}
        >
            {/* ── Header Bar ──────────────────────────────────────────── */}
            <div className="bg-slate-800 text-white px-8 py-6">
                <h1 className="text-2xl font-bold tracking-tight mb-1">
                    {personalInfo?.name || 'Your Name'}
                </h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-300 text-xs mt-2">
                    {personalInfo?.email && <span>{personalInfo.email}</span>}
                    {personalInfo?.phone && <span>{personalInfo.phone}</span>}
                    {personalInfo?.location && <span>{personalInfo.location}</span>}
                    {personalInfo?.linkedin && (
                        <a href={personalInfo.linkedin} className="text-blue-300 underline">{personalInfo.linkedin}</a>
                    )}
                    {personalInfo?.github && (
                        <a href={personalInfo.github} className="text-blue-300 underline">{personalInfo.github}</a>
                    )}
                    {personalInfo?.portfolio && (
                        <a href={personalInfo.portfolio} className="text-blue-300 underline">{personalInfo.portfolio}</a>
                    )}
                </div>
            </div>

            {/* ── Body: Sidebar + Main ──────────────────────────────────── */}
            <div className="flex">
                {/* Sidebar */}
                <div className="w-[62mm] bg-slate-50 border-r border-slate-200 px-5 py-6 shrink-0">
                    {/* Skills */}
                    {skills && Object.keys(skills).length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-300 pb-1">
                                Skills
                            </h2>
                            <div className="space-y-2">
                                {Object.entries(skills).map(([cat, items]) =>
                                    Array.isArray(items) && items.length > 0 ? (
                                        <div key={cat}>
                                            <p className="text-xs font-semibold text-slate-600 mb-0.5">
                                                {SKILL_LABELS[cat] ?? cat}
                                            </p>
                                            <p className="text-xs text-slate-700 leading-relaxed">
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
                        <div className="mb-6">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-300 pb-1">
                                Certifications
                            </h2>
                            <ul className="space-y-2">
                                {certifications.map((cert, i) => (
                                    <li key={i} className="text-xs">
                                        <p className="font-semibold text-slate-800">{cert.name}</p>
                                        <p className="text-slate-500">{cert.issuer}</p>
                                        {cert.date && <p className="text-slate-400">{cert.date}</p>}
                                        {cert.credentialUrl && (
                                            <a href={cert.credentialUrl} className="text-blue-600 underline text-xs">Credential</a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 px-7 py-6 min-w-0">
                    {/* Summary */}
                    {summary && (
                        <section className="mb-5">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-200 pb-1">
                                Summary
                            </h2>
                            <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
                        </section>
                    )}

                    {/* Experience */}
                    {experience && experience.length > 0 && (
                        <section className="mb-5">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-200 pb-1">
                                Experience
                            </h2>
                            {experience.map((exp, i) => (
                                <div key={i} className="mb-4 break-inside-avoid">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-bold text-slate-900 text-sm">{exp.position}</p>
                                        <p className="text-xs text-slate-500 whitespace-nowrap ml-2">
                                            {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-600 italic mb-1">
                                        {exp.company}{exp.location ? ` · ${exp.location}` : ''}
                                    </p>
                                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                                        <ul className="list-disc pl-4 space-y-0.5">
                                            {exp.responsibilities.map((r, ri) => (
                                                <li key={ri} className="text-sm text-slate-700 leading-snug">{r}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Projects */}
                    {projects && projects.length > 0 && (
                        <section className="mb-5">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-200 pb-1">
                                Projects
                            </h2>
                            {projects.map((proj, i) => (
                                <div key={i} className="mb-3 break-inside-avoid">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-bold text-slate-900 text-sm">{proj.name}</p>
                                        {proj.url && (
                                            <a href={proj.url} className="text-xs text-blue-600 underline ml-2">{proj.url}</a>
                                        )}
                                    </div>
                                    {proj.technologies && proj.technologies.length > 0 && (
                                        <p className="text-xs text-slate-500 italic mb-1">{proj.technologies.join(' · ')}</p>
                                    )}
                                    {proj.description && (
                                        <p className="text-sm text-slate-700 leading-snug">{proj.description}</p>
                                    )}
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Education */}
                    {education && education.length > 0 && (
                        <section className="mb-5">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-200 pb-1">
                                Education
                            </h2>
                            {education.map((edu, i) => (
                                <div key={i} className="mb-2 break-inside-avoid">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-bold text-slate-900 text-sm">{edu.institution}</p>
                                        <p className="text-xs text-slate-500 whitespace-nowrap ml-2">
                                            {edu.startDate && edu.endDate
                                                ? `${edu.startDate} – ${edu.endDate}`
                                                : edu.endDate ?? edu.startDate}
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-600 italic">
                                        {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                                        {edu.grade ? ` · ${edu.grade}` : ''}
                                    </p>
                                    {edu.description && <p className="text-xs mt-0.5 text-slate-500">{edu.description}</p>}
                                </div>
                            ))}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
