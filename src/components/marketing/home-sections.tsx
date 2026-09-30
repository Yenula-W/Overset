import * as React from 'react';
import { Check, FileStack, Upload } from 'lucide-react';
import { MkButton, MkSection, UploadBar } from './mk';

/* ------------------------------------------------------------ how it works */

const HOW = [
  {
    n: '01',
    title: 'Upload your chapter',
    body: 'Drop in your chapter and Overset automatically organizes the pages and finds the text.',
    Visual: UploadTile,
  },
  {
    n: '02',
    title: 'Let Overset understand it',
    body: 'Overset reads dialogue in context instead of treating every speech bubble as an isolated sentence.',
    Visual: ContextTile,
  },
  {
    n: '03',
    title: 'Review. Typeset. Export.',
    body: 'Review the translation, make any changes you want, and export your localized chapter from one workspace.',
    Visual: ExportTile,
  },
];

export function HowItWorks() {
  return (
    <MkSection className="pt-[120px]" id="how-it-works">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-[720px] flex-col gap-3.5">
          <span className="mk-eyebrow">HOW IT WORKS</span>
          <h2 className="mk-h2">Translation shouldn’t require six different tools.</h2>
        </div>
        <MkButton href="/signup" variant="outline">
          Translate a chapter free
        </MkButton>
      </div>
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {HOW.map(({ n, title, body, Visual }) => (
          <div key={n} className="flex flex-col gap-3.5">
            <div className="aspect-[4/3] bg-mk-tile">
              <Visual />
            </div>
            <span className="text-[13px] font-semibold text-accent">{n}</span>
            <h3 className="m-0 text-[22px] font-bold tracking-[-0.01em]">{title}</h3>
            <p className="m-0 text-[15px] leading-[1.55] text-ink-muted">{body}</p>
          </div>
        ))}
      </div>
    </MkSection>
  );
}

/* Product UI shown in place of screenshots — the real workflow, drawn flat. */

function UploadTile() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-[8%]" aria-hidden>
      <div className="flex flex-1 flex-col items-center justify-center border border-dashed border-mk-input bg-white text-center">
        <Upload size={18} className="text-accent" />
        <p className="mt-2 text-[13px] font-semibold">Drop your chapter here</p>
        <p className="mt-0.5 text-[11px] text-ink-faint">PNG · JPG · WEBP · PDF · ZIP</p>
      </div>
      <div className="flex items-center gap-2.5 border border-line bg-white px-3 py-2.5">
        <FileStack size={14} className="shrink-0 text-ink-muted" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold">Chapter_28.zip</p>
          <p className="text-[11px] text-ink-faint">46 pages · 218 MB</p>
        </div>
        <span className="bg-okSoft px-1.5 py-0.5 text-[10px] font-semibold text-ok">READY</span>
      </div>
    </div>
  );
}

function ContextTile() {
  const chain = ['Chapter', 'Scene', 'Character', 'Conversation', 'Bubble'];
  const cards = ['Character', 'Relationships', 'Previous dialogue', 'Glossary', 'Memory'];
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-[8%]" aria-hidden>
      <ol className="m-0 list-none space-y-1.5 p-0">
        {chain.map((c, i) => (
          <li key={c} className="flex items-center gap-2 text-[13px] font-semibold" style={{ paddingLeft: i * 14 }}>
            <span className="h-1.5 w-1.5 bg-accent" />
            {c}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-1.5 border-t border-mk-input pt-3">
        {cards.map((c) => (
          <span key={c} className="border border-line bg-white px-2 py-1 text-[11px] text-ink-muted">
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function ExportTile() {
  const checks = ['Translation approved', 'Terminology checked', 'Typesetting complete'];
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-[8%]" aria-hidden>
      <ul className="m-0 list-none space-y-2.5 p-0">
        {checks.map((c) => (
          <li key={c} className="flex items-center gap-2.5 text-[13px] font-medium">
            <span className="flex h-4 w-4 items-center justify-center bg-ok text-white">
              <Check size={10} strokeWidth={3} />
            </span>
            {c}
          </li>
        ))}
      </ul>
      <div className="border-t border-mk-input pt-3 text-[11px] text-ink-muted">46 / 46 pages · 840 × 1180 px · original resolution</div>
      <span className="bg-ink px-4 py-2.5 text-center text-[13px] font-medium text-white">Export chapter</span>
    </div>
  );
}

/* --------------------------------------------------------- context engine */

const WHY: Array<[string, string]> = [
  ['Character', 'Jin Seo'],
  ['Relationship', 'Childhood friends'],
  ['Tone', 'Casual'],
  ['Previous context', '6 dialogue bubbles'],
  ['Glossary', '3 relevant entries'],
  ['Translation memory', '2 related examples'],
];

export function ContextEngine() {
  return (
    <MkSection className="flex flex-wrap gap-12">
      <div className="flex flex-col gap-[18px]" style={{ flex: '1 1 400px' }}>
        <span className="mk-eyebrow">CONTEXT ENGINE</span>
        <h2 className="mk-h2">Because the same sentence doesn’t always mean the same thing.</h2>
        <p className="m-0 max-w-[480px] text-[16px] leading-[1.55] text-ink-muted">
          Most translation tools see a sentence. Overset sees the conversation around it.
        </p>
      </div>
      <div
        className="grid border border-line bg-white"
        style={{ flex: '1 1 520px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
      >
        <div className="flex flex-col border-line sm:border-r">
          <div className="border-b border-line px-5 py-3.5 text-[13px] font-semibold">Jin Seo → Minseo</div>
          <div className="flex flex-col gap-2 border-b border-line px-5 py-[22px]">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-ink-faint">LITERAL</span>
            <span className="text-[24px] font-semibold tracking-[-0.02em] text-ink-faint">Are you going too?</span>
            <span className="text-[13px] text-ink-muted">Grammatically correct. Emotionally wrong.</span>
          </div>
          <div className="flex flex-col gap-2 bg-accent-soft px-5 py-[22px]">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-accent-strong">CONTEXT-AWARE</span>
            <span className="text-[24px] font-semibold tracking-[-0.02em]">You’re coming with me, right?</span>
            <span className="text-[13px] text-ink-muted">Same line, read as one childhood friend leaning on another.</span>
          </div>
        </div>
        <dl className="m-0 flex flex-col">
          <div className="border-b border-line px-5 py-3.5 text-[11px] font-semibold tracking-[0.12em] text-ink-faint">WHY</div>
          {WHY.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-line px-5 py-3 text-[13px]">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="m-0 text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </MkSection>
  );
}

/* ---------------------------------------------------------------- features */

const FEATURES: Array<[string, string]> = [
  ['Smart OCR', 'Detect dialogue, narration, signs, and SFX — each classified separately, never as one block of text.'],
  ['Context-aware translation', 'Translate using chapter, scene, and character context instead of isolated sentences.'],
  ['Original layout preservation', 'Artwork, bubbles, panels, and page dimensions come out exactly as they went in.'],
  ['Automatic typesetting', 'Fit translations into the existing bubbles — without shrinking text past readable.'],
  ['Translation memory', 'Remember terminology and the wording you approved, chapter after chapter.'],
  ['Built-in QA', 'Catch terminology drift, voice slips, and missed text before export.'],
];

export function Features() {
  return (
    <MkSection id="features">
      <h2 className="mk-h2 mb-10">One chapter. One workspace.</h2>
      <div className="grid border-t border-ink" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {FEATURES.map(([title, body], i) => (
          <div key={title} className="mr-7 flex flex-col gap-2.5 border-b border-line pb-8 pr-7 pt-7">
            <span className="font-mono text-[12px] font-semibold text-accent">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="m-0 text-[19px] font-bold tracking-[-0.01em]">{title}</h3>
            <p className="m-0 text-[14.5px] leading-[1.55] text-ink-muted">{body}</p>
          </div>
        ))}
      </div>
    </MkSection>
  );
}

/* --------------------------------------------------------------- final cta */

export function FinalCta() {
  return (
    <section className="mk-shell flex flex-wrap items-end justify-between gap-x-14 gap-y-8 pb-20 pt-[120px]">
      <h2
        className="m-0 font-extrabold uppercase"
        style={{ flex: '1 1 560px', fontSize: 'clamp(34px, 5.4vw, 80px)', lineHeight: 0.95, letterSpacing: '-0.025em' }}
      >
        Your next chapter could already be translated.
      </h2>
      <div className="flex max-w-[460px] flex-col gap-3.5" style={{ flex: '1 1 340px' }}>
        <p className="m-0 text-[15px] leading-[1.55] text-ink-muted">Upload a chapter and see what Overset can do.</p>
        <UploadBar />
        <span className="text-[13px] text-ink-faint">30 pages free · No credit card required</span>
      </div>
    </section>
  );
}
