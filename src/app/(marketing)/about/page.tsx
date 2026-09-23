import type { Metadata } from 'next';
import { Section } from '@/components/marketing/section';
import { FinalCta } from '@/components/marketing/sections';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <>
      <section className="pt-16 sm:pt-24">
        <div className="shell max-w-3xl">
          <p className="eyebrow">About</p>
          <h1 className="mt-4 text-section font-semibold text-balance">Localization software, not a translation toy.</h1>
          <p className="lede mt-6 text-pretty">
            Translating a comic chapter today means moving between an OCR tool, a translator, an image editor, a
            typesetting app, a terminology spreadsheet, and a proofreading pass in a chat thread. PanelFlow is an
            attempt to put that in one place without taking the judgment away from the translator.
          </p>
        </div>
      </section>

      <Section title="What we believe">
        <div className="mt-8 max-w-2xl space-y-6 text-[15px] leading-relaxed text-ink-muted">
          <p>
            <strong className="font-medium text-ink">The artwork is not ours to change.</strong> A translated page
            should differ from the original in exactly one respect: the language of the text. Panels, bubbles,
            expressions, line art, and page dimensions come out the way they went in.
          </p>
          <p>
            <strong className="font-medium text-ink">A bubble is not a sentence.</strong> Dialogue means what it means
            because of who is speaking, who they are speaking to, and what was said six bubbles ago. Translating
            bubbles in isolation is how a story ends up sounding like nobody in particular.
          </p>
          <p>
            <strong className="font-medium text-ink">The translator decides.</strong> Every output — the recognized
            text, the speaker, the reading order, the wording, the typesetting — is editable. When the model is unsure,
            it says so rather than committing to a confident-sounding guess.
          </p>
          <p>
            <strong className="font-medium text-ink">Fit never outranks meaning.</strong> If a good translation needs a
            slightly tighter bubble, that is the right trade. Gutting a line to save a few pixels is not.
          </p>
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
