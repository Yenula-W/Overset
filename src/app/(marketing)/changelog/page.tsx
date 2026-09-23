import type { Metadata } from 'next';
import { Section } from '@/components/marketing/section';
import { Badge } from '@/components/ui';

export const metadata: Metadata = { title: 'Changelog' };

const ENTRIES = [
  {
    date: '2026-09-18',
    tag: 'Editor',
    title: 'Compare overlay',
    body: 'Overlay mode highlights any difference between the original and translated page, so you can confirm nothing outside the text regions moved.',
  },
  {
    date: '2026-09-04',
    tag: 'Translation',
    title: 'Ambiguity notes',
    body: 'When a line has more than one defensible reading, the model now says so instead of picking one silently. The note appears beside the translation.',
  },
  {
    date: '2026-08-21',
    tag: 'Typesetting',
    title: 'Readable-size floor',
    body: 'Automatic fitting adjusts line breaks and spacing before font size, and refuses to shrink text below a readable minimum. It raises a fit warning instead.',
  },
  {
    date: '2026-08-06',
    tag: 'Glossary',
    title: 'Locked terms',
    body: 'Approving a correction now offers to apply it to every future occurrence in the project.',
  },
];

export default function ChangelogPage() {
  return (
    <>
      <section className="pt-16 sm:pt-24">
        <div className="shell max-w-3xl">
          <p className="eyebrow">Changelog</p>
          <h1 className="mt-4 text-section font-semibold text-balance">What changed.</h1>
        </div>
      </section>

      <Section>
        <ol className="max-w-3xl divide-y divide-line">
          {ENTRIES.map((e) => (
            <li key={e.date} className="py-7 first:pt-0">
              <div className="flex items-center gap-3">
                <time dateTime={e.date} className="text-[12.5px] tabular-nums text-ink-faint">
                  {new Date(e.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                <Badge>{e.tag}</Badge>
              </div>
              <h2 className="mt-2 text-[19px] font-semibold tracking-[-0.02em]">{e.title}</h2>
              <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-ink-muted">{e.body}</p>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
