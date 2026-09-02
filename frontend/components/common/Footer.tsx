import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t bg-muted/20 py-12">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="col-span-2 md:col-span-1">
                        <h3 className="font-bold text-lg tracking-tight mb-4 text-primary">Resume Rebuilder</h3>
                        <p className="text-sm text-muted-foreground">
                            Turn your existing information into a professional resume tailored for your targets.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium text-sm mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/builder" className="hover:text-foreground">Builder</Link></li>
                            <li><Link href="/templates" className="hover:text-foreground">Templates</Link></li>
                            <li><Link href="/#features" className="hover:text-foreground">Features</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-sm mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/how-it-works" className="hover:text-foreground">How it Works</Link></li>
                            <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                        </ul>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="font-medium text-sm mb-4">Contact</h4>
                        <a href="mailto:support@resumerebuilder.com" className="text-sm text-muted-foreground hover:text-foreground">
                            support@resumerebuilder.com
                        </a>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} Resume Rebuilder. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
