"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { resumeClient, ResumeData, OptResumeData } from "@/lib/api/resumeClient";
import { ResumeTemplateFactory } from "@/components/templates/ResumeTemplateFactory";
import { TemplateSelector } from "@/components/common/TemplateSelector";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft, Download, AlertCircle, Loader2, FileCheck, RefreshCw
} from "lucide-react";
import Link from "next/link";

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function buildContentKey(templateId: string, data: OptResumeData | null): string {
    if (!data) return '';
    // Lightweight key: templateId + name + experience count + skills count
    const skillCount = Object.values(data.skills ?? {}).flat().length;
    const expCount = data.experience?.length ?? 0;
    const projCount = data.projects?.length ?? 0;
    return `${templateId}:${data.personalInfo?.name ?? ''}:${skillCount}:${expCount}:${projCount}:${data.summary?.length ?? 0}`;
}

// ──────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────

export default function ResumePreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { currentUser, loading } = useAuth();
    const router = useRouter();
    const resolvedParams = use(params);
    const resumeId = resolvedParams.id;

    const [optResumeData, setOptResumeData] = useState<OptResumeData | null>(null);
    const [templateId, setTemplateId] = useState("ats-classic");
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState("");

    // PDF states
    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
    const [lastGeneratedKey, setLastGeneratedKey] = useState<string | null>(null);
    const [generateError, setGenerateError] = useState("");

    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Auth guard
    useEffect(() => {
        if (loading) return;
        if (!currentUser) {
            router.push("/login");
            return;
        }
        Promise.all([
            resumeClient.getResume(resumeId),
            resumeClient.getResumeData(resumeId)
        ])
            .then(([resume, data]) => {
                if (resume.status !== 'OPTIMIZED') {
                    router.push(`/dashboard/resumes/${resumeId}`);
                    return;
                }
                setOptResumeData(data as OptResumeData);
            })
            .catch(err => setError(err.message || "Failed to load resume data"))
            .finally(() => setLoadingData(false));
    }, [resumeId, currentUser, loading, router]);

    // A4 responsive scaling
    const calculateScale = useCallback(() => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.clientWidth;
            const A4_PIXELS = 794;
            setScale(containerWidth < A4_PIXELS ? (containerWidth / A4_PIXELS) * 0.95 : 1);
        }
    }, []);

    useEffect(() => {
        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, [optResumeData, templateId, calculateScale]);

    // Stale detection: if templateId or data changes after PDF was generated, mark stale
    const currentKey = buildContentKey(templateId, optResumeData);
    const isPdfStale = pdfDownloadUrl !== null && lastGeneratedKey !== null && lastGeneratedKey !== currentKey;
    const hasPdf = pdfDownloadUrl !== null && !isPdfStale;

    const handleTemplateChange = (newId: string) => {
        setTemplateId(newId);
        setGenerateError("");
        // Don't clear pdfDownloadUrl — let stale detection show the warning
    };

    const handleGeneratePdf = async () => {
        setIsGenerating(true);
        setGenerateError("");
        try {
            const res = await resumeClient.generatePdf(resumeId, templateId);
            if (res.downloadUrl) {
                setPdfDownloadUrl(res.downloadUrl);
                setLastGeneratedKey(currentKey);
                // Auto-download right after generating successfully
                window.open(res.downloadUrl, "_blank");
            } else {
                setGenerateError("PDF generation did not return a download link. Please try again.");
            }
        } catch (err: unknown) {
            setGenerateError(err instanceof Error ? err.message : "PDF generation failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (pdfDownloadUrl) {
            window.open(pdfDownloadUrl, "_blank");
        }
    };

    // ── Loading / Error States ──────────────────────────────────────────
    if (loading || loadingData) {
        return (
            <div className="container mx-auto px-4 py-24 flex justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error && !optResumeData) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-3xl">
                <Link href={`/dashboard/resumes/${resumeId}`}>
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Resume
                    </Button>
                </Link>
                <div className="border border-destructive/50 rounded-xl p-8 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
                    <p className="text-destructive font-medium">{error}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Ensure the resume has been analyzed and structured before previewing.
                    </p>
                </div>
            </div>
        );
    }

    // ── Main Layout ─────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background">
            {/* Top Bar */}
            <div className="border-b bg-card sticky top-0 z-10">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={`/dashboard/resumes/${resumeId}`}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-1 h-4 w-4" /> Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="font-semibold text-sm">Resume Preview</h1>
                            <p className="text-xs text-muted-foreground">
                                {templateId === 'ats-classic' ? 'ATS Classic' : templateId === 'developer' ? 'Developer' : 'Fresher'} template
                            </p>
                        </div>
                    </div>

                    {/* PDF Action */}
                    <div className="flex items-center gap-2">
                        {error && (
                            <p className="text-xs text-destructive hidden sm:block">{error}</p>
                        )}
                        {isPdfStale && (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded hidden sm:inline">
                                Resume changed — regenerate PDF
                            </span>
                        )}
                        {hasPdf ? (
                            <>
                                <Button variant="outline" size="sm" onClick={handleGeneratePdf} disabled={isGenerating}>
                                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerate
                                </Button>
                                <Button size="sm" onClick={handleDownload}>
                                    <Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="sm"
                                onClick={handleGeneratePdf}
                                disabled={isGenerating || !optResumeData}
                            >
                                {isGenerating ? (
                                    <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating...</>
                                ) : (
                                    <><FileCheck className="mr-1.5 h-3.5 w-3.5" /> Generate PDF</>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="container mx-auto px-4 py-6 max-w-7xl">

                {/* Stale warning (mobile / prominent) */}
                {isPdfStale && (
                    <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        Your resume has changed since the last PDF was generated.
                        <Button variant="link" size="sm" className="h-auto p-0 text-amber-700 underline ml-1" onClick={handleGeneratePdf} disabled={isGenerating}>
                            Regenerate now
                        </Button>
                    </div>
                )}

                {/* Generate error */}
                {generateError && (
                    <div className="mb-4 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {generateError}
                    </div>
                )}

                {/* PDF Ready banner */}
                {hasPdf && (
                    <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-green-500/5 border border-green-500/30 rounded-xl">
                        <div className="flex items-center gap-2 flex-1">
                            <FileCheck className="h-5 w-5 text-green-600 shrink-0" />
                            <div>
                                <p className="font-semibold text-sm text-green-700">PDF Ready</p>
                                <p className="text-xs text-green-600/80">Your resume has been generated successfully.</p>
                            </div>
                        </div>
                        <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 text-white">
                            <Download className="h-4 w-4 mr-2" /> Download PDF
                        </Button>
                    </div>
                )}

                <div className="grid lg:grid-cols-[280px_1fr] gap-6">
                    {/* Left: Template Selector */}
                    <aside className="space-y-4">
                        <TemplateSelector selectedId={templateId} onSelect={handleTemplateChange} />

                        {/* Export card (mobile) */}
                        <div className="lg:hidden border rounded-xl p-4 space-y-2">
                            <h3 className="font-semibold text-sm">Export</h3>
                            {hasPdf ? (
                                <Button className="w-full" onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" /> Download PDF
                                </Button>
                            ) : (
                                <Button className="w-full" onClick={handleGeneratePdf} disabled={isGenerating}>
                                    {isGenerating
                                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                                        : <><FileCheck className="mr-2 h-4 w-4" /> Generate PDF</>
                                    }
                                </Button>
                            )}
                        </div>
                    </aside>

                    {/* Right: A4 Preview */}
                    <div
                        ref={containerRef}
                        className="bg-gray-100 rounded-xl border p-4 sm:p-6 overflow-hidden flex justify-center items-start min-h-[600px]"
                    >
                        {isGenerating && (
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm font-medium">Generating your resume PDF...</p>
                                <p className="text-xs text-muted-foreground">Please wait while we render your document.</p>
                            </div>
                        )}
                        <div
                            className="bg-white shadow-xl origin-top transition-transform duration-200 overflow-hidden"
                            style={{
                                width: '210mm',
                                minHeight: '297mm',
                                transform: `scale(${scale})`,
                                transformOrigin: 'top center',
                            }}
                        >
                            {optResumeData && (
                                <ResumeTemplateFactory templateId={templateId} data={optResumeData} scale={1} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
