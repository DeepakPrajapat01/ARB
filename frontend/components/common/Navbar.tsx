"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/button";

export function Navbar() {
    const { currentUser, loading, logout } = useAuth();

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 md:px-8 flex h-16 items-center justify-between max-w-7xl">
                <Link href="/" className="font-bold text-xl tracking-tight text-primary flex items-center gap-2">
                    <span>AI Resume</span>
                </Link>
                <div className="flex items-center gap-4">
                    {!loading ? (
                        currentUser ? (
                            <>
                                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                                    <Link href="/dashboard">Dashboard</Link>
                                </Button>
                                <Button variant="outline" onClick={logout}>Sign Out</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                                    <Link href="/login">Sign In</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/signup">Get Started</Link>
                                </Button>
                            </>
                        )
                    ) : (
                        <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
                    )}
                </div>
            </div>
        </nav>
    );
}
