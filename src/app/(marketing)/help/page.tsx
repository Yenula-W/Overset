import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/marketing/section';
import { Button } from '@/components/ui';

export const metadata: Metadata = { title: 'Help' };

const ANSWERS: Array<[string, string]> = [
  ['A page came back with low OCR confidence.', 'Open the page in the editor and check the flagged region. You can correct the recognized text directly, redraw the region, or split it if two bubbles were merged.'],
  ['Overset picked the wrong speaker.', 'Change the speaker in the inspector. The character profile is reapplied and you can regenerate that line with the correct voice.'],
  ['The translation does not fit the bubble.', 'The typesetting panel shows a fit warning with three options: shorten the translation, reduce the font slightly, or place the text by hand. Overset will not shrink text below a readable size on its own.'],
  ['Terminology changed between chapters.', 'Lock the term in the glossary. Locked terms are used in every future translation until you change them, and QA flags anything that drifts.'],
  ['Processing failed on some pages.', 'Retry just those pages. Each pipeline stage keeps its own state, so OCR and translation already done are not repeated or re-billed.'],
  ['I need to remove a chapter I uploaded.', 'Delete it from the project. Deleting removes the original, cleaned, and translated files.'],
];

export default function HelpPage() {
  return (
    <>
      <section className="pt-16 sm:pt-24">
        <div className="shell max-w-3xl">
          <p className="eyebrow">Help</p>
          <h1 className="mt-4 text-section font-semibold text-balance">Common situations.</h1>
        </div>
      </section>

      <Section>
        <dl className="max-w-3xl divide-y divide-line">
          {ANSWERS.map(([q, a]) => (
            <div key={q} className="py-6 first:pt-0">
              <dt className="text-[16px] font-medium">{q}</dt>
              <dd className="mt-2 text-[14.5px] leading-relaxed text-ink-muted">{a}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8">
          <Button href="/contact" variant="secondary">
            Still stuck? Contact us
          </Button>
        </div>
      </Section>
    </>
  );
}
