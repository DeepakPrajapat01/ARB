"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { resumeClient, Resume, ExtractionResult, ResumeData } from "@/lib/api/resumeClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Trash2, Loader2, AlertCircle, FileText, CheckCircle2, Play } from "lucide-react";
import Link from "next/link";

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
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [aiError, setAiError] = useState<string>("");

    const isStructuring = resume?.status === 'STRUCTURING';
    const isStructured = resume?.status === 'STRUCTURED';
    const isStructuringFailed = resume?.status === 'STRUCTURING_FAILED';

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

    useEffect(() => {
        if (currentUser && resumeId) {
            const fetchResume = async () => {
                try {
                    const data = await resumeClient.getResume(resumeId);
                    setResume(data);

                    if (data.status !== "UPLOADED" && data.status !== "UPLOADING") {
                        try {
                            const extData = await resumeClient.getExtractionResult(resumeId);
                            setExtraction(extData);
                        } catch (extErr) {
                            console.error("Failed to load extraction data", extErr);
                        }
                    }
                    if (data.status === 'STRUCTURED') {
                        try {
                            const structured = await resumeClient.getResumeData(resumeId);
                            setResumeData(structured);
                        } catch (err) {
                            console.error("Failed to load structured data UI", err);
                        }
                    }
                } catch (err: any) {
                    setError(err.message || "Failed to load resume details.");
                } finally {
                    setLoadingResume(false);
                }
            };
            fetchResume();
        }
    }, [currentUser, resumeId]);

    if (loading || !currentUser) return null;

    const handleDownload = async () => {
        if (!resume) return;
        setDownloading(true);
        try {
            const { url } = await resumeClient.getPresignedUrl(resume.id);
            window.open(url, "_blank");
        } catch (err: any) {
            setError(err.message || "Failed to generate secure download link.");
        } finally {
            setDownloading(false);
        }
    };

    const handleExtract = async () => {
        if (!resume) return;
        setIsExtracting(true);
        setExtractError("");
        setResume(prev => prev ? { ...prev, status: "EXTRACTING" as any } : null);

        try {
            const result = await resumeClient.extractResume(resume.id);
            setExtraction(result);
            setResume(prev => prev ? { ...prev, status: result.status as any } : null);
        } catch (err: any) {
            setExtractError(err.message || "Extraction failed.");
            setResume(prev => prev ? { ...prev, status: "EXTRACTION_FAILED" as any } : null);
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
            setResume(prev => prev ? { ...prev, status: "STRUCTURED" as any } : null);
            // Calling API to pull the actual ResumeData payload
            const data = await resumeClient.getResumeData(resume.id);
            setResumeData(data);
        } catch (err: any) {
            setAiError(err.message || "AI analysis failed.");
            setResume(prev => prev ? { ...prev, status: "STRUCTURING_FAILED" as any } : null);
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
        } catch (err: any) {
            setError(err.message || "Failed to delete resume. Error occurred during cleanup.");
            setDeleting(false);
        }
    };

    if (loadingResume) {
        return (
            <div className="container mx-auto px-4 py-24 flex justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
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
                    <CardContent>
                        <p>{error || "Resume not found."}</p>
                    </CardContent>
                </Card>
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
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row flex-wrap justify-between items-start pb-4">
                            <div>
                                <CardTitle className="text-2xl break-all">{resume.originalFileName}</CardTitle>
                                <CardDescription className="mt-1">
                                    Uploaded on {new Date(resume.createdAt).toLocaleDateString()} at {new Date(resume.createdAt).toLocaleTimeString()}
                                </CardDescription>
                            </div>
                            <Badge variant={resume.status === "UPLOADED" ? "default" : "secondary"} className="mt-2 text-xs">
                                {resume.status}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 py-4 border-y">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">File Type</p>
                                    <p className="font-medium">{resume.fileType}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">File Size</p>
                                    <p className="font-medium">{(resume.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Target Role</p>
                                    <p className="font-medium text-muted-foreground">{resume.targetRole || "Not available yet"}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">AI Score</p>
                                    <p className="font-medium text-muted-foreground">{resume.score ? `${resume.score}/100` : "Not available yet"}</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between flex-wrap gap-4 pt-6 bg-accent/30">
                            <Button variant="destructive" disabled={deleting} onClick={() => {
                                if (window.confirm("Delete this resume?\n\nThis will permanently remove the uploaded resume from secure storage. This action cannot be undone.")) {
                                    handleDelete();
                                }
                            }}>
                                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Delete Resume
                            </Button>

                            <Button onClick={handleDownload} disabled={downloading}>
                                {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                View / Download Resume
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">AI Processing</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {resume.status === "UPLOADED" && (
                                <div className="flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-md bg-accent/20">
                                    <FileText className="h-8 w-8 text-muted-foreground mb-3" />
                                    <p className="font-medium mb-1">Resume ready for processing.</p>
                                    <p className="text-sm text-muted-foreground mb-4">Extract the document text to begin analysis.</p>
                                    <Button onClick={handleExtract} disabled={isExtracting} className="w-full">
                                        {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                        Analyze Resume
                                    </Button>
                                </div>
                            )}

                            {(resume.status === "EXTRACTING" || isExtracting) && (
                                <div className="flex flex-col items-center justify-center text-center p-6 border rounded-md bg-accent/10">
                                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                                    <p className="font-medium text-lg">Extracting text...</p>
                                    <p className="text-sm text-muted-foreground mt-2">Reading document contents and formatting data.</p>
                                </div>
                            )}

                            {resume.status === "EXTRACTION_FAILED" && (
                                <div className="flex flex-col items-center justify-center text-center p-4 border border-destructive/20 bg-destructive/5 rounded-md">
                                    <AlertCircle className="h-8 w-8 text-destructive mb-3" />
                                    <p className="font-medium text-destructive mb-1">We couldn't read this resume.</p>
                                    <p className="text-sm text-muted-foreground mb-4">{extractError || extraction?.message || "There was a problem extracting the text."}</p>
                                    <div className="flex flex-col w-full gap-2">
                                        <Button onClick={handleExtract} variant="outline" className="w-full">Try Again</Button>
                                        <Link href="/builder" className="w-full">
                                            <Button variant="secondary" className="w-full">Upload Different Resume</Button>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {(resume.status === "EXTRACTED" || isStructuring || isStructured || isStructuringFailed) && extraction && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md">
                                        <CheckCircle2 className="h-5 w-5 mr-2" />
                                        <span className="font-medium">Resume Text Extracted</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="p-3 border rounded-md text-center">
                                            <p className="text-muted-foreground text-xs mb-1">Pages</p>
                                            <p className="font-semibold text-lg">{extraction.pageCount}</p>
                                        </div>
                                        <div className="p-3 border rounded-md text-center">
                                            <p className="text-muted-foreground text-xs mb-1">Characters</p>
                                            <p className="font-semibold text-lg">{extraction.characterCount.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {(resume.status === 'EXTRACTED' || isStructuringFailed) && (
                                        <div className="mt-8 border-t pt-6">
                                            <div className="bg-accent/30 rounded-xl p-6 border text-center">
                                                <h3 className="text-lg font-medium mb-3">Text Extracted Successfully</h3>
                                                <p className="text-sm text-muted-foreground mb-6">The raw text has been separated. Use AI to categorize and structure this information.</p>

                                                {aiError && (
                                                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
                                                        {aiError}
                                                    </div>
                                                )}

                                                <Button
                                                    onClick={handleStructureResume}
                                                    disabled={isAiProcessing || isStructuring}
                                                    className="w-full"
                                                >
                                                    {(isAiProcessing || isStructuring) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isStructuringFailed ? "Retry AI Analysis" : "Analyze with AI")}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {isStructuring && !resumeData && (
                                        <div className="flex flex-col items-center justify-center p-12 bg-accent/20 rounded-lg border text-center">
                                            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                                            <h3 className="text-lg font-medium mb-2">Analyzing Resume...</h3>
                                            <p className="text-sm text-muted-foreground">Extracting and structuring your information intelligently.</p>
                                        </div>
                                    )}

                                    {isStructured && resumeData && (
                                        <div className="space-y-8 animate-in fade-in duration-500">
                                            <div className="flex justify-between items-center mb-6">
                                                <h2 className="text-lg font-semibold">Extracted Information</h2>
                                                <Badge variant="outline" className="text-green-600 border-green-600">AI Structured</Badge>
                                            </div>

                                            <div className="bg-card border rounded-xl p-6">
                                                <h3 className="text-md font-medium mb-4 border-b pb-2">Personal Info</h3>
                                                <div className="grid grid-cols-1 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground block">Name</span>
                                                        <span className="font-medium">{resumeData.personalInfo?.name || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground block">Email</span>
                                                        <span>{resumeData.personalInfo?.email || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-card border rounded-xl p-6">
                                                <h3 className="text-md font-medium mb-4 border-b pb-2">Skills Found</h3>
                                                <div className="flex flex-wrap gap-2 text-sm">
                                                    {Object.entries(resumeData.skills).map(([cat, list]) =>
                                                        (list as string[]).map((skill: string, i: number) => (
                                                            <Badge key={`${cat}-${i}`} variant="secondary">{skill}</Badge>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Optimize CTA */}
                                            <div className="mt-6 border-t pt-6 grid grid-cols-2 gap-4">
                                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                                                    <h3 className="text-base font-semibold mb-2">Ready to Optimize?</h3>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        Select a target role and let AI improve the presentation.
                                                    </p>
                                                    <Button onClick={() => router.push(`/dashboard/resumes/${resumeId}/optimize`)} className="w-full">
                                                        <Play className="h-4 w-4 mr-2" /> Optimize Resume
                                                    </Button>
                                                </div>
                                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                                                    <h3 className="text-base font-semibold mb-2">Ready to Print?</h3>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        Select templates and generate your production-grade PDF.
                                                    </p>
                                                    <Button onClick={() => router.push(`/dashboard/resumes/${resumeId}/preview`)} variant="secondary" className="w-full bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-200">
                                                        <FileText className="h-4 w-4 mr-2" /> Live A4 Preview
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
