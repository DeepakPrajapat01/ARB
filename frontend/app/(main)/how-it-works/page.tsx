import { PageContainer } from "@/components/common/PageContainer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HowItWorksPage() {
    return (
        <PageContainer className="max-w-4xl py-24">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">How it works</h1>
            <div className="space-y-12">
                <div>
                    <h2 className="text-2xl font-semibold mb-4 text-primary">01. Upload</h2>
                    <p className="text-muted-foreground text-lg">Upload your existing PDF or DOCX resume. The older and messier it is, the better. We don&apos;t care how it looks right now, only the content inside.</p>
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-4 text-primary">02. Understand</h2>
                    <p className="text-muted-foreground text-lg">Our system reads your resume like an HR person would, extracting your education, skills, projects, and work experience objectively without making up facts.</p>
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-4 text-primary">03. Rebuild</h2>
                    <p className="text-muted-foreground text-lg">Your unorganized information is professionally re-written for impact, removing fluff, and cleanly inserted into a chosen ATS-friendly template structure.</p>
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-4 text-primary">04. Download</h2>
                    <p className="text-muted-foreground text-lg">Review your generated professional PDF. If you need adjustments, edit the content dynamically inside our builder. Download when it&apos;s pristine.</p>
                </div>
            </div>
            <div className="mt-16">
                <Button size="lg" asChild>
                    <Link href="/builder">Try It Now</Link>
                </Button>
            </div>
        </PageContainer>
    );
}
