import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ChapterGallery } from "@/components/marketing/chapter-gallery";
import { AboutWorkspace } from "@/components/marketing/about-workspace";
import { FinalCta } from "@/components/marketing/home-sections";

export const metadata: Metadata = {
  title: "About",
  description:
    "Comic localization built around artwork, story context, and human control.",
};

const TOOLS = [
  [
    "Smart OCR",
    "Find dialogue, narration, signs, and SFX as separate regions. Correct the recognized text before translation.",
  ],
  [
    "Story context",
    "Bring character voice, relationships, earlier dialogue, and chapter context into each translation.",
  ],
  [
    "Glossary & memory",
    "Keep approved names and terminology consistent. Reuse translations from earlier chapters.",
  ],
  [
    "Typesetting",
    "Fit translated dialogue into the existing bubble with readable type and natural line breaks.",
  ],
  [
    "Review & QA",
    "Edit any line. Review uncertain OCR, inconsistent terms, missing text, and overflow before export.",
  ],
  [
    "Teams",
    "Keep translator, proofreader, and typesetter handoffs together, with comments attached to the relevant dialogue.",
  ],
];

export default function AboutPage() {
  return (
    <>
      <section className="mk-shell pt-14">
        <span className="mk-eyebrow">About Overset</span>
        <h1 className="mk-display mt-4">Made for the story.</h1>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-muted">
          One workspace for comic localization. Preserve the art, translate in
          context, and keep the final say.
        </p>
      </section>
      <ChapterGallery />
      <AboutWorkspace />
      <section className="mk-shell grid gap-10 pt-20 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <span className="mk-eyebrow">The toolkit</span>
          <h2 className="mk-h2 mt-4">
            Everything stays
            <br />
            with the chapter.
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink-muted">
            Open a tool to explore the details.
          </p>
        </div>
        <div className="border-t border-ink">
          {TOOLS.map(([title, body], i) => (
            <details
              key={title}
              className="marketing-details border-b border-line py-5"
            >
              <summary className="min-h-10 text-[18px] font-semibold">
                <span>
                  <span className="mr-5 font-mono text-[11px] font-normal text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {title}
                </span>
              </summary>
              <p className="max-w-lg pb-2 pl-9 pt-3 text-[14px] leading-relaxed text-ink-muted">
                {body}
              </p>
            </details>
          ))}
        </div>
      </section>
      <section className="mk-shell pt-20">
        <div className="flex flex-wrap items-center justify-between gap-8 rounded-2xl bg-[#eeede8] p-7 sm:p-10">
          <div>
            <h2 className="text-[28px] font-semibold tracking-[-.025em]">
              Your chapters stay yours.
            </h2>
            <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-ink-muted">
              Ownership stays with you. Only upload work you own or are
              authorized to translate.
            </p>
          </div>
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center gap-3 text-[13px] font-medium"
          >
            Content & privacy <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </section>
      <FinalCta />
    </>
  );
}
