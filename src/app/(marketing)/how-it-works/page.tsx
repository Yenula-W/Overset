import type { Metadata } from "next";
import { WorkflowDemo } from "@/components/marketing/workflow-demo";
import { Section } from "@/components/marketing/section";
import { FinalCta } from "@/components/marketing/home-sections";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Upload, analyze, detect, OCR, translate, clean, typeset, review, QA, export — one workflow inside Overset.",
};

const PIPELINE_COPY = [
  [
    "Detect",
    "Panels and text regions are found separately, then classified as dialogue, thought, narration, SFX, signs, or background text. The page is never treated as one block of OCR.",
  ],
  [
    "Understand",
    "Before anything is translated, Overset assembles the chapter, the scene, the conversation, the speaker, and your glossary into one structured context.",
  ],
  [
    "Translate",
    "The model returns a literal reading, a recommended translation, alternatives, a confidence score, and a note when the line is genuinely ambiguous.",
  ],
  [
    "Clean",
    "Only the source text is removed. Simple bubbles get their background restored; text over artwork is reconstructed in the smallest region that will do.",
  ],
  [
    "Typeset",
    "Translated text is fitted into the original bubble by adjusting line breaks first, spacing second, and font size last.",
  ],
  [
    "Review",
    "Everything the AI produced is editable — the OCR, the speaker, the region boundaries, the reading order, the wording, and the typesetting.",
  ],
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="pt-14">
        <div className="mk-shell">
          <p className="mk-eyebrow m-0 uppercase">How it works</p>
          <h1 className="mk-display mt-4 max-w-[1100px] text-balance">
            Same artwork. Different language.
          </h1>
          <p className="mt-6 max-w-[620px] text-pretty text-[16px] leading-[1.6] text-ink-muted">
            Upload, translate, review, export. You control every step.
          </p>
        </div>
      </section>

      <Section
        id="states"
        eyebrow="One workflow"
        title="See the transformation."
      >
        <WorkflowDemo />
      </Section>

      <Section title="Inside the workflow.">
        <div className="mt-8 border-t border-ink">
          {PIPELINE_COPY.map(([title, body], i) => (
            <details
              key={title}
              className="marketing-details border-b border-line py-5"
            >
              <summary className="min-h-10 text-[18px] font-semibold">
                <span>
                  <span className="mr-5 font-mono text-[11px] text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {title}
                </span>
              </summary>
              <p className="max-w-2xl pl-9 pt-3 text-[14px] leading-relaxed text-ink-muted">
                {body}
              </p>
            </details>
          ))}
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
