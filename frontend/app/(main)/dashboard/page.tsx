"use client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resumeClient, Resume } from "@/lib/api/resumeClient";
import Link from "next/link";
import { FileText, Loader2, ArrowRight, Trash2 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
    "PENDING_UPLOAD": "Uploading",
    "UPLOADED": "Uploaded",
    "EXTRACTING": "Reading your resume",
    "EXTRACTED": "Content extracted",
    "STRUCTURING": "Understanding your resume",
    "STRUCTURED": "Information extracted",
    "OPTIMIZING": "Improving your resume",
    "OPTIMIZED": "Optimization ready",
    "GENERATING": "Creating PDF",
    "GENERATED": "Ready to download",
    "GENERATION_FAILED": "PDF generation failed"
};

const getResumeNextRoute = (resume: Resume) => {
    switch (resume.status) {
        case "UPLOADED":
        case "EXTRACTED":
        case "STRUCTURING":
        case "STRUCTURED":
            return `/dashboard/resumes/${resume.id}`;
        case "OPTIMIZING":
        case "OPTIMIZED":
        case "GENERATING":
        case "GENERATED":
        case "GENERATION_FAILED":
            return `/dashboard/resumes/${resume.id}/preview`;
        default:
            return `/dashboard/resumes/${resume.id}`;
    }
};

export default function DashboardPage() {
    const { currentUser, loading, logout } = useAuth();
    const router = useRouter();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loadingResumes, setLoadingResumes] = useState(true);

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

    const fetchResumes = async () => {
        if (!currentUser) return;
        setLoadingResumes(true);
        try {
            const data = await resumeClient.getUserResumes();
            setResumes(data || []);
        } catch (error) {
            console.error("Failed to fetch resumes:", error);
        } finally {
            setLoadingResumes(false);
        }
    };

    useEffect(() => {
        fetchResumes();
    }, [currentUser]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this resume? This will permanently remove the uploaded resume, structured data, optimization data, and generated PDFs.")) {
            return;
        }
        try {
            await resumeClient.deleteResume(id);
            setResumes(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error("Failed to delete resume:", error);
            alert("Failed to delete the resume. Please try again.");
        }
    };

    if (loading || !currentUser) return null;

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome, {currentUser.displayName || currentUser.email?.split("@")[0]}</h1>
                    <p className="text-muted-foreground mt-1">Manage your resumes, templates, and profile settings.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={logout}>Logout</Button>
                    <Link href="/builder">
                        <Button>Upload Resume</Button>
                    </Link>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle>Your Resumes</CardTitle>
                        <CardDescription>
                            {loadingResumes ? "Loading your files..." :
                                resumes.length === 0 ? "You haven't uploaded a resume yet." :
                                    `Showing ${resumes.length} resume(s).`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingResumes ? (
                            <div className="flex h-40 items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : resumes.length === 0 ? (
                            <div className="flex flex-col h-48 items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
                                <p className="mb-4">You haven't uploaded a resume yet.</p>
                                <Link href="/builder">
                                    <Button variant="secondary">Upload Your Resume</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {resumes.map(resume => (
                                    <div key={resume.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors gap-4">
                                        <div className="flex items-start md:items-center gap-4 flex-1">
                                            <div className="p-3 bg-secondary rounded-md hidden md:block">
                                                <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                                            </div>
                                            <div className="overflow-hidden flex-1">
                                                <h3 className="font-semibold text-base truncate">
                                                    {resume.originalFileName}
                                                </h3>
                                                <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                                                    {resume.targetRole && <span title={resume.targetRole}>Target: {resume.targetRole}</span>}
                                                    {resume.targetRole && resume.templateId && <span>•</span>}
                                                    {resume.templateId && <span>Template: {resume.templateId}</span>}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant={resume.status === "GENERATED" ? "default" : "secondary"} className="text-[10px] h-5">
                                                        {STATUS_LABELS[resume.status] || resume.status}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground ml-1">Updated {new Date(resume.updatedAt || resume.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(resume.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Link href={getResumeNextRoute(resume)}>
                                                <Button variant="default" size="sm">
                                                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground block">Email</span>
                            <span className="text-sm break-all">{currentUser.email}</span>
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground block">Plan</span>
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                                Free Tier
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
