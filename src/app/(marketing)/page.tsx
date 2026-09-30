import { Hero } from '@/components/marketing/hero';
import { ContextEngine, Features, FinalCta, HowItWorks } from '@/components/marketing/home-sections';

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ContextEngine />
      <Features />
      <FinalCta />
    </>
  );
}
