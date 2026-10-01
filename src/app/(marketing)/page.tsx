import { WorkflowShowcase } from "@/components/marketing/workflow-showcase";
import { Hero } from "@/components/marketing/hero";
import { FinalCta } from "@/components/marketing/home-sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <WorkflowShowcase />
      <FinalCta />
    </>
  );
}
