import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, FileText, CheckCircle2, Sparkles } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40 bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

                {/* Text Content */}
                <div className="flex-1 text-center lg:text-left space-y-8 z-10">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
                        Your Resume. <br className="hidden sm:block" />
                        <span className="text-primary">Rebuilt Professionally.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                        Upload your existing resume and turn it into a clean, professional, ATS-friendly resume without fighting with formatting.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                        <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8" asChild>
                            <Link href="/builder">
                                Upload My Resume
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8" asChild>
                            <Link href="#how-it-works">See How It Works</Link>
                        </Button>
                    </div>
                </div>

                {/* Visual Concept */}
                <div className="flex-1 w-full max-w-lg lg:max-w-none relative z-10">
                    <div className="relative bg-card rounded-2xl border shadow-xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">

                        {/* Original Resume Box */}
                        <div className="flex-1 bg-muted rounded-lg p-4 border border-dashed flex flex-col gap-3 w-full opacity-70">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <FileText className="h-4 w-4" />
                                <span className="text-xs font-medium">Original.pdf</span>
                            </div>
                            <div className="h-2 bg-muted-foreground/20 rounded w-3/4"></div>
                            <div className="h-2 bg-muted-foreground/20 rounded w-full"></div>
                            <div className="h-2 bg-muted-foreground/20 rounded w-5/6"></div>
                            <div className="h-2 bg-muted-foreground/20 rounded w-2/3 mt-2"></div>
                        </div>

                        {/* AI Arrow */}
                        <div className="flex-shrink-0 flex items-center justify-center bg-primary text-primary-foreground h-12 w-12 rounded-full shadow-lg z-20">
                            <Sparkles className="h-6 w-6" />
                        </div>

                        {/* Rebuilt Resume Box */}
                        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-lg p-4 border shadow-sm flex flex-col gap-3 w-full ring-2 ring-primary/20">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-semibold text-foreground">ATS Optimized</span>
                            </div>
                            <div className="h-2.5 bg-primary/20 rounded w-1/2 mb-1"></div>
                            <div className="h-2 bg-foreground/10 rounded w-full"></div>
                            <div className="h-2 bg-foreground/10 rounded w-5/6"></div>
                            <div className="h-2 bg-foreground/10 rounded w-full"></div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}
