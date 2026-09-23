import type { Metadata } from 'next';
import { WorkflowDemo } from '@/components/marketing/workflow-demo';
import { Section } from '@/components/marketing/section';
import { ContextEngine, FinalCta, HowItWorks, QaSection } from '@/components/marketing/sections';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'Upload, analyze, detect, OCR, translate, clean, typeset, review, QA, export — one workflow inside Overset.',
};

const PIPELINE_COPY = [
  ['Detect', 'Panels and text regions are found separately, then classified as dialogue, thought, narration, SFX, signs, or background text. The page is never treated as one block of OCR.'],
  ['Understand', 'Before anything is translated, Overset assembles the chapter, the scene, the conversation, the speaker, and your glossary into one structured context.'],
  ['Translate', 'The model returns a literal reading, a recommended translation, alternatives, a confidence score, and a note when the line is genuinely ambiguous.'],
  ['Clean', 'Only the source text is removed. Simple bubbles get their background restored; text over artwork is reconstructed in the smallest region that will do.'],
  ['Typeset', 'Translated text is fitted into the original bubble by adjusting line breaks first, spacing second, and font size last.'],
  ['Review', 'Everything the AI produced is editable — the OCR, the speaker, the region boundaries, the reading order, the wording, and the typesetting.'],
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="pt-16 sm:pt-24">
        <div className="shell max-w-3xl">
          <p className="eyebrow">How it works</p>
          <h1 className="mt-4 text-section font-semibold text-balance">Same artwork. Different language.</h1>
          <p className="lede mt-6 text-pretty">
            Overset runs a chapter through one pipeline — upload, analyze, detect, OCR, understand, translate, clean,
            typeset, review, QA, export — and hands you control at every step that matters.
          </p>
        </div>
      </section>

      <Section id="states" eyebrow="One workflow" title="Watch what changes. And what doesn’t.">
        <WorkflowDemo />
      </Section>

      <Section eyebrow="The pipeline" title="Each stage, on its own.">
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {PIPELINE_COPY.map(([title, body], i) => (
            <div key={title} className="bg-surface p-6">
              <span className="text-[12px] font-semibold tabular-nums text-accent">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-[16px] font-semibold">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <HowItWorks />
      <ContextEngine />
      <QaSection />
      <FinalCta />
    </>
  );
}
