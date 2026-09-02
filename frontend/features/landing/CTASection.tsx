import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CTASection() {
    return (
        <section className="py-24 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                    Ready to rebuild your resume?
                </h2>
                <p className="text-primary-foreground/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                    Join thousands of students turning their messy drafts into pristine, ATS-friendly PDFs that land interviews.
                </p>
                <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-semibold" asChild>
                    <Link href="/builder">Build My Resume</Link>
                </Button>
            </div>
        </section>
    );
}
