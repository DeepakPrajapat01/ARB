import { HeroSection } from "@/features/landing/HeroSection";
import { TrustSection } from "@/features/landing/TrustSection";
import { HowItWorksSection } from "@/features/landing/HowItWorksSection";
import { FeaturesSection } from "@/features/landing/FeaturesSection";
import { TemplatePreviewsSection } from "@/features/landing/TemplatePreviewsSection";
import { CTASection } from "@/features/landing/CTASection";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <TrustSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TemplatePreviewsSection />
      <CTASection />
    </div>
  );
}
