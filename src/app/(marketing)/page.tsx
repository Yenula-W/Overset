import { Hero } from '@/components/marketing/hero';
import { WorkflowDemo } from '@/components/marketing/workflow-demo';
import { Section } from '@/components/marketing/section';
import {
  CharacterVoices,
  ContextEngine,
  FeatureGrid,
  FinalCta,
  HowItWorks,
  OwnershipSection,
  QaSection,
} from '@/components/marketing/sections';

export default function HomePage() {
  return (
    <>
      <Hero />

      <Section
        id="product"
        eyebrow="One workflow"
        title={
          <>
            From raw chapter to
            <br className="hidden sm:block" /> finished translation.
          </>
        }
        lede="Same page, five states. Move through them and watch what changes — and what deliberately doesn’t."
      >
        <WorkflowDemo />
      </Section>

      <HowItWorks />
      <ContextEngine />
      <CharacterVoices />
      <QaSection />
      <FeatureGrid />
      <OwnershipSection />
      <FinalCta />
    </>
  );
}
