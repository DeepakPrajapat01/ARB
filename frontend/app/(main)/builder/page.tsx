"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CloudUpload, FileText, Pickaxe, X, Loader2 } from "lucide-react";
import { resumeClient } from "@/lib/api/resumeClient";

export default function BuilderPage() {
    const { currentUser, loading } = useAuth();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string>("");
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

    if (loading || !currentUser) {
        return null;
    }

    const validateFile = (selectedFile: File): string | null => {
        const MAX_SIZE = 5 * 1024 * 1024;
        if (selectedFile.size > MAX_SIZE) {
            return "Resume must be smaller than 5 MB.";
        }
        const validTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        if (!validTypes.includes(selectedFile.type)) {
            return "Only PDF and DOCX files are supported.";
        }
        return null;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            const validationError = validateFile(selectedFile);
            if (validationError) {
                setError(validationError);
                setFile(null);
            } else {
                setFile(selectedFile);
            }
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setError("");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            const validationError = validateFile(droppedFile);
            if (validationError) {
                setError(validationError);
                setFile(null);
            } else {
                setFile(droppedFile);
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError("");
        try {
            await resumeClient.uploadResume(file);
            setUploadSuccess(true);
            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        } catch (err: any) {
            setError(err.message || "Upload failed. Please try again.");
            setUploading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 max-w-2xl mt-12 mb-24">
            <h1 className="text-3xl font-bold mb-2">Upload Your Resume</h1>
            <p className="text-muted-foreground mb-8">Start with the resume you already have and we'll help rebuild it professionally.</p>

            <Card>
                <CardContent className="pt-6">
                    {uploadSuccess ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-primary">
                            <Pickaxe className="h-16 w-16 mb-4 animate-bounce" />
                            <h3 className="text-xl font-bold">Resume uploaded successfully!</h3>
                            <p className="text-muted-foreground mt-2">Redirecting to your dashboard...</p>
                        </div>
                    ) : (
                        <>
                            {!file ? (
                                <div
                                    className="border-2 border-dashed border-border py-16 px-6 rounded-lg flex flex-col items-center justify-center text-center hover:bg-accent/50 transition-colors cursor-pointer"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <CloudUpload className="h-16 w-16 text-muted-foreground mb-4" />
                                    <h3 className="font-medium text-lg mb-1">Drag & Drop Resume</h3>
                                    <p className="text-sm text-muted-foreground mb-6">PDF or DOCX (Max 5 MB)</p>
                                    <Button variant="secondary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                                        Choose File
                                    </Button>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />
                                </div>
                            ) : (
                                <div className="border border-border rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-6 bg-accent/50 p-4 rounded-md">
                                        <div className="flex items-center space-x-4 overflow-hidden">
                                            <FileText className="h-10 w-10 text-primary flex-shrink-0" />
                                            <div className="truncate">
                                                <p className="font-medium text-lg truncate">{file.name}</p>
                                                <p className="text-sm text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        {!uploading && (
                                            <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="flex-shrink-0 hover:bg-destructive hover:text-destructive-foreground">
                                                <X className="h-5 w-5" />
                                            </Button>
                                        )}
                                    </div>
                                    <Button
                                        className="w-full h-12 text-md"
                                        onClick={handleUpload}
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <div className="flex items-center">
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Uploading resume...
                                            </div>
                                        ) : "Upload Resume securely"}
                                    </Button>
                                </div>
                            )}
                            {error && (
                                <div className="mt-6 p-4 bg-destructive/10 text-destructive text-sm rounded-md font-medium text-center">
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
