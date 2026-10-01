import { WorkflowShowcase } from "@/components/marketing/workflow-showcase";
import { Hero } from "@/components/marketing/hero";
import { ScrollStatement } from "@/components/marketing/scroll-statement";
import { FinalCta } from "@/components/marketing/home-sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ScrollStatement />
      <WorkflowShowcase />
      <FinalCta />
    </>
  );
}
