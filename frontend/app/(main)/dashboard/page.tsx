"use client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resumeClient, Resume } from "@/lib/api/resumeClient";
import Link from "next/link";
import { FileText, Loader2, ArrowRight } from "lucide-react";

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

    useEffect(() => {
        if (currentUser) {
            const fetchResumes = async () => {
                try {
                    const data = await resumeClient.getUserResumes();
                    setResumes(data || []);
                } catch (error) {
                    console.error("Failed to fetch resumes:", error);
                } finally {
                    setLoadingResumes(false);
                }
            };
            fetchResumes();
        }
    }, [currentUser]);

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
                                    <div key={resume.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-secondary rounded-md">
                                                <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <h3 className="font-semibold text-sm truncate max-w-[200px] md:max-w-[300px]">
                                                    {resume.originalFileName}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-muted-foreground">{new Date(resume.createdAt).toLocaleDateString()}</span>
                                                    <Badge variant={resume.status === "UPLOADED" ? "default" : "secondary"} className="text-[10px] h-4">
                                                        {resume.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <Link href={`/dashboard/resumes/${resume.id}`}>
                                            <Button variant="ghost" size="sm">
                                                View <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
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
