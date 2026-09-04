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

export function ATSClassic({ data }: { data: OptResumeData }) {
    if (!data) return null;
    const { personalInfo, summary, experience, education, skills, projects, certifications } = data;

    return (
        <div className="resume-page font-serif" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            {/* Header / Personal Info */}
            <div className="text-center mb-4">
                <h1 className="text-[20px] font-bold uppercase tracking-wide mb-1 text-black">{personalInfo?.name || 'Your Name'}</h1>
                <div className="text-[10px] space-x-2 flex flex-wrap justify-center items-center text-black">
                    {personalInfo?.email && <span>{personalInfo.email}</span>}
                    {personalInfo?.phone && <><span>|</span><span>{personalInfo.phone}</span></>}
                    {personalInfo?.location && <><span>|</span><span>{personalInfo.location}</span></>}
                </div>
                <div className="text-[10px] space-x-2 flex flex-wrap justify-center items-center mt-1 text-black">
                    {personalInfo?.github && (
                        <a href={normalizeUrl(personalInfo.github)} target="_blank" rel="noopener noreferrer" className="text-black underline break-all">GitHub</a>
                    )}
                    {personalInfo?.linkedin && (
                        <><span className={personalInfo?.github ? "" : "hidden"}>|</span>
                            <a href={normalizeUrl(personalInfo.linkedin)} target="_blank" rel="noopener noreferrer" className="text-black underline break-all">LinkedIn</a></>
                    )}
                    {personalInfo?.portfolio && (
                        <><span className={(personalInfo?.github || personalInfo?.linkedin) ? "" : "hidden"}>|</span>
                            <a href={normalizeUrl(personalInfo.portfolio)} target="_blank" rel="noopener noreferrer" className="text-black underline break-all">Portfolio</a></>
                    )}
                </div>
            </div>

            {/* Summary */}
            {summary && (
                <div className="mb-3 break-inside-avoid text-left">
                    <h2 className="text-[14px] font-bold uppercase border-b border-black mb-1 text-black">Professional Summary</h2>
                    <p className="text-[10px] leading-[1.3] text-black">{summary}</p>
                </div>
            )}

            {/* Skills */}
            {skills && Object.keys(skills).length > 0 && (
                <div className="mb-3 break-inside-avoid text-left">
                    <h2 className="text-[14px] font-bold uppercase border-b border-black mb-1 text-black">Technical Skills</h2>
                    <ul className="text-[10px] leading-[1.3] text-black space-y-0.5">
                        {Object.entries(skills).map(([category, items], idx) => {
                            if (!items || items.length === 0) return null;
                            return (
                                <li key={idx}>
                                    <span className="font-bold capitalize">{category}: </span>
                                    {(items as string[]).join(', ')}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* Experience */}
            {experience && experience.length > 0 && (
                <div className="mb-3 text-left">
                    <h2 className="text-[14px] font-bold uppercase border-b border-black mb-1 text-black">Experience</h2>
                    {experience.map((exp, idx) => (
                        <div key={idx} className="mb-2 break-inside-avoid">
                            <div className="flex justify-between items-baseline">
                                <h3 className="text-[11px] font-bold text-black">{exp.company}</h3>
                                <span className="text-[10px] font-bold text-black whitespace-nowrap ml-2">
                                    {exp.startDate} - {exp.endDate || 'Present'}
                                </span>
                            </div>
                            <div className="flex justify-between items-baseline mb-0.5 italic text-[10px] text-black">
                                <span>{exp.position}{exp.location ? `, ${exp.location}` : ''}</span>
                            </div>
                            {exp.responsibilities && exp.responsibilities.length > 0 && (
                                <ul className="list-disc pl-4 text-[10px] leading-[1.3] text-black space-y-0.5">
                                    {exp.responsibilities.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Projects */}
            {projects && projects.length > 0 && (
                <div className="mb-3 text-left">
                    <h2 className="text-[14px] font-bold uppercase border-b border-black mb-1 text-black">Projects</h2>
                    {projects.map((proj, idx) => (
                        <div key={idx} className="mb-2 break-inside-avoid">
                            <div className="flex justify-between items-baseline">
                                <h3 className="text-[11px] font-bold text-black">
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
                                <div className="text-[10px] italic text-black mb-0.5">
                                    {proj.technologies.join(' | ')}
                                </div>
                            )}
                            {proj.description && proj.description.length > 0 && (
                                <p className="text-[10px] leading-[1.3] text-black mt-0.5 whitespace-pre-wrap">{proj.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Education */}
            {education && education.length > 0 && (
                <div className="mb-3 text-left">
                    <h2 className="text-[14px] font-bold uppercase border-b border-black mb-1 text-black">Education</h2>
                    {education.map((edu, idx) => (
                        <div key={idx} className="mb-2 break-inside-avoid">
                            <div className="flex justify-between items-baseline">
                                <h3 className="text-[11px] font-bold text-black">{edu.institution}</h3>
                                <span className="text-[10px] font-bold text-black whitespace-nowrap ml-2">
                                    {(edu.endDate || edu.startDate) ? (edu.endDate ?? edu.startDate) : ''}
                                </span>
                            </div>
                            <div className="flex justify-between items-baseline text-[10px] text-black">
                                <span className="italic">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</span>
                                {edu.grade && <span>Grade: {edu.grade}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Certifications (if any) */}
            {certifications && certifications.length > 0 && (
                <div className="mb-3 break-inside-avoid text-left">
                    <h2 className="text-[14px] font-bold uppercase border-b border-black mb-1 text-black">Certifications</h2>
                    <ul className="list-disc pl-4 text-[10px] space-y-0.5 text-black">
                        {certifications.map((cert, idx) => (
                            <li key={idx}>
                                <strong>{cert.name}</strong> — {cert.issuer} {cert.date ? `(${cert.date})` : ''}
                                {cert.credentialUrl && <span> <a href={normalizeUrl(cert.credentialUrl)} className="text-black underline ml-1">Credential</a></span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
