import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function TemplatePreviewsSection() {
    const templates = [
        {
            name: "ATS Classic",
            desc: "Minimal, traditional structure.",
            layout: "bg-white border-gray-200"
        },
        {
            name: "Developer",
            desc: "Technical skills and projects focused.",
            layout: "bg-zinc-50 border-zinc-200"
        },
        {
            name: "Fresher",
            desc: "Education and coursework prioritized.",
            layout: "bg-white border-blue-100"
        }
    ];

    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            Stop Fighting With Resume Formatting.
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            You already have the education, skills, projects, and internships. We handle placing them into professional, proven templates so you don&apos;t break the layout every time you add a line.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/templates">
                            View All Templates
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {templates.map((tpl) => (
                        <div key={tpl.name} className="group relative">
                            <div className={`aspect-[1/1.4] rounded-xl border-2 ${tpl.layout} shadow-sm flex items-center justify-center p-8 transition-transform group-hover:-translate-y-2 group-hover:shadow-xl`}>
                                <div className="w-full h-full flex flex-col gap-3 opacity-30">
                                    <div className="h-6 w-1/2 bg-foreground rounded mb-4 mx-auto"></div>
                                    <div className="h-2 w-full bg-foreground rounded"></div>
                                    <div className="h-2 w-full bg-foreground rounded"></div>
                                    <div className="h-2 w-3/4 bg-foreground rounded mb-4"></div>

                                    <div className="h-3 w-1/3 bg-foreground rounded mb-2"></div>
                                    <div className="h-2 w-full bg-foreground rounded"></div>
                                    <div className="h-2 w-full bg-foreground rounded"></div>
                                </div>
                            </div>
                            <div className="mt-6 text-center">
                                <h3 className="font-semibold text-xl mb-2">{tpl.name}</h3>
                                <p className="text-muted-foreground text-sm">{tpl.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
