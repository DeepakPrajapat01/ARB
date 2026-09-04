"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { resumeClient, Resume, ExtractionResult, ResumeData } from "@/lib/api/resumeClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Download, Trash2, Loader2, AlertCircle, FileText,
    CheckCircle2, Play, Edit, Sparkles, ChevronRight, Circle, FileCheck
} from "lucide-react";
import Link from "next/link";
import { ResumeEditor } from "@/components/common/ResumeEditor";

// ── Status helpers ──────────────────────────────────────────────────────────

const DONE_STATUSES = ['EXTRACTED', 'STRUCTURED', 'EXTRACTING', 'STRUCTURING', 'STRUCTURING_FAILED', 'EXTRACTION_FAILED'];

type WorkflowStep = {
    id: string;
    label: string;
    done: (r: Resume, rd: ResumeData | null) => boolean;
    active: (r: Resume, rd: ResumeData | null) => boolean;
};

const WORKFLOW_STEPS: WorkflowStep[] = [
    {
        id: 'upload',
        label: 'Resume Uploaded',
        done: () => true,
        active: () => false,
    },
    {
        id: 'analyze',
        label: 'Resume Analyzed',
        done: r => DONE_STATUSES.includes(r.status),
        active: r => r.status === 'UPLOADED',
    },
    {
        id: 'structure',
        label: 'AI Structure Complete',
        done: r => ['STRUCTURED'].includes(r.status),
        active: r => r.status === 'EXTRACTED',
    },
    {
        id: 'optimize',
        label: 'AI Optimization',
        done: r => r.status === 'OPTIMIZED',
        active: r => r.status === 'STRUCTURED',
    },
    {
        id: 'template',
        label: 'Choose Template & Preview',
        done: () => false,
        active: r => r.status === 'OPTIMIZED',
    },
];

// ──────────────────────────────────────────────────────────────────────────

export default function ResumeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { currentUser, loading } = useAuth();
    const router = useRouter();
    const resolvedParams = use(params);
    const resumeId = resolvedParams.id;

    const [resume, setResume] = useState<Resume | null>(null);
    const [loadingResume, setLoadingResume] = useState(true);
    const [error, setError] = useState<string>("");
    const [deleting, setDeleting] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractError, setExtractError] = useState<string>("");
    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [generatedPdfInfo, setGeneratedPdfInfo] = useState<any>(null);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [aiError, setAiError] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);

    const isStructuring = resume?.status === 'STRUCTURING';
    const isStructured = resume && ['STRUCTURED', 'OPTIMIZING', 'OPTIMIZED', 'OPTIMIZATION_FAILED'].includes(resume.status);
    const isStructuringFailed = resume?.status === 'STRUCTURING_FAILED';

    useEffect(() => {
        if (!loading && !currentUser) router.push("/login");
    }, [currentUser, loading, router]);

    useEffect(() => {
        if (!currentUser || !resumeId) return;
        const fetchResume = async () => {
            try {
                const data = await resumeClient.getResume(resumeId);
                setResume(data);
                if (data.status !== "UPLOADED" && data.status !== "UPLOADING") {
                    try {
                        const extData = await resumeClient.getExtractionResult(resumeId);
                        setExtraction(extData);
                    } catch { /* no extraction yet */ }
                }
                if (data.status === 'STRUCTURED') {
                    try {
                        const structured = await resumeClient.getResumeData(resumeId);
                        setResumeData(structured);
                    } catch { /* no structured data yet */ }
                    try {
                        const pdfInfo = await resumeClient.getGeneratedPdfInfo(resumeId);
                        if (pdfInfo && pdfInfo.status !== 'NOT_GENERATED') {
                            setGeneratedPdfInfo(pdfInfo);
                        }
                    } catch { /* no pdf generated yet */ }
                }
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load resume.");
            } finally {
                setLoadingResume(false);
            }
        };
        fetchResume();
    }, [currentUser, resumeId]);

    if (loading || !currentUser) return null;

    const handleDownload = async () => {
        if (!resume) return;
        setDownloading(true);
        try {
            const { url } = await resumeClient.getPresignedUrl(resume.id);
            window.open(url, "_blank");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to generate secure download link.");
        } finally {
            setDownloading(false);
        }
    };

    const handleExtract = async () => {
        if (!resume) return;
        setIsExtracting(true);
        setExtractError("");
        setResume(prev => prev ? { ...prev, status: "EXTRACTING" } : null);
        try {
            const result = await resumeClient.extractResume(resume.id);
            setExtraction(result);
            setResume(prev => prev ? { ...prev, status: result.status } : null);
        } catch (err: unknown) {
            setExtractError(err instanceof Error ? err.message : "Extraction failed.");
            setResume(prev => prev ? { ...prev, status: "EXTRACTION_FAILED" } : null);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleStructureResume = async () => {
        if (!resume) return;
        setIsAiProcessing(true);
        setAiError("");
        try {
            await resumeClient.structureResume(resume.id);
            setResume(prev => prev ? { ...prev, status: "STRUCTURED" } : null);
            const data = await resumeClient.getResumeData(resume.id);
            setResumeData(data);
        } catch (err: unknown) {
            setAiError(err instanceof Error ? err.message : "AI analysis failed.");
            setResume(prev => prev ? { ...prev, status: "STRUCTURING_FAILED" } : null);
        } finally {
            setIsAiProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!resume) return;
        setDeleting(true);
        try {
            await resumeClient.deleteResume(resume.id);
            router.push("/dashboard");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to delete resume.");
            setDeleting(false);
        }
    };

    if (loadingResume) {
        return (
            <div className="container mx-auto px-4 py-24 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !resume) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-3xl">
                <Link href="/dashboard">
                    <Button variant="ghost" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
                </Link>
                <Card className="border-destructive/50">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center">
                            <AlertCircle className="mr-2 h-5 w-5" /> Error Loading Resume
                        </CardTitle>
                    </CardHeader>
                    <CardContent><p>{error || "Resume not found."}</p></CardContent>
                </Card>
            </div>
        );
    }

    // ── Workflow Progress ────────────────────────────────────────────────
    function WorkflowProgress() {
        return (
            <div className="border rounded-xl p-5 bg-card">
                <h3 className="font-semibold mb-4 text-base">Resume Progress</h3>
                <ol className="space-y-3">
                    {WORKFLOW_STEPS.map((step, idx) => {
                        const done = step.done(resume!, resumeData);
                        const active = step.active(resume!, resumeData);
                        return (
                            <li key={step.id} className="flex items-start gap-3">
                                <div className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${done ? 'bg-green-500 border-green-500 text-white' : active ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 bg-transparent'}`}>
                                    {done
                                        ? <CheckCircle2 className="h-3.5 w-3.5" />
                                        : active
                                            ? <ChevronRight className="h-3.5 w-3.5 text-primary" />
                                            : <Circle className="h-2.5 w-2.5 text-muted-foreground/40" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium leading-tight ${done ? 'text-foreground' : active ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {step.label}
                                    </p>
                                    {/* CTAs for active steps */}
                                    {active && step.id === 'analyze' && (
                                        <Button size="sm" className="mt-2 h-7 text-xs" onClick={handleExtract} disabled={isExtracting}>
                                            {isExtracting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                                            Analyze Resume
                                        </Button>
                                    )}
                                    {active && step.id === 'structure' && (
                                        <Button size="sm" className="mt-2 h-7 text-xs" onClick={handleStructureResume} disabled={isAiProcessing}>
                                            {isAiProcessing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                                            Run AI Analysis
                                        </Button>
                                    )}
                                    {active && (step.id === 'optimize' || step.id === 'template') && idx === WORKFLOW_STEPS.findIndex(s => s.active(resume!, resumeData)) && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <Button size="sm" className="h-7 text-xs" onClick={() => router.push(`/dashboard/resumes/${resumeId}/optimize`)}>
                                                <Sparkles className="h-3 w-3 mr-1" /> Optimize with AI
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => router.push(`/dashboard/resumes/${resumeId}/preview`)}>
                                                <FileText className="h-3 w-3 mr-1" /> Choose Template
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl mb-24">
            <Link href="/dashboard">
                <Button variant="ghost" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
            </Link>

            {error && (
                <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded-md font-medium flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" /> {error}
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
                {/* Left: Resume Card */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row flex-wrap justify-between items-start pb-4">
                            <div>
                                <CardTitle className="text-xl break-all">{resume.originalFileName}</CardTitle>
                                <CardDescription className="mt-1">
                                    Uploaded {new Date(resume.createdAt).toLocaleDateString()} at {new Date(resume.createdAt).toLocaleTimeString()}
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="mt-2 text-xs">
                                {resume.status.replace(/_/g, ' ')}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 py-4 border-y text-sm">
                                <div>
                                    <p className="text-muted-foreground mb-1">File Type</p>
                                    <p className="font-medium">{resume.fileType}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">File Size</p>
                                    <p className="font-medium">{(resume.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                                {resume.targetRole && (
                                    <div>
                                        <p className="text-muted-foreground mb-1">Target Role</p>
                                        <p className="font-medium">{resume.targetRole}</p>
                                    </div>
                                )}
                                {resume.score && (
                                    <div>
                                        <p className="text-muted-foreground mb-1">AI Score</p>
                                        <p className="font-medium">{resume.score}/100</p>
                                    </div>
                                )}
                            </div>

                            {/* Extraction inline feedback */}
                            {resume.status === 'EXTRACTION_FAILED' && (
                                <div className="mt-4 p-4 border border-destructive/20 bg-destructive/5 rounded-md">
                                    <p className="font-medium text-destructive text-sm mb-1">Extraction failed</p>
                                    <p className="text-xs text-muted-foreground mb-3">{extractError || extraction?.message || "Could not read document text."}</p>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={handleExtract}>Try Again</Button>
                                        <Link href="/builder"><Button size="sm" variant="secondary">Upload Different File</Button></Link>
                                    </div>
                                </div>
                            )}
                            {isStructuringFailed && (
                                <div className="mt-4 p-4 border border-destructive/20 bg-destructive/5 rounded-md">
                                    <p className="font-medium text-destructive text-sm mb-1">AI analysis failed</p>
                                    <p className="text-xs text-muted-foreground mb-3">{aiError || "Could not structure the resume data."}</p>
                                    <Button size="sm" variant="outline" onClick={handleStructureResume} disabled={isAiProcessing}>Retry</Button>
                                </div>
                            )}

                            {/* Spinner overlays */}
                            {(resume.status === 'EXTRACTING' || isExtracting) && (
                                <div className="mt-4 flex items-center gap-3 p-4 bg-muted/30 rounded-md">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">Extracting text…</p>
                                        <p className="text-xs text-muted-foreground">Reading document contents.</p>
                                    </div>
                                </div>
                            )}
                            {(isStructuring && !resumeData) && (
                                <div className="mt-4 flex items-center gap-3 p-4 bg-muted/30 rounded-md">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">Running AI analysis…</p>
                                        <p className="text-xs text-muted-foreground">Structuring your resume data.</p>
                                    </div>
                                </div>
                            )}

                            {/* Structured data quick view */}
                            {isStructured && resumeData && !isEditing && (
                                <div className="mt-4 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span className="text-sm font-semibold text-green-700">Data Structured</span>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                            <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <div className="bg-muted/30 rounded-md p-3">
                                            <p className="text-muted-foreground text-xs mb-0.5">Name</p>
                                            <p className="font-medium truncate">{resumeData.personalInfo?.name || '—'}</p>
                                        </div>
                                        <div className="bg-muted/30 rounded-md p-3">
                                            <p className="text-muted-foreground text-xs mb-0.5">Email</p>
                                            <p className="truncate">{resumeData.personalInfo?.email || '—'}</p>
                                        </div>
                                    </div>
                                    {/* Skills pill preview */}
                                    {resumeData.skills && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.entries(resumeData.skills)
                                                .flatMap(([, items]) => items as string[])
                                                .slice(0, 12)
                                                .map((s, i) => (
                                                    <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{s}</span>
                                                ))
                                            }
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Inline editor */}
                            {isStructured && resumeData && isEditing && (
                                <div className="mt-4">
                                    <ResumeEditor
                                        initialData={resumeData}
                                        onCancel={() => setIsEditing(false)}
                                        onSave={async (updatedData) => {
                                            try {
                                                await resumeClient.updateResumeData(resume.id, updatedData);
                                                setResumeData(updatedData);
                                                setIsEditing(false);
                                            } catch (err: unknown) {
                                                alert(err instanceof Error ? err.message : "Failed to save data.");
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between flex-wrap gap-3 pt-5 bg-accent/20 border-t">
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={deleting}
                                onClick={() => {
                                    if (window.confirm("Delete this resume?\n\nThis will permanently remove all files and data. This action cannot be undone.")) {
                                        handleDelete();
                                    }
                                }}
                            >
                                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Delete
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
                                {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Original File
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Right: Workflow Progress */}
                <div className="md:col-span-1 space-y-4">
                    <WorkflowProgress />

                    {/* Generated Resume Card */}
                    {isStructured && (
                        <Card className="border-green-500/30 overflow-hidden">
                            <CardHeader className="bg-green-500/5 pb-4">
                                <CardTitle className="text-sm flex items-center">
                                    <FileCheck className="mr-2 h-4 w-4 text-green-600" />
                                    Generated Resume
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 text-sm">
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-0.5">Status</p>
                                        <p className="font-medium">{generatedPdfInfo ? 'Ready' : 'Not Generated'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-0.5">Template</p>
                                        <p className="font-medium capitalize">{generatedPdfInfo?.templateId?.replace('-', ' ') || '—'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground text-xs mb-0.5">Generated</p>
                                        <p className="font-medium">
                                            {generatedPdfInfo?.generatedAt ? new Date(generatedPdfInfo.generatedAt).toLocaleString() : '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button size="sm" variant="outline" className="w-full" disabled={!generatedPdfInfo} onClick={() => window.open(generatedPdfInfo?.downloadUrl, "_blank")}>
                                        <FileText className="mr-2 h-4 w-4" /> View Updated Resume
                                    </Button>
                                    <Button size="sm" className="w-full" disabled={!generatedPdfInfo} onClick={() => window.open(generatedPdfInfo?.downloadUrl, "_blank")}>
                                        <Download className="mr-2 h-4 w-4" /> Download Updated Resume
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick-access cards for structured resumes */}
                    {isStructured && (
                        <div className="space-y-3">
                            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm">Optimize with AI</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Target a specific role and let AI improve your presentation.</p>
                                            <Button
                                                size="sm"
                                                className="mt-3 h-7 text-xs w-full"
                                                onClick={() => router.push(`/dashboard/resumes/${resumeId}/optimize`)}
                                            >
                                                Optimize Resume
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {resume?.status === 'OPTIMIZED' && (
                                <Card className="hover:border-muted-foreground/30 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm">Choose Template</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Select a layout, preview your resume, and generate a PDF.</p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="mt-3 h-7 text-xs w-full"
                                                    onClick={() => router.push(`/dashboard/resumes/${resumeId}/preview`)}
                                                >
                                                    Go to Preview
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Extraction stats card */}
                    {extraction && (
                        <Card>
                            <CardContent className="p-4 grid grid-cols-2 gap-3 text-center">
                                <div>
                                    <p className="text-xl font-bold">{extraction.pageCount}</p>
                                    <p className="text-xs text-muted-foreground">Pages</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{extraction.characterCount.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Characters</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
