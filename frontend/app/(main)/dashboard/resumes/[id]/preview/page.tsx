"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { resumeClient, ResumeData } from "@/lib/api/resumeClient";
import { ResumeTemplateFactory } from "@/components/templates/ResumeTemplateFactory";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function ResumePreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { currentUser, loading } = useAuth();
    const router = useRouter();
    const resolvedParams = use(params);
    const resumeId = resolvedParams.id;

    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [templateId, setTemplateId] = useState("ats-classic");
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        if (loading) return;
        if (!currentUser) {
            router.push("/login");
            return;
        }

        resumeClient.getResumeData(resumeId)
            .then(data => setResumeData(data))
            .catch(err => setError(err.message || "Failed to load structured data"))
            .finally(() => setLoadingData(false));
    }, [resumeId, currentUser, loading, router]);

    // Calculate dynamic scaling for the A4 container so it fits in responsive layouts
    useEffect(() => {
        const calculateScale = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                // A4 physical width at 96 DPI is usually ~794px natively or 210mm. 
                // Using 793.7px as standard A4 width mapping from 210mm
                const A4_PIXELS = 794;
                if (containerWidth < A4_PIXELS) {
                    setScale((containerWidth / A4_PIXELS) * 0.95);
                } else {
                    setScale(1);
                }
            }
        };

        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, [resumeData, templateId]); // Re-calculate when view mounts

    const handleGeneratePdf = async () => {
        setIsGenerating(true);
        setError("");
        try {
            // Using placeholder standard API endpoint call mapping to PdfController
            const res = await resumeClient.generatePdf(resumeId, templateId);

            // Check if stale
            if (res.stale) {
                setError("Your resume has changed since the last PDF. Please regenerate.");
            } else if (res.downloadUrl) {
                window.open(res.downloadUrl, "_blank");
            } else {
                setError("No download URL returned.");
            }
        } catch (err: any) {
            setError(err.message || "We couldn't generate your PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading || loadingData) {
        return (
            <div className="container mx-auto px-4 py-24 flex justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error && !resumeData) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-3xl">
                <Link href={`/dashboard/resumes/${resumeId}`}>
                    <Button variant="ghost" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Resume</Button>
                </Link>
                <Card className="border-destructive/50">
                    <CardContent className="pt-6 text-destructive flex items-center">
                        <AlertCircle className="mr-2 h-5 w-5" /> {error}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl mb-24">
            <div className="flex justify-between items-center mb-6">
                <Link href={`/dashboard/resumes/${resumeId}`}>
                    <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Analysis</Button>
                </Link>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded-md font-medium flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" /> {error}
                </div>
            )}

            <div className="grid lg:grid-cols-4 gap-8">
                {/* Tools & Template Menu */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-bold text-lg mb-4">Templates</h3>
                            <div className="space-y-3">
                                <Button
                                    variant={templateId === 'ats-classic' ? 'default' : 'outline'}
                                    className="w-full justify-start"
                                    onClick={() => setTemplateId('ats-classic')}
                                >
                                    ATS Classic
                                </Button>
                                <Button
                                    variant={templateId === 'developer' ? 'default' : 'outline'}
                                    className="w-full justify-start"
                                    onClick={() => setTemplateId('developer')}
                                >
                                    Developer
                                </Button>
                                <Button
                                    variant={templateId === 'fresher' ? 'default' : 'outline'}
                                    className="w-full justify-start"
                                    onClick={() => setTemplateId('fresher')}
                                >
                                    Fresher
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 text-center">
                            <h3 className="font-bold text-lg mb-2 border-b pb-2">Production Export</h3>
                            <div className="text-sm text-muted-foreground mb-4 pt-2 text-justify">
                                Generating a PDF will freeze this exact visual layout into a printable A4 format secure against applicant tracking systems.
                            </div>
                            <Button
                                className="w-full"
                                onClick={handleGeneratePdf}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating your resume...</>
                                ) : (
                                    <><Download className="mr-2 h-4 w-4" /> Generate PDF</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Live Preview Pane */}
                <div className="lg:col-span-3 bg-secondary/30 rounded-xl border border-secondary p-6 overflow-hidden flex justify-center" ref={containerRef}>
                    <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-transform ease-out duration-200 origin-top overflow-hidden"
                        style={{ width: '210mm', minHeight: '297mm', transform: `scale(${scale})` }}>
                        {resumeData && <ResumeTemplateFactory templateId={templateId} data={resumeData} scale={1} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
