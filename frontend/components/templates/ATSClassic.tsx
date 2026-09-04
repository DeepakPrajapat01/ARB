import React from 'react';
import { ResumeData } from '@/lib/api/resumeClient';

export function ATSClassic({ data }: { data: ResumeData }) {
    if (!data) return null;
    const { personalInfo, summary, experience, education, skills, projects, certifications } = data;

    return (
        <div className="bg-white text-black w-[210mm] min-h-[297mm] p-[20mm] font-serif shadow-sm print:shadow-none print:w-full print:p-0 mx-auto box-border" style={{ fontFamily: '"Times New Roman", Times, serif' }}>

            {/* Header / Personal Info */}
            <div className="text-center mb-6 border-b border-black pb-4">
                <h1 className="text-3xl font-bold uppercase tracking-wide mb-1">{personalInfo?.name || 'Your Name'}</h1>
                <div className="text-sm space-x-2 flex flex-wrap justify-center items-center">
                    {personalInfo?.email && <span>{personalInfo.email}</span>}
                    {personalInfo?.phone && <><span>|</span><span>{personalInfo.phone}</span></>}
                    {personalInfo?.location && <><span>|</span><span>{personalInfo.location}</span></>}
                </div>
                <div className="text-sm space-x-2 flex flex-wrap justify-center items-center mt-1">
                    {personalInfo?.linkedin && (
                        <a href={personalInfo.linkedin} className="text-blue-800 underline break-all">{personalInfo.linkedin}</a>
                    )}
                    {personalInfo?.linkedin && personalInfo?.github && <span>|</span>}
                    {personalInfo?.github && (
                        <a href={personalInfo.github} className="text-blue-800 underline break-all">{personalInfo.github}</a>
                    )}
                </div>
            </div>

            {/* Summary */}
            {summary && (
                <div className="mb-4 break-inside-avoid">
                    <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">Professional Summary</h2>
                    <p className="text-sm text-justify leading-relaxed">{summary}</p>
                </div>
            )}

            {/* Experience */}
            {experience && experience.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">Experience</h2>
                    {experience.map((exp, idx) => (
                        <div key={idx} className="mb-3 break-inside-avoid">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="text-base font-bold">{exp.company}</h3>
                                <span className="text-sm font-medium">{exp.startDate} - {exp.endDate || 'Present'}</span>
                            </div>
                            <div className="flex justify-between items-baseline mb-1 italic text-sm">
                                <span>{exp.position}{exp.location ? `, ${exp.location}` : ''}</span>
                            </div>
                            <ul className="list-disc pl-5 text-sm space-y-1 mt-1">
                                {exp.responsibilities?.map((item, i) => (
                                    <li key={i} className="leading-relaxed text-justify">{item}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {/* Projects */}
            {projects && projects.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">Projects</h2>
                    {projects.map((proj, idx) => (
                        <div key={idx} className="mb-3 break-inside-avoid">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="text-base font-bold">
                                    {proj.name}
                                    {proj.technologies && proj.technologies.length > 0 && (
                                        <span className="font-normal italic"> | {proj.technologies.join(', ')}</span>
                                    )}
                                </h3>
                            </div>
                            {proj.url && (
                                <a href={proj.url} className="text-sm text-blue-800 underline italic block mb-1">{proj.url}</a>
                            )}
                            <p className="text-sm text-justify leading-relaxed">{proj.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Skills */}
            {skills && Object.keys(skills).length > 0 && (
                <div className="mb-4 break-inside-avoid">
                    <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">Skills</h2>
                    <ul className="text-sm space-y-1">
                        {Object.entries(skills).map(([category, items], idx) => (
                            <li key={idx}>
                                <span className="font-bold capitalize">{category}: </span>
                                {(items as string[]).join(', ')}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Education */}
            {education && education.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">Education</h2>
                    {education.map((edu, idx) => (
                        <div key={idx} className="mb-3 break-inside-avoid">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="text-base font-bold">{edu.institution}</h3>
                                <span className="text-sm font-medium">{(edu.endDate || edu.startDate) ? (edu.endDate ?? edu.startDate) : ''}</span>
                            </div>
                            <div className="flex justify-between items-baseline text-sm">
                                <span className="italic">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</span>
                                {edu.grade && <span>Grade: {edu.grade}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Certifications */}
            {certifications && certifications.length > 0 && (
                <div className="mb-4 break-inside-avoid">
                    <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">Certifications</h2>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                        {certifications.map((cert, idx) => (
                            <li key={idx}>
                                <strong>{cert.name}</strong> — {cert.issuer} ({cert.date})
                                {cert.credentialUrl && <span> <a href={cert.credentialUrl} className="text-blue-800 underline">Link</a></span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
