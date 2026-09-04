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

export function FresherTemplate({ data }: { data: OptResumeData }) {
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
        <div className="resume-page font-serif" style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}>
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="text-center mb-4 pb-2 border-b border-black">
                <h1 className="text-[20px] font-bold uppercase tracking-wider mb-1 text-black">
                    {personalInfo?.name || 'Your Name'}
                </h1>
                <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-[10px] text-black">
                    {personalInfo?.email && <span>{personalInfo.email}</span>}
                    {personalInfo?.email && personalInfo?.phone && <span>|</span>}
                    {personalInfo?.phone && <span>{personalInfo.phone}</span>}
                    {(personalInfo?.email || personalInfo?.phone) && personalInfo?.location && <span>|</span>}
                    {personalInfo?.location && <span>{personalInfo.location}</span>}
                </div>
                <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-[10px] mt-1 text-black">
                    {personalInfo?.github && (
                        <a href={normalizeUrl(personalInfo.github)} target="_blank" rel="noopener noreferrer" className="text-black underline break-all">GitHub</a>
                    )}
                    {personalInfo?.github && personalInfo?.linkedin && <span>|</span>}
                    {personalInfo?.linkedin && (
                        <a href={normalizeUrl(personalInfo.linkedin)} target="_blank" rel="noopener noreferrer" className="text-black underline break-all">LinkedIn</a>
                    )}
                    {(personalInfo?.github || personalInfo?.linkedin) && personalInfo?.portfolio && <span>|</span>}
                    {personalInfo?.portfolio && (
                        <a href={normalizeUrl(personalInfo.portfolio)} target="_blank" rel="noopener noreferrer" className="text-black underline break-all">Portfolio</a>
                    )}
                </div>
            </div>

            {/* ── Objective / Summary ───────────────────────────────────── */}
            {summary && (
                <div className="mb-3 text-left">
                    <h2 className="text-[14px] font-bold uppercase border-b border-black mb-1.5 tracking-wide text-black">Professional Summary</h2>
                    <p className="text-[10px] leading-[1.3] text-left text-black">{summary}</p>
                </div>
            )}

            {/* ── Education ───────────────────────────────────────────── */}
            {education && education.length > 0 && (
                <div className="mb-3 text-left">
                    <h2 className="text-[14px] font-bold uppercase border-b border-black mb-1.5 tracking-wide text-black">Education</h2>
                    {education.map((edu, i) => (
                        <div key={i} className="mb-2 break-inside-avoid text-left">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-bold text-[11px] text-black">{edu.institution}</h3>
                                <span className="text-[10px] font-bold text-black whitespace-nowrap ml-2">
                                    {edu.startDate && edu.endDate
                                        ? `${edu.startDate} – ${edu.endDate}`
                                        : edu.endDate ?? edu.startDate}
                                </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] italic text-black">
                                    {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                                </span>
                                {edu.grade && <span className="text-[10px] text-black font-bold">Grade: {edu.grade}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Skills ─────────────────────────────────────────────── */}
            {skills && Object.keys(skills).length > 0 && (
                <div className="mb-3 text-left">
                    <h2 className="text-[14px] font-bold uppercase border-b border-black mb-1.5 tracking-wide text-black">Technical Skills</h2>
                    <ul className="text-[10px] space-y-0.5 text-left text-black">
                        {Object.entries(skills).map(([cat, items]) =>
                            Array.isArray(items) && items.length > 0 ? (
                                <li key={cat}>
                                    <span className="font-bold">{SKILL_LABELS[cat] ?? cat}: </span>
                                    {(items as string[]).join(', ')}
                                </li>
                            ) : null
                        )}
                    </ul>
                </div>
            )}

            {/* ── Projects ───────────────────────────────────────────── */}
            {projects && projects.length > 0 && (
                <div className="mb-3 text-left">
                    <h2 className="text-[14px] font-bold uppercase border-b border-black mb-1.5 tracking-wide text-black">Projects</h2>
                    {projects.map((proj, i) => (
                        <div key={i} className="mb-2 break-inside-avoid text-left">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-bold text-[11px] text-black">
                                    {proj.name}
                                </h3>
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
                                <div className="text-[10px] text-black italic mb-0.5">
                                    {proj.technologies.join(', ')}
                                </div>
                            )}
                            {proj.description && proj.description.length > 0 && (
                                <p className="text-[10px] leading-[1.3] text-black mt-0.5 text-left whitespace-pre-wrap">{proj.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Experience ─────────────────────────────────────────── */}
            {experience && experience.length > 0 && (
                <div className="mb-3 text-left">
                    <h2 className="text-[14px] font-bold uppercase border-b border-black mb-1.5 tracking-wide text-black">Experience</h2>
                    {experience.map((exp, i) => (
                        <div key={i} className="mb-2 break-inside-avoid text-left">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-bold text-[11px] text-black">{exp.company}</h3>
                                <span className="text-[10px] font-bold text-black whitespace-nowrap ml-2">
                                    {exp.startDate} – {exp.endDate || 'Present'}
                                </span>
                            </div>
                            <div className="text-[10px] italic text-black mb-0.5">
                                {exp.position}{exp.location ? `, ${exp.location}` : ''}
                            </div>
                            {exp.responsibilities && exp.responsibilities.length > 0 && (
                                <ul className="list-disc pl-4 space-y-0.5 text-[10px] leading-[1.3] text-left text-black">
                                    {exp.responsibilities.map((r, ri) => (
                                        <li key={ri}>{r}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Certifications / Achievements ───────────────────────── */}
            {(certifications && certifications.length > 0) || (achievements && achievements.length > 0) ? (
                <div className="flex flex-col gap-3">
                    {certifications && certifications.length > 0 && (
                        <div className="text-left">
                            <h2 className="text-[14px] font-bold uppercase border-b border-black mb-1.5 tracking-wide text-black">Certifications</h2>
                            <ul className="list-disc pl-4 text-[10px] space-y-0.5 text-black">
                                {certifications.map((cert, i) => (
                                    <li key={i}>
                                        <strong>{cert.name}</strong> — {cert.issuer} ({cert.date})
                                        {cert.credentialUrl && (
                                            <> <a href={normalizeUrl(cert.credentialUrl)} className="text-black underline ml-1 font-normal">Credential</a></>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {achievements && achievements.length > 0 && (
                        <div className="text-left">
                            <h2 className="text-[14px] font-bold uppercase border-b border-black mb-1.5 tracking-wide text-black">Achievements</h2>
                            <ul className="list-disc pl-4 text-[10px] space-y-0.5 text-black">
                                {achievements.map((ach, i) => (
                                    <li key={i}>
                                        <strong>{ach.title}</strong>{ach.description ? ` — ${ach.description}` : ''}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : null}

        </div>
    );
}
