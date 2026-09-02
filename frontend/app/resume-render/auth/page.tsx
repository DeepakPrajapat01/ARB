"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { app } from "@/lib/firebase/config";

function AuthInjector() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState("Initializing headless auth...");

    useEffect(() => {
        const token = searchParams.get("token");
        const redirect = searchParams.get("redirect");

        if (!token || !redirect) {
            setStatus("Missing token or redirect parameter.");
            return;
        }

        const auth = getAuth(app);
        signInWithCustomToken(auth, token)
            .then(() => {
                setStatus("Auth success. Redirecting...");
                router.replace(redirect);
            })
            .catch((err) => {
                console.error("Headless auth failed", err);
                setStatus("Headless auth injection failed: " + err.message);
            });
    }, [searchParams, router]);

    return (
        <div style={{ padding: "50px", fontFamily: "sans-serif" }}>
            <h2>Headless Print Pipeline</h2>
            <p>{status}</p>
        </div>
    );
}

export default function RenderAuthPage() {
    return (
        <Suspense fallback={<div>Loading parameter pipeline...</div>}>
            <AuthInjector />
        </Suspense>
    );
}
