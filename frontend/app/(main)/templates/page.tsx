import { PageContainer } from "@/components/common/PageContainer";

export default function TemplatesPage() {
    return (
        <PageContainer className="py-24">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Professional Templates</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    We strip the visual noise to focus on what hiring managers actually want to read. All of our templates are strictly ATS-compliant.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Placeholder cards */}
                {[
                    { name: "ATS Classic", desc: "Minimal, traditional structure used by top business schools." },
                    { name: "Developer", desc: "Technical layout prioritizing projects, skills, and tooling." },
                    { name: "Fresher", desc: "Student-focused ordering prioritizing education and coursework." }
                ].map((t) => (
                    <div key={t.name} className="flex flex-col border rounded-xl overflow-hidden bg-card transition-all hover:shadow-md">
                        <div className="aspect-[1/1.4] bg-muted/50 p-6 flex items-center justify-center border-b">
                            <span className="text-muted-foreground/50 text-sm font-medium">Template Visual Preview</span>
                        </div>
                        <div className="p-6">
                            <h3 className="font-semibold text-lg mb-2">{t.name}</h3>
                            <p className="text-sm text-muted-foreground">{t.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
}
