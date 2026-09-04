import React from 'react';
import { ResumeData } from '@/lib/api/resumeClient';

/**
 * Fresher Template — Clean, ATS-friendly layout for students and recent graduates.
 * Education is prominent above experience. Simple single-column.
 */
export function FresherTemplate({ data }: { data: ResumeData }) {
    if (!data) return null;
    const { personalInfo, summary, experience, education, skills, projects, certifications, achievements } = data;

    const SKILL_LABELS: Record<string, string> = {
        programmingLanguages: 'Programming Languages',
        frameworks: 'Frameworks',
        libraries: 'Libraries',
        databases: 'Databases',
        tools: 'Tools',
        cloudPlatforms: 'Cloud Platforms',
        other: 'Other',
    };

    return (
        <div
            className="bg-white text-gray-900 w-[210mm] min-h-[297mm] px-[18mm] py-[14mm] mx-auto box-border print:shadow-none"
            style={{ fontFamily: '"Georgia", "Times New Roman", serif', fontSize: '10pt' }}
        >
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="text-center mb-5 pb-4 border-b-2 border-gray-800">
                <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">
                    {personalInfo?.name || 'Your Name'}
                </h1>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-gray-600">
                    {personalInfo?.email && <span>{personalInfo.email}</span>}
                    {personalInfo?.phone && <><span>|</span><span>{personalInfo.phone}</span></>}
                    {personalInfo?.location && <><span>|</span><span>{personalInfo.location}</span></>}
                </div>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm mt-1">
                    {personalInfo?.linkedin && (
                        <a href={personalInfo.linkedin} className="text-blue-700 underline">{personalInfo.linkedin}</a>
                    )}
                    {personalInfo?.github && (
                        <><span className="text-gray-400">|</span>
                            <a href={personalInfo.github} className="text-blue-700 underline">{personalInfo.github}</a></>
                    )}
                    {personalInfo?.portfolio && (
                        <><span className="text-gray-400">|</span>
                            <a href={personalInfo.portfolio} className="text-blue-700 underline">{personalInfo.portfolio}</a></>
                    )}
                </div>
            </div>

            {/* ── Objective / Summary ───────────────────────────────────── */}
            {summary && (
                <Section title="Objective">
                    <p className="text-sm leading-relaxed text-justify">{summary}</p>
                </Section>
            )}

            {/* ── Education ───────────────────────────────────────────── */}
            {education && education.length > 0 && (
                <Section title="Education">
                    {education.map((edu, i) => (
                        <div key={i} className="mb-3 break-inside-avoid">
                            <div className="flex justify-between items-baseline">
                                <p className="font-bold text-sm">{edu.institution}</p>
                                <p className="text-xs text-gray-600 whitespace-nowrap ml-2">
                                    {edu.startDate && edu.endDate
                                        ? `${edu.startDate} – ${edu.endDate}`
                                        : edu.endDate ?? edu.startDate}
                                </p>
                            </div>
                            <p className="text-sm italic text-gray-700">
                                {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                                {edu.grade ? ` | Grade: ${edu.grade}` : ''}
                            </p>
                            {edu.description && <p className="text-sm mt-0.5 text-gray-600">{edu.description}</p>}
                        </div>
                    ))}
                </Section>
            )}

            {/* ── Skills ─────────────────────────────────────────────── */}
            {skills && Object.keys(skills).length > 0 && (
                <Section title="Technical Skills">
                    <ul className="text-sm space-y-0.5">
                        {Object.entries(skills).map(([cat, items]) =>
                            Array.isArray(items) && items.length > 0 ? (
                                <li key={cat}>
                                    <span className="font-semibold">{SKILL_LABELS[cat] ?? cat}: </span>
                                    {(items as string[]).join(', ')}
                                </li>
                            ) : null
                        )}
                    </ul>
                </Section>
            )}

            {/* ── Projects ───────────────────────────────────────────── */}
            {projects && projects.length > 0 && (
                <Section title="Projects">
                    {projects.map((proj, i) => (
                        <div key={i} className="mb-3 break-inside-avoid">
                            <div className="flex justify-between items-baseline">
                                <p className="font-bold text-sm">
                                    {proj.name}
                                    {proj.technologies && proj.technologies.length > 0 && (
                                        <span className="font-normal italic text-gray-600">
                                            {' '}| {proj.technologies.join(', ')}
                                        </span>
                                    )}
                                </p>
                                {proj.url && (
                                    <a href={proj.url} className="text-xs text-blue-700 underline ml-2">{proj.url}</a>
                                )}
                            </div>
                            {proj.description && <p className="text-sm text-justify mt-0.5">{proj.description}</p>}
                        </div>
                    ))}
                </Section>
            )}

            {/* ── Experience ─────────────────────────────────────────── */}
            {experience && experience.length > 0 && (
                <Section title="Experience">
                    {experience.map((exp, i) => (
                        <div key={i} className="mb-3 break-inside-avoid">
                            <div className="flex justify-between items-baseline">
                                <p className="font-bold text-sm">{exp.company}</p>
                                <p className="text-xs text-gray-600 whitespace-nowrap ml-2">
                                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                                </p>
                            </div>
                            <p className="text-sm italic text-gray-700 mb-1">
                                {exp.position}{exp.location ? `, ${exp.location}` : ''}
                            </p>
                            {exp.responsibilities && exp.responsibilities.length > 0 && (
                                <ul className="list-disc pl-5 space-y-0.5">
                                    {exp.responsibilities.map((r, ri) => (
                                        <li key={ri} className="text-sm text-justify leading-relaxed">{r}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </Section>
            )}

            {/* ── Certifications ─────────────────────────────────────── */}
            {certifications && certifications.length > 0 && (
                <Section title="Certifications">
                    <ul className="list-disc pl-5 text-sm space-y-1">
                        {certifications.map((cert, i) => (
                            <li key={i}>
                                <strong>{cert.name}</strong> — {cert.issuer} ({cert.date})
                                {cert.credentialUrl && (
                                    <> <a href={cert.credentialUrl} className="text-blue-700 underline">Link</a></>
                                )}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {/* ── Achievements ───────────────────────────────────────── */}
            {achievements && achievements.length > 0 && (
                <Section title="Achievements">
                    <ul className="list-disc pl-5 text-sm space-y-1">
                        {achievements.map((ach, i) => (
                            <li key={i}>
                                <strong>{ach.title}</strong>{ach.description ? ` — ${ach.description}` : ''}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-4">
            <h2 className="text-sm font-bold uppercase border-b border-gray-800 mb-2 tracking-wide">{title}</h2>
            {children}
        </div>
    );
}
