import * as React from 'react';
import {
  ArrowRight,
  Check,
  FileStack,
  Languages,
  Layers,
  ScanText,
  ShieldCheck,
  Type,
  Upload,
} from 'lucide-react';
import { Button, Card, StatusBadge } from '@/components/ui';
import { Section, Reveal } from './section';

/* ------------------------------------------------------------ how it works */

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title={
        <>
          Translation shouldn’t require
          <br className="hidden sm:block" /> six different tools.
        </>
      }
    >
      <div className="mt-14 space-y-6">
        <Step
          number="01"
          title="Upload your chapter"
          body="Drop in your chapter and Overset automatically organizes the pages and finds the text."
          visual={<UploadVisual />}
        />
        <Step
          number="02"
          title="Let Overset understand it"
          body="Overset reads dialogue in context instead of treating every speech bubble as an isolated sentence."
          visual={<ContextVisual />}
          reverse
        />
        <Step
          number="03"
          title="Review. Typeset. Export."
          body="Review the translation, make any changes you want, and export your localized chapter from one workspace."
          visual={<ExportVisual />}
        />
      </div>
    </Section>
  );
}

function Step({
  number,
  title,
  body,
  visual,
  reverse,
}: {
  number: string;
  title: string;
  body: string;
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <Reveal>
      <div className="grid items-center gap-8 rounded-xl2 border border-line bg-surface p-6 sm:p-10 lg:grid-cols-2 lg:gap-14">
        <div className={reverse ? 'lg:order-2' : undefined}>
          <span className="text-[13px] font-semibold tabular-nums text-accent">{number}</span>
          <h3 className="mt-2 text-sub font-semibold">{title}</h3>
          <p className="mt-3 max-w-md text-[16px] leading-relaxed text-ink-muted">{body}</p>
        </div>
        <div className={reverse ? 'lg:order-1' : undefined}>{visual}</div>
      </div>
    </Reveal>
  );
}

function UploadVisual() {
  return (
    <div className="rounded-xl border border-dashed border-line bg-canvas p-5">
      <div className="flex flex-col items-center py-6 text-center">
        <Upload size={20} className="text-accent" aria-hidden />
        <p className="mt-3 text-[14px] font-medium">Drop your chapter here</p>
        <p className="mt-1 text-[12.5px] text-ink-muted">PNG · JPG · WEBP · PDF · ZIP</p>
      </div>
      <div className="mt-2 flex items-center gap-3 rounded-lg border border-line bg-surface px-3.5 py-3">
        <FileStack size={16} className="shrink-0 text-ink-muted" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">Chapter_28.zip</p>
          <p className="text-[12px] text-ink-muted">46 pages · 218 MB</p>
        </div>
        <StatusBadge tone="ok" label="Ready" />
      </div>
    </div>
  );
}

const CONTEXT_CHAIN = ['Chapter', 'Scene', 'Character', 'Conversation', 'Bubble'];
const CONTEXT_CARDS = ['Character context', 'Relationships', 'Previous dialogue', 'Glossary', 'Translation memory'];

function ContextVisual() {
  return (
    <div className="rounded-xl border border-line bg-canvas p-5">
      <ol className="space-y-1.5">
        {CONTEXT_CHAIN.map((c, i) => (
          <li key={c} className="flex items-center gap-2" style={{ paddingLeft: i * 14 }}>
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            <span className="text-[13.5px] font-medium">{c}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap gap-1.5 border-t border-line pt-4">
        {CONTEXT_CARDS.map((c) => (
          <span key={c} className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[12px] text-ink-muted">
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function ExportVisual() {
  const checks = ['Translation approved', 'Terminology checked', 'Typesetting complete'];
  return (
    <div className="rounded-xl border border-line bg-canvas p-5">
      <ul className="space-y-2.5">
        {checks.map((c) => (
          <li key={c} className="flex items-center gap-2.5 text-[14px]">
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-ok/15" aria-hidden>
              <Check size={11} className="text-ok" />
            </span>
            {c}
          </li>
        ))}
      </ul>
      <Button className="mt-5 w-full" size="md">
        Export Chapter
      </Button>
    </div>
  );
}

/* --------------------------------------------------------- context engine */

export function ContextEngine() {
  return (
    <Section
      eyebrow="Context engine"
      title={
        <>
          Because the same sentence
          <br className="hidden sm:block" /> doesn’t always mean the same thing.
        </>
      }
      lede="Most translation tools see a sentence. Overset sees the conversation around it."
    >
      <Reveal delay={80}>
        <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-5 py-3">
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
              <span className="text-[13px] font-medium">Jin Seo → Minseo</span>
            </div>
            <div className="divide-y divide-line">
              <Compare
                label="Literal"
                text="Are you going too?"
                tone="muted"
                note="Grammatically correct. Emotionally wrong."
              />
              <Compare
                label="Context-aware"
                text="You’re coming with me, right?"
                tone="accent"
                note="Same line, read as one childhood friend leaning on another."
              />
            </div>
          </Card>

          <Card>
            <div className="border-b border-line px-5 py-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-faint">Why</p>
            </div>
            <dl className="divide-y divide-line">
              {[
                ['Character', 'Jin Seo'],
                ['Relationship', 'Childhood friends'],
                ['Tone', 'Casual'],
                ['Previous context', '6 dialogue bubbles'],
                ['Glossary', '3 relevant entries'],
                ['Translation memory', '2 related examples'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 px-5 py-2.5">
                  <dt className="text-[12.5px] text-ink-muted">{k}</dt>
                  <dd className="text-right text-[12.5px] font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </Reveal>
    </Section>
  );
}

function Compare({ label, text, tone, note }: { label: string; text: string; tone: 'muted' | 'accent'; note: string }) {
  return (
    <div className="px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className={tone === 'accent' ? 'mt-2 text-[22px] font-medium tracking-[-0.02em] text-ink' : 'mt-2 text-[22px] font-medium tracking-[-0.02em] text-ink-faint'}>
        {text}
      </p>
      <p className="mt-2 text-[13px] text-ink-muted">{note}</p>
    </div>
  );
}

/* -------------------------------------------------------- character voices */

export function CharacterVoices() {
  return (
    <Section
      eyebrow="Character voices"
      title={
        <>
          Characters shouldn’t all
          <br className="hidden sm:block" /> sound like the same AI.
        </>
      }
      lede="Overset keeps a profile for every recurring character — how formal they are, how much slang they use, what they call the people around them — and remembers the wording you approved last chapter."
    >
      <Reveal delay={80}>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Generic</p>
            <p className="mt-3 text-[24px] font-medium tracking-[-0.02em] text-ink-faint">Surely, you must be joking.</p>
            <p className="mt-4 text-[13px] text-ink-muted">Technically accurate. Nothing of the character survives it.</p>
          </Card>
          <Card className="border-accent/40 bg-accent-soft/50 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-strong">Character-aware</p>
            <p className="mt-3 text-[24px] font-medium tracking-[-0.02em]">You’ve gotta be kidding me.</p>
            <p className="mt-4 text-[13px] text-ink-muted">
              Jin Seo · low formality · moderate slang · uses contractions.
            </p>
          </Card>
        </div>
      </Reveal>
    </Section>
  );
}

/* ---------------------------------------------------------------- qa block */

export function QaSection() {
  const issues = [
    {
      title: 'Terminology',
      detail: '“Dark Gate” differs from previously approved “Shadow Gate.”',
      action: 'Fix',
      tone: 'danger' as const,
    },
    {
      title: 'Character voice',
      detail: 'This dialogue is unusually formal for Jin Seo.',
      action: 'Review',
      tone: 'warn' as const,
    },
    {
      title: 'Missing text',
      detail: 'Potential untranslated text detected on Page 18.',
      action: 'View',
      tone: 'warn' as const,
    },
  ];

  return (
    <Section eyebrow="Quality assurance" title="Catch mistakes before your readers do." lede="Overset runs a proofreading pass across the whole chapter before export — and flags what it is unsure about rather than quietly rewriting your work.">
      <Reveal delay={80}>
        <Card className="mt-12 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <span className="text-[14px] font-semibold">3 issues found</span>
            <span className="text-[12.5px] text-ink-muted">Chapter 14 · 43 pages</span>
          </div>
          <ul className="divide-y divide-line">
            {issues.map((i) => (
              <li key={i.title} className="flex items-start gap-4 px-5 py-4">
                <StatusBadge tone={i.tone} label={i.title} className="mt-0.5 shrink-0" />
                <p className="flex-1 text-[14px] leading-relaxed text-ink-muted">{i.detail}</p>
                <Button size="sm" variant="secondary" className="shrink-0">
                  {i.action}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------ feature grid */

const FEATURES = [
  { icon: ScanText, title: 'Smart OCR', body: 'Detect dialogue, narration, signs, and SFX — each classified separately, never as one block of text.' },
  { icon: Languages, title: 'Context-aware translation', body: 'Translate using chapter, scene, and character context instead of isolated sentences.' },
  { icon: Layers, title: 'Original layout preservation', body: 'Artwork, bubbles, panels, and page dimensions come out exactly as they went in.' },
  { icon: Type, title: 'Automatic typesetting', body: 'Fit translations into the existing bubbles — without shrinking text past readable.' },
  { icon: FileStack, title: 'Translation memory', body: 'Remember terminology and the wording you approved, chapter after chapter.' },
  { icon: ShieldCheck, title: 'Built-in QA', body: 'Catch terminology drift, voice slips, and missed text before export.' },
];

export function FeatureGrid() {
  return (
    <Section id="features" eyebrow="Everything in one workspace" title="One chapter. One workspace.">
      <div className="mt-12 grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 50} className="bg-surface">
            <div className="h-full p-6">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                <f.icon size={17} aria-hidden />
              </span>
              <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.01em]">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- privacy */

export function OwnershipSection() {
  return (
    <Section id="ownership" eyebrow="Privacy and ownership" title="Your chapters stay yours.">
      <Reveal delay={60}>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {[
            ['You keep your rights', 'You retain the rights to everything you upload. Overset processes your files to produce your translation — nothing more.'],
            ['Private by default', 'Projects are private to you and the people you invite. Uploaded chapters are not published as public content.'],
            ['Upload what you may translate', 'Only upload material you own or are authorized to translate and process. Overset is localization software, not a distribution platform.'],
            ['Delete whenever you want', 'You can delete projects, chapters, and uploaded files from your account at any time.'],
          ].map(([title, body]) => (
            <Card key={title} className="p-6">
              <h3 className="text-[15px] font-semibold">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{body}</p>
            </Card>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

/* -------------------------------------------------------------- final cta */

export function FinalCta() {
  return (
    <section className="py-28 sm:py-40">
      <div className="shell text-center">
        <h2 className="mx-auto max-w-3xl text-section font-semibold text-balance">
          Your next chapter could already
          <br className="hidden sm:block" /> be translated.
        </h2>
        <p className="lede mx-auto mt-6 max-w-lg">Upload a chapter and see what Overset can do.</p>
        <div className="mt-9">
          <Button href="/signup" size="lg">
            Translate for free
            <ArrowRight size={16} />
          </Button>
        </div>
        <p className="mt-4 text-[13px] text-ink-faint">30 pages free · No credit card required</p>
      </div>
    </section>
  );
}
