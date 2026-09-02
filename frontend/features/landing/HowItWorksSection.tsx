import { UploadCloud, FileSearch, PenTool, Download } from "lucide-react";

export function HowItWorksSection() {
    const steps = [
        {
            num: "01",
            title: "Upload",
            desc: "Upload your existing PDF/DOCX resume.",
            icon: UploadCloud
        },
        {
            num: "02",
            title: "Understand",
            desc: "The system extracts your education, skills, projects, and work experience.",
            icon: FileSearch
        },
        {
            num: "03",
            title: "Rebuild",
            desc: "Your information is professionally structured and placed into our resume template.",
            icon: PenTool
        },
        {
            num: "04",
            title: "Download",
            desc: "Review and download your final resume as a PDF.",
            icon: Download
        },
    ];

    return (
        <section id="how-it-works" className="py-24 bg-background">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How It Works</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        From your messy draft to a polished, interview-ready format in minutes.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step) => (
                        <div key={step.num} className="relative flex flex-col items-center text-center p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-6 ring-8 ring-background">
                                <step.icon className="h-7 w-7" />
                            </div>
                            <span className="text-sm font-black text-muted-foreground/40 mb-2">{step.num}</span>
                            <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                            <p className="text-sm text-muted-foreground">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
