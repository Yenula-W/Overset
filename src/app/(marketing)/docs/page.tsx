import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/marketing/section';
import { Card } from '@/components/ui';
import { PIPELINE } from '@/lib/pipeline';

export const metadata: Metadata = { title: 'Documentation' };

const GUIDES = [
  ['Uploading a chapter', 'Accepted formats, page ordering, size limits, and what happens to your files.', '/how-it-works'],
  ['Translation settings', 'Style, honorifics, SFX, typesetting, memory, and character profiles.', '/how-it-works'],
  ['Working in the editor', 'Regions, speakers, alternatives, approval, and keyboard shortcuts.', '/how-it-works'],
  ['Glossary and terminology', 'Approving, locking, and changing a term across a project.', '/how-it-works'],
  ['Character voices', 'Formality, slang, speech rules, and relationships.', '/how-it-works'],
  ['Exporting', 'Resolution, formats, translation data, and final QA.', '/how-it-works'],
];

export default function DocsPage() {
  return (
    <>
      <section className="pt-16 sm:pt-24">
        <div className="shell max-w-3xl">
          <p className="eyebrow">Documentation</p>
          <h1 className="mt-4 text-section font-semibold text-balance">How Overset works, in detail.</h1>
        </div>
      </section>

      <Section title="Guides">
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {GUIDES.map(([title, body, href]) => (
            <Link key={title} href={href}>
              <Card className="h-full p-5 transition-[border-color] hover:border-ink/20">
                <h3 className="text-[15px] font-semibold">{title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">{body}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <Section eyebrow="Reference" title="Pipeline stages" lede="Each stage has its own state, so a chapter that fails partway retries the failed stage rather than starting over.">
        <ol className="mt-8 divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-surface">
          {PIPELINE.map((stage, i) => (
            <li key={stage.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3">
              <span className="w-6 text-[12px] tabular-nums text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[14px] font-medium">{stage.label}</span>
              <code className="rounded bg-ink/[0.05] px-1.5 py-0.5 text-[11.5px] text-ink-muted">{stage.id}</code>
              <span className="ml-auto text-[12px] text-ink-faint">
                {stage.retryable ? 'Retryable' : 'Manual'}
                {stage.costCenter ? ` · ${stage.costCenter}` : ''}
              </span>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
