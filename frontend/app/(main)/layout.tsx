import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            <div className="flex-1">
                {children}
            </div>
            <Footer />
        </>
    );
}
