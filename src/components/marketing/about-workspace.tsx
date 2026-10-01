"use client";

import * as React from "react";
import {
  ArrowRight,
  Check,
  Lock,
  ScanLine,
  Sparkles,
  PencilLine,
} from "lucide-react";
import { ComicPage } from "@/components/demo/comic-page";
import { DEMO_REGIONS } from "@/lib/data/chapter";

const MODES = [
  {
    title: "Artwork",
    icon: ScanLine,
    heading: "Same page. Every detail.",
    copy: "Localize the lettering while preserving the original composition.",
  },
  {
    title: "Context",
    icon: Sparkles,
    heading: "The story comes with it.",
    copy: "Character voice, previous dialogue, and approved terms inform each line.",
  },
  {
    title: "Control",
    icon: PencilLine,
    heading: "Your translation. Your call.",
    copy: "Edit the wording, review the fit, then approve it.",
  },
];

// Original interactions inspired by Skiper UI's expandable tabs and cards.
// No registry source or additional scroll engine is used.
export function AboutWorkspace() {
  const [mode, setMode] = React.useState(0);
  const active = MODES[mode];
  return (
    <section className="mk-shell pt-20" aria-label="Explore Overset">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <h2 className="mk-h2">Built around your chapter.</h2>
        <div
          className="flex gap-1 rounded-full border border-line bg-white p-1"
          aria-label="Product principles"
        >
          {MODES.map(({ title, icon: Icon }, index) => (
            <button
              key={title}
              type="button"
              aria-pressed={mode === index}
              aria-controls="about-demo"
              onClick={() => setMode(index)}
              className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-colors ${mode === index ? "bg-ink text-white" : "text-ink-muted hover:bg-canvas"}`}
            >
              <Icon size={15} aria-hidden />
              <span>{title}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="grid lg:grid-cols-[.85fr_1.15fr]">
          <div className="flex flex-col justify-between gap-8 p-7 sm:p-10">
            <div>
              <span className="mk-eyebrow">
                {String(mode + 1).padStart(2, "0")} / {active.title}
              </span>
              <h3 className="mt-5 max-w-sm text-[36px] font-semibold leading-[1.08] tracking-[-.035em] sm:text-[44px]">
                {active.heading}
              </h3>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink-muted">
                {active.copy}
              </p>
            </div>
            <span className="text-[11px] text-ink-muted">
              Interactive product demo · Original fictional artwork
            </span>
          </div>
          <div
            id="about-demo"
            className="flex min-h-[500px] items-center justify-center overflow-hidden bg-[#eeede8] p-5 sm:p-8"
          >
            <div key={mode} className="about-demo-reveal w-full">
              {mode === 0 ? (
                <ArtworkCompare />
              ) : mode === 1 ? (
                <StoryContext />
              ) : (
                <HumanReview />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArtworkCompare() {
  const [split, setSplit] = React.useState(50);
  return (
    <div className="mx-auto max-w-[280px]">
      <div className="mb-3 flex justify-between text-[11px] font-medium text-ink-muted">
        <span>Original</span>
        <span>Translated</span>
      </div>
      <div className="relative overflow-hidden bg-white shadow-lg">
        <ComicPage view="typeset" regions={DEMO_REGIONS} />
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
          aria-hidden
        >
          <ComicPage view="original" regions={DEMO_REGIONS} />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-accent"
          style={{ left: `${split}%` }}
        >
          <span
            className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-accent shadow-sm"
            aria-hidden
          >
            ↔
          </span>
        </div>
      </div>
      <label className="mt-4 flex items-center gap-3 text-[11px] text-ink-muted">
        Compare
        <input
          type="range"
          min="0"
          max="100"
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          aria-label="Original and translated comparison"
          className="min-h-8 min-w-0 flex-1 accent-accent"
        />
      </label>
    </div>
  );
}

function StoryContext() {
  const [voice, setVoice] = React.useState<"casual" | "formal">("casual");
  return (
    <div className="mx-auto max-w-[420px]">
      <div className="mx-6 h-3 rounded-t-xl border border-b-0 border-line bg-[#f8f8f4]" />
      <div className="mx-3 h-3 rounded-t-xl border border-b-0 border-line bg-[#f8f8f4]" />
      <div className="rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft font-semibold text-accent-strong">
            JS
          </span>
          <div>
            <p className="text-[15px] font-semibold">Jin Seo</p>
            <p className="text-[12px] text-ink-muted">
              Speaking to a childhood friend
            </p>
          </div>
        </div>
        <fieldset className="mb-6 flex gap-2">
          <legend className="mb-2 text-[11px] text-ink-muted">
            Character voice
          </legend>
          {(["casual", "formal"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={voice === v}
              onClick={() => setVoice(v)}
              className={`min-h-10 rounded-md border px-4 text-[12px] capitalize transition-colors ${voice === v ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}
            >
              {v}
            </button>
          ))}
        </fieldset>
        <p className="mb-3 text-[12px] text-ink-muted">Are you going too?</p>
        <div className="border-l-2 border-accent pl-4">
          <p className="text-[24px] font-semibold leading-[1.3] tracking-[-.025em]">
            {voice === "casual"
              ? "You’re coming with me, right?"
              : "Will you be joining me?"}
          </p>
        </div>
        <div className="mt-7 flex items-center justify-between border-t border-line pt-4 text-[11px] text-ink-muted">
          <span>Previous dialogue + glossary</span>
          <Lock size={12} aria-label="Approved terminology" />
        </div>
      </div>
    </div>
  );
}

function HumanReview() {
  const [text, setText] = React.useState(
    "You seriously thought that would work?",
  );
  const [approved, setApproved] = React.useState(false);
  return (
    <div className="mx-auto max-w-[420px] rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center justify-between text-[11px] text-ink-muted">
        <span>Jin Seo · Dialogue 02</span>
        <span>Demo</span>
      </div>
      <div className="mx-auto mb-8 grid min-h-28 max-w-[270px] place-items-center break-words [overflow-wrap:anywhere] rounded-[50%] border-2 border-ink px-8 py-5 text-center font-narrow text-[19px] font-bold uppercase leading-tight">
        {text || "Your dialogue here"}
      </div>
      <label
        htmlFor="demo-translation"
        className="mb-2 block text-[12px] font-medium"
      >
        Final translation
      </label>
      <textarea
        id="demo-translation"
        value={text}
        maxLength={160}
        onChange={(e) => {
          setText(e.target.value);
          setApproved(false);
        }}
        className="min-h-24 w-full resize-none rounded-md border border-line bg-canvas p-3 text-[14px] leading-relaxed focus:border-accent"
      />
      <button
        type="button"
        disabled={!text.trim()}
        onClick={() => setApproved(true)}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-[13px] font-medium text-white transition-colors hover:bg-accent disabled:opacity-40"
      >
        {approved ? (
          <>
            <Check size={15} aria-hidden /> Approved
          </>
        ) : (
          <>
            Approve translation <ArrowRight size={15} aria-hidden />
          </>
        )}
      </button>
      <p
        className="mt-3 min-h-4 text-center text-[11px] text-ink-muted"
        aria-live="polite"
      >
        {approved
          ? "Demo approved. You can still edit it."
          : "Try editing the line above."}
      </p>
    </div>
  );
}
