import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, LayoutTemplate, Sparkles, UserCheck, Focus, Eye } from "lucide-react";

export function FeaturesSection() {
    const features = [
        {
            title: "Smart Resume Extraction",
            description: "Extract relevant information from an existing resume cleanly and securely.",
            icon: Search
        },
        {
            title: "Professional Structure",
            description: "Automatically organize information into a professional structure hiring managers expect.",
            icon: LayoutTemplate
        },
        {
            title: "AI-Assisted Writing",
            description: "Improve summaries and project descriptions while strictly preserving facts.",
            icon: Sparkles
        },
        {
            title: "ATS-Friendly",
            description: "Use clean structures designed to remain entirely readable by ATS parsing systems.",
            icon: UserCheck
        },
        {
            title: "Target Role Optimization",
            description: "Optimize content formatting according to the student's primary target role.",
            icon: Focus
        },
        {
            title: "Live Preview",
            description: "See the final resume rendered exactly as it will look in the PDF while editing.",
            icon: Eye
        }
    ];

    return (
        <section id="features" className="py-24 bg-muted/30 border-t">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Core Features</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Everything you need to bypass applicant tracking systems and stand out in the pile.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <Card key={i} className="border-none shadow-sm shadow-black/5 bg-background">
                            <CardHeader>
                                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                                    <feature.icon className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-xl">{feature.title}</CardTitle>
                                <CardDescription className="text-sm mt-2">{feature.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
