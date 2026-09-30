import type { Metadata } from 'next';
import { DemoComicPage } from '@/components/demo/artwork';
import { MkSection } from '@/components/marketing/mk';

export const metadata: Metadata = {
  title: 'About',
  description: 'Same artwork. Different language. Why Overset exists and the principles it is built on.',
};

const PRINCIPLES: Array<[string, string]> = [
  [
    'Preserve the artwork.',
    'A translated page differs from the original in one respect only: the language of the text. Panels, bubbles, expressions, line art, and page dimensions are untouched. The pipeline never sends a whole page through generative regeneration to remove dialogue.',
  ],
  [
    'Translate the story, not isolated sentences.',
    'Every bubble is translated with the chapter, scene, conversation, speaker profile, glossary, and translation memory as structured context.',
  ],
  [
    'AI assists; humans decide.',
    'Recognized text, speaker, region boundaries, reading order, wording, and typesetting are all editable. Uncertainty is flagged rather than papered over.',
  ],
];

const OWNERSHIP: Array<[string, string]> = [
  ['You keep your rights', 'You retain the rights to everything you upload. Overset processes your files to produce your translation — nothing more.'],
  ['Private by default', 'Projects are private to you and the people you invite. Uploaded chapters are not published as public content.'],
  ['Upload what you may translate', 'Only upload material you own or are authorized to translate and process. Overset is localization software, not a distribution platform.'],
  ['Delete whenever you want', 'You can delete projects, chapters, and uploaded files from your account at any time.'],
];

export default function AboutPage() {
  return (
    <>
      <section className="mk-shell pt-14">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-x-14 gap-y-6">
          <h1 className="mk-display" style={{ flex: '1 1 560px' }}>
            Same artwork.
            <br />
            Different language.
          </h1>
          <p className="m-0 max-w-[460px] text-pretty text-[15px] leading-[1.6] text-ink-muted" style={{ flex: '1 1 340px' }}>
            <strong className="font-semibold text-ink">Overset</strong> is the typographic term for text that runs past
            the frame holding it — the exact condition a translated speech bubble falls into, and the problem this
            product spends most of its effort solving well.
          </p>
        </div>
        {/* Original art from the Overset demo chapter, standing in for a studio photo. */}
        <div className="aspect-[16/7] min-h-[280px] overflow-hidden border-2 border-ink bg-mk-frame">
          <svg viewBox="44 44 752 292" className="block h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A panel from an original Overset demo chapter: two figures beneath a tower at dusk">
            <DemoComicPage showArtworkText={false} />
          </svg>
        </div>
      </section>

      <MkSection>
        <span className="mk-eyebrow">THREE PRINCIPLES</span>
        <div className="mt-7 grid gap-10 border-t border-ink pt-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {PRINCIPLES.map(([title, body], i) => (
            <div key={title} className="flex flex-col gap-3">
              <span className="font-mono text-[12px] font-semibold text-accent">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="m-0 text-[24px] font-bold tracking-[-0.01em]">{title}</h3>
              <p className="m-0 text-[15px] leading-[1.6] text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </MkSection>

      <MkSection className="pt-20">
        <h2 className="mk-h2 mb-8">Your chapters stay yours.</h2>
        <div className="grid gap-px border border-line bg-line" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {OWNERSHIP.map(([title, body]) => (
            <div key={title} className="flex flex-col gap-2.5 bg-white p-7">
              <h3 className="m-0 text-[17px] font-bold">{title}</h3>
              <p className="m-0 text-[14.5px] leading-[1.55] text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </MkSection>
    </>
  );
}
