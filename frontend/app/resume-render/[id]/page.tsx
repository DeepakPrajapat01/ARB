"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { resumeClient, ResumeData } from "@/lib/api/resumeClient";
import { ResumeTemplateFactory } from "@/components/templates/ResumeTemplateFactory";

function RenderPageContent({ resumeId }: { resumeId: string }) {
    const { currentUser, loading } = useAuth();
    const searchParams = useSearchParams();
    const templateId = searchParams.get("templateId") || "ats-classic";

    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [error, setError] = useState("");

    // Use specific loading states to block render-ready signal until fully done
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        if (loading) return; // Wait for Firebase auth state to settle

        if (!currentUser) {
            setError("Unauthorized access to render route.");
            setIsDataLoaded(true);
            return;
        }

        resumeClient.getResumeData(resumeId)
            .then((data) => {
                setResumeData(data);
                setIsDataLoaded(true);
            })
            .catch((err) => {
                console.error("Failed to load resume data for render", err);
                setError(err.message || "Failed to load data.");
                setIsDataLoaded(true);
            });
    }, [resumeId, currentUser, loading]);

    if (loading || !isDataLoaded) {
        return <div style={{ padding: "20px" }}>Loading structured data...</div>;
    }

    if (error) {
        return <div id="render-error" style={{ padding: "20px", color: "red" }}>Error: {error}</div>;
    }

    if (!resumeData) {
        return <div id="render-error" style={{ padding: "20px", color: "red" }}>No data found.</div>;
    }

    return (
        <>
            {/* The actual resume template fills the viewport for printing */}
            <ResumeTemplateFactory templateId={templateId} data={resumeData} />

            {/* INVISIBLE MARKER FOR PLAYWRIGHT: Tells backend the DOM is fully injected and ready to print */}
            <div id="render-ready" style={{ display: 'none' }} data-template={templateId}></div>
        </>
    );
}

export default function ResumeRenderPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);

    // This layout is globally unpadded and stripped of all UI
    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', width: '100%' }}>
            <Suspense fallback={<div>Query Parameters Binding...</div>}>
                <RenderPageContent resumeId={resolvedParams.id} />
            </Suspense>
        </div>
    );
}
