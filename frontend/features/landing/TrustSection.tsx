import { CheckCircle2 } from "lucide-react";

export function TrustSection() {
    const points = [
        "Upload existing resume",
        "AI extracts your information",
        "Professional formatting",
        "ATS-friendly structure",
    ];

    return (
        <section className="py-12 border-y bg-card text-card-foreground">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <ul className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 flex-wrap">
                    {points.map((point) => (
                        <li key={point} className="flex items-center gap-2 text-sm sm:text-base font-medium">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                            <span>{point}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
