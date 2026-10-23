import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type FaqItem = [question: string, answer: string];

/**
 * Every answer restates something the product or its docs already say
 * (README principles, the help page, the pricing plans). Nothing here is
 * a new promise.
 */
const HOME_FAQ: FaqItem[] = [
  [
    "What can I upload?",
    "PNG, JPG, WEBP, PDF or a ZIP of pages. You can only upload chapters you own or are authorized to translate.",
  ],
  [
    "Does Overset change my artwork?",
    "No. It finds each text region, removes only the original lettering, and sets the translation back into the same bubbles. Panels, line art and page dimensions are untouched.",
  ],
  [
    "Which languages does it translate?",
    "Korean, Japanese and Chinese into English, Spanish, French and Portuguese, with more target languages such as German, Bahasa and Italian.",
  ],
  [
    "Can I edit what it produces?",
    "Yes. The recognized text, speaker, region boundaries, reading order, wording and typesetting are all editable. Uncertain lines are flagged instead of hidden.",
  ],
  [
    "What if a translation does not fit the bubble?",
    "The typesetting panel shows a fit warning with three options: shorten the line, reduce the font slightly, or place it by hand. Overset will not shrink text below a readable size on its own.",
  ],
  [
    "What does the free plan include?",
    "10 pages a month with OCR, AI translation and a typesetting preview. No card required.",
  ],
  [
    "Can I delete my files?",
    "Yes. Deleting a chapter removes the original, cleaned and translated files.",
  ],
];

/** Billing answers, taken from the plan data and the help page. */
export const PRICING_FAQ: FaqItem[] = [
  [
    "How does the free plan work?",
    "You get 10 pages every month with OCR, AI translation with limited context, and a typesetting preview. No card required.",
  ],
  [
    "What do paid plans add?",
    "More pages each month plus context-aware translation, automatic typesetting and translation memory on Creator. Pro adds the full context engine and QA. The plan lists above show everything per plan.",
  ],
  [
    "What does the yearly option save?",
    "Yearly billing is two months free compared with paying monthly.",
  ],
  [
    "What if I run out of pages?",
    "You can top up with a 50-page pack for $15 on any plan. Reach out through the contact page and we will set it up.",
  ],
  [
    "Am I charged again if a page fails and I retry it?",
    "No. Each pipeline stage keeps its own state, so OCR and translation that already finished are not repeated or re-billed when you retry only the failed pages.",
  ],
  [
    "Can a whole team share one workspace?",
    "Yes. Team includes 5 members with comments and a proofreading workflow, and Publisher covers 20+ members with volume pricing. Contact us for publisher plans.",
  ],
];

export function FaqSection({
  items,
  eyebrow = "Questions",
  title = "The short answers.",
  intro = "Something else on your mind? We read every message.",
  headingId = "faq-title",
}: {
  items: FaqItem[];
  eyebrow?: string;
  title?: string;
  intro?: string;
  headingId?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <section className="mk-shell pt-24" aria-labelledby={headingId}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-20">
        <div>
          <p className="mk-eyebrow m-0 uppercase">{eyebrow}</p>
          <h2 id={headingId} className="mk-h2 mt-3">
            {title}
          </h2>
          <p className="mt-5 max-w-[34ch] text-[15px] leading-[1.55] text-ink-muted">{intro}</p>
          <Link href="/contact" className="editorial-link mt-4">
            Contact us <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
        <div className="border-t border-ink">
          {items.map(([question, answer]) => (
            <details key={question} className="marketing-details border-b border-line py-5">
              <summary className="min-h-10 text-[16px] font-medium">{question}</summary>
              <p className="max-w-[60ch] pt-3 text-[14px] leading-relaxed text-ink-muted">{answer}</p>
            </details>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        // Static content authored above; safe to serialize.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </section>
  );
}

export function Faq() {
  return <FaqSection items={HOME_FAQ} />;
}
