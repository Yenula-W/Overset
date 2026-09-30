import * as React from 'react';
import { ArrowRight, Check, FileStack, Upload } from 'lucide-react';
import { MkButton, MkSection } from './mk';

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
    <MkSection className="home-section pt-12 sm:pt-16" id="how-it-works">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-[720px] flex-col gap-3.5">
          <span className="mk-eyebrow">HOW IT WORKS</span>
          <h2 className="mk-h2">One chapter. Three simple steps.</h2>
        </div>
        <MkButton href="/signup" variant="outline">
          Translate a chapter free
        </MkButton>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {HOW.map(({ n, title, body, Visual }) => (
          <div key={n} className="flex flex-col gap-3.5">
            <div className="aspect-[4/3] overflow-hidden rounded-lg border border-line bg-mk-tile">
              <Visual />
            </div>
            <span className="text-[13px] font-semibold text-accent">{n}</span>
            <h3 className="m-0 text-[20px] font-semibold tracking-[-0.02em]">{title}</h3>
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
      <div className="border-t border-mk-input pt-3 text-[11px] text-ink-muted">
        46 / 46 pages · 840 × 1180 px · original resolution
      </div>
      <span className="bg-ink px-4 py-2.5 text-center text-[13px] font-medium text-white">Export chapter</span>
    </div>
  );
}

/* --------------------------------------------------------- context engine */

export function ContextEngine() {
  return (
    <MkSection className="home-section">
      <div className="grid items-center gap-10 rounded-xl bg-[#efeee8] p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:p-14">
        <div>
          <p className="mk-eyebrow mb-5">TRANSLATION THAT REMEMBERS</p>
          <h2 className="mk-h2 max-w-[460px]">
            A conversation.
            <br />
            Not a collection
            <br />
            of sentences.
          </h2>
          <p className="mb-0 mt-6 max-w-[380px] text-[16px] leading-relaxed text-ink-muted">
            Who’s speaking. What they’ve been through. What they mean. Bring the whole story into every line.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {['Character voices', 'Shared glossary', 'Translation memory'].map((label) => (
              <span key={label} className="rounded-full border border-[#d6d5cd] px-3 py-1.5 text-[11px] text-ink-muted">
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-[0_12px_28px_-24px_rgba(22,22,22,0.25)]">
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <span
              className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent-strong"
              aria-hidden
            >
              JS
            </span>
            <div>
              <p className="m-0 text-[13px] font-semibold">Jin Seo → Minseo</p>
              <p className="m-0 text-[11px] text-ink-muted">Childhood friends · Casual</p>
            </div>
            <span className="ml-auto font-mono text-[10px] text-ink-muted">KO → EN</span>
          </div>
          <div className="p-5 sm:p-6">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Literal translation
            </p>
            <p className="mb-0 mt-2 text-[22px] font-medium tracking-tight text-ink-muted">Are you going too?</p>
          </div>
          <div className="mx-3 rounded-md border border-accent/15 bg-accent-soft p-5 sm:mx-4">
            <p className="m-0 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-strong">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden /> With the story in mind
            </p>
            <p className="mb-2 mt-3 text-[26px] font-semibold leading-tight tracking-[-0.025em]">
              You’re coming with me, right?
            </p>
            <p className="m-0 text-[12px] leading-relaxed text-ink-muted">One childhood friend leaning on another.</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 px-5 py-4 text-[11px] text-ink-muted">
            <span>6 previous bubbles</span>
            <span>3 glossary entries</span>
            <span>Human review ✓</span>
          </div>
        </div>
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
    <MkSection id="features" className="home-section">
      <p className="mk-eyebrow mb-4">BUILT FOR THE DETAILS</p>
      <h2 className="mk-h2 mb-10">Less busywork. More story.</h2>
      <div className="grid gap-x-8 border-t border-ink sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(([title, body], i) => (
          <div key={title} className="flex flex-col gap-2.5 border-b border-line py-7 sm:pr-5">
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
    <section className="home-section mk-shell pb-16 pt-20 sm:pt-28">
      <div className="grid gap-8 rounded-xl bg-ink px-6 py-12 text-white sm:px-10 lg:grid-cols-[1fr_auto] lg:items-end lg:p-14">
        <div>
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#bab7ed]">
            YOUR NEXT CHAPTER STARTS HERE
          </p>
          <h2 className="m-0 max-w-[700px] text-[clamp(36px,4.8vw,64px)] font-semibold leading-[1.03] tracking-[-0.04em]">
            Let the story
            <br />
            cross the language barrier.
          </h2>
          <p className="mb-0 mt-5 max-w-[440px] text-[15px] leading-relaxed text-[#bfbfbb]">
            Bring your chapter. Keep the art. Make every line your own.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <MkButton
            href="/signup"
            className="min-h-12 rounded-md bg-white px-6 text-ink hover:bg-accent-soft hover:text-ink"
          >
            Translate a chapter free <ArrowRight size={16} aria-hidden />
          </MkButton>
          <span className="text-[11px] text-[#bfbfbb]">30 pages free · No credit card required</span>
        </div>
      </div>
    </section>
  );
}
