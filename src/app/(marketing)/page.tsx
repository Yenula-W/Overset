import { WorkflowShowcase } from "@/components/marketing/workflow-showcase";
import { Hero } from "@/components/marketing/hero";
import { ScrollStatement } from "@/components/marketing/scroll-statement";
import { FinalCta } from "@/components/marketing/home-sections";
import { FeatureStrip } from "@/components/marketing/feature-strip";
import { LanguageTicker } from "@/components/marketing/language-ticker";
import { CompareSlider } from "@/components/marketing/compare-slider";
import { PricingTeaser } from "@/components/marketing/pricing-teaser";
import { Faq } from "@/components/marketing/faq";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ScrollStatement />
      <CompareSlider />
      <WorkflowShowcase />
      <FeatureStrip />
      <LanguageTicker />
      <PricingTeaser />
      <Faq />
      <FinalCta />
    </>
  );
}
