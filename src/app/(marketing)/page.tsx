import { WorkflowShowcase } from "@/components/marketing/workflow-showcase";
import { Hero } from "@/components/marketing/hero";
import { ScrollStatement } from "@/components/marketing/scroll-statement";
import { FinalCta } from "@/components/marketing/home-sections";
import { FeatureStrip } from "@/components/marketing/feature-strip";
import { LanguageTicker } from "@/components/marketing/language-ticker";
import { CompareSlider } from "@/components/marketing/compare-slider";
import { PricingTeaser } from "@/components/marketing/pricing-teaser";
import { CraftBento } from "@/components/marketing/craft-bento";
import { ProofStrip } from "@/components/marketing/proof-strip";
import { Faq } from "@/components/marketing/faq";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ScrollStatement />
      <ProofStrip />
      <CompareSlider />
      <CraftBento />
      <WorkflowShowcase />
      <FeatureStrip />
      <LanguageTicker />
      <PricingTeaser />
      <Faq />
      <FinalCta />
    </>
  );
}
