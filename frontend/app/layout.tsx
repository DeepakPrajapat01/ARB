import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AI Resume Rebuilder | Professional ATS Resumes",
  description: "Upload your resume. We rebuild it professionally.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen flex flex-col font-sans antialiased`}>
        <AuthProvider>
          <main className="flex-1 h-full w-full">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
