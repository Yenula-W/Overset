import * as React from "react";
import { ArrowRight, Check, FileStack, Upload } from "lucide-react";
import { MkButton, MkSection } from "./mk";

/* ------------------------------------------------------------ how it works */

const HOW = [
  {
    n: "01",
    title: "Upload",
    body: "Drop in your chapter and Overset automatically organizes the pages and finds the text.",
    Visual: UploadTile,
  },
  {
    n: "02",
    title: "Translate",
    body: "Overset reads dialogue in context instead of treating every speech bubble as an isolated sentence.",
    Visual: ContextTile,
  },
  {
    n: "03",
    title: "Review & export",
    body: "Review the translation, make any changes you want, and export your localized chapter from one workspace.",
    Visual: ExportTile,
  },
];

export function HowItWorks() {
  return (
    <MkSection className="pt-[120px]" id="how-it-works">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-[720px] flex-col gap-3.5">
          <span className="mk-eyebrow">HOW IT WORKS</span>
          <h2 className="mk-h2">One chapter. One workspace.</h2>
        </div>
        <MkButton href="/about" variant="outline">
          How Overset works <ArrowRight size={14} aria-hidden />
        </MkButton>
      </div>
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        }}
      >
        {HOW.map(({ n, title, Visual }) => (
          <div key={n} className="flex flex-col gap-3.5">
            <div className="aspect-[4/3] bg-mk-tile">
              <Visual />
            </div>
            <span className="text-[13px] font-semibold text-accent">{n}</span>
            <h3 className="m-0 text-[22px] font-bold tracking-[-0.01em]">
              {title}
            </h3>
          </div>
        ))}
      </div>
    </MkSection>
  );
}

/* Product UI shown in place of screenshots — the real workflow, drawn flat. */

function UploadTile() {
  return (
    <div
      className="flex h-full flex-col justify-center gap-3 p-[8%]"
      aria-hidden
    >
      <div className="flex flex-1 flex-col items-center justify-center border border-dashed border-mk-input bg-white text-center">
        <Upload size={18} className="text-accent" />
        <p className="mt-2 text-[13px] font-semibold">Upload chapter</p>
        <p className="mt-0.5 text-[11px] text-ink-faint">
          PNG · JPG · WEBP · PDF · ZIP
        </p>
      </div>
      <div className="flex items-center gap-2.5 border border-line bg-white px-3 py-2.5">
        <FileStack size={14} className="shrink-0 text-ink-muted" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold">Chapter_28.zip</p>
          <p className="text-[11px] text-ink-faint">46 pages</p>
        </div>
        <span className="bg-okSoft px-1.5 py-0.5 text-[10px] font-semibold text-ok">
          READY
        </span>
      </div>
    </div>
  );
}

function ContextTile() {
  const chain = ["Chapter", "Character", "Dialogue"];
  const cards = ["Glossary", "Memory"];
  return (
    <div
      className="flex h-full flex-col justify-center gap-4 p-[8%]"
      aria-hidden
    >
      <ol className="m-0 list-none space-y-1.5 p-0">
        {chain.map((c, i) => (
          <li
            key={c}
            className="flex items-center gap-2 text-[13px] font-semibold"
            style={{ paddingLeft: i * 14 }}
          >
            <span className="h-1.5 w-1.5 bg-accent" />
            {c}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-1.5 border-t border-mk-input pt-3">
        {cards.map((c) => (
          <span
            key={c}
            className="border border-line bg-white px-2 py-1 text-[11px] text-ink-muted"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function ExportTile() {
  const checks = ["Reviewed", "Ready to export"];
  return (
    <div
      className="flex h-full flex-col justify-center gap-4 p-[8%]"
      aria-hidden
    >
      <ul className="m-0 list-none space-y-2.5 p-0">
        {checks.map((c) => (
          <li
            key={c}
            className="flex items-center gap-2.5 text-[13px] font-medium"
          >
            <span className="flex h-4 w-4 items-center justify-center bg-ok text-white">
              <Check size={10} strokeWidth={3} />
            </span>
            {c}
          </li>
        ))}
      </ul>
      <div className="border-t border-mk-input pt-3 text-[11px] text-ink-muted">
        Original dimensions
      </div>
      <span className="bg-ink px-4 py-2.5 text-center text-[13px] font-medium text-white">
        Export chapter
      </span>
    </div>
  );
}

/* --------------------------------------------------------------- final cta */

export function FinalCta() {
  return (
    <section className="mk-shell flex flex-wrap items-end justify-between gap-8 pb-16 pt-24">
      <h2 className="mk-h2">Your next chapter.</h2>
      <div className="flex flex-col items-start gap-3">
        <MkButton href="/signup">
          Translate free <ArrowRight size={16} aria-hidden />
        </MkButton>
        <span className="text-[12px] text-ink-muted">
          30 pages free · No card required
        </span>
      </div>
    </section>
  );
}
