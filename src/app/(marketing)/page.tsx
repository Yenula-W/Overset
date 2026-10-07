import { WorkflowShowcase } from "@/components/marketing/workflow-showcase";
import { Hero } from "@/components/marketing/hero";
import { ScrollStatement } from "@/components/marketing/scroll-statement";
import { FinalCta } from "@/components/marketing/home-sections";
import { FeatureStrip } from "@/components/marketing/feature-strip";
import { LanguageTicker } from "@/components/marketing/language-ticker";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ScrollStatement />
      <WorkflowShowcase />
      <FeatureStrip />
      <LanguageTicker />
      <FinalCta />
    </>
  );
}
