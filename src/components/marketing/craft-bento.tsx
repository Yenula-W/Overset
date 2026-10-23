import { ArrowRight, BookMarked, Check, Lock, Type } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "The craft" section: what a professional localizer does by hand, shown as
 * small live specimens. Demo dialogue is fictional (it matches the hero page).
 */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="mk-eyebrow-pill">{children}</span>;
}

function Bubble({ lines, className, tone = "ok" }: { lines: string[]; className?: string; tone?: "ok" | "bad" }) {
  return (
    <div
      className={cn(
        "flex aspect-[1.7/1] w-full max-w-[210px] flex-col items-center justify-center rounded-[50%] border-2 bg-white px-6 text-center font-narrow text-[15px] font-bold uppercase leading-[1.12] text-ink",
        tone === "ok" ? "border-ink" : "border-ink/30 text-ink/55",
        className,
      )}
    >
      {lines.map((l) => (
        <span key={l}>{l}</span>
      ))}
    </div>
  );
}

function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "ok" | "bad" }) {
  return (
    <span
      className={cn(
        "mk-mono inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] uppercase tracking-[0.06em]",
        tone === "ok" && "border-ok/30 bg-okSoft text-ok",
        tone === "bad" && "border-danger/25 bg-dangerSoft text-danger",
        tone === "neutral" && "border-line bg-white text-ink-muted",
      )}
    >
      {children}
    </span>
  );
}

export function CraftBento() {
  return (
    <section className="mk-shell pb-8 pt-28" aria-labelledby="craft-title">
      <div className="max-w-[760px]">
        <Eyebrow>The craft</Eyebrow>
        <h2 id="craft-title" className="mk-h2 mk-two-tone mt-5">
          Translated like an editor would. <span>Lettered like a pro would.</span>
        </h2>
        <p className="mt-5 max-w-[56ch] text-pretty text-[16px] leading-[1.6] text-ink-muted">
          Overset doesn’t swap words. It reads the scene, keeps each voice, picks the phrase a reader expects, and sets it in the bubble the way a letterer
          would. Every line stays editable and reviewed by you.
        </p>
      </div>

      <div className="mt-12 grid gap-4 lg:grid-cols-6">
        {/* Word choice */}
        <article className="mk-card p-7 lg:col-span-4">
          <div className="flex items-center justify-between gap-3">
            <Tag><BookMarked size={12} aria-hidden /> Word choice</Tag>
            <span className="mk-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-faint">Page 12 · Jin Seo</span>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div>
              <p className="mk-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-faint">Literal</p>
              <p className="mt-2 text-[18px] leading-snug text-ink-muted line-through decoration-danger/40 decoration-2">
                You promised. To go together until the end.
              </p>
              <p className="mt-3 font-kr text-[13px] text-ink-faint" lang="ko">약속했잖아. 끝까지 같이 가기로.</p>
            </div>
            <ArrowRight className="hidden text-accent md:block" size={22} aria-hidden />
            <div className="rounded-2xl border border-accent/20 bg-accent-soft/60 p-5">
              <p className="mk-mono text-[10.5px] uppercase tracking-[0.08em] text-accent-strong">Overset</p>
              <p className="mt-2 text-[22px] font-semibold leading-[1.15] tracking-[-0.01em] text-ink">
                You promised.
                <br />
                <span className="mk-typed inline-block">We’d see this through together.</span>
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Tag tone="ok"><Check size={11} aria-hidden /> Meaning kept</Tag>
            <Tag tone="ok"><Check size={11} aria-hidden /> Speaker’s voice kept</Tag>
            <Tag tone="ok"><Check size={11} aria-hidden /> Reads in one breath</Tag>
          </div>
        </article>

        {/* Voice memory */}
        <article className="mk-card mk-card-dark p-7 lg:col-span-2">
          <Tag><Lock size={12} aria-hidden /> Locked terms</Tag>
          <p className="mt-6 text-[22px] font-semibold leading-[1.15] tracking-[-0.01em]">
            One name. One translation. Every chapter.
          </p>
          <ul className="mt-6 space-y-2.5">
            {[
              ["천공문", "Sky Gate"],
              ["진서", "Jin Seo"],
              ["E급 헌터", "E-Rank Hunter"],
            ].map(([from, to]) => (
              <li key={from} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <span className="font-kr text-[14px] text-white/60" lang="ko">{from}</span>
                <span className="flex items-center gap-2 text-[14px] font-medium">
                  <ArrowRight size={13} className="text-accent" aria-hidden /> {to}
                </span>
              </li>
            ))}
          </ul>
        </article>

        {/* Placement */}
        <article className="mk-card p-7 lg:col-span-3">
          <Tag><Type size={12} aria-hidden /> Placement</Tag>
          <p className="mt-5 text-[22px] font-semibold leading-[1.15] tracking-[-0.01em]">Lines break where the sentence breathes.</p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <figure className="m-0 flex flex-col items-center gap-3">
              <Bubble tone="bad" lines={["We have to go", "before the gate", "opens!"]} className="!max-w-[190px]" />
              <figcaption className="text-center text-[12px] text-ink-faint">Stranded last line</figcaption>
            </figure>
            <figure className="m-0 flex flex-col items-center gap-3">
              <Bubble lines={["We have to go", "before the", "gate opens!"]} className="!max-w-[190px]" />
              <figcaption className="text-center text-[12px] text-ink-muted">Even lines, phrase breaks</figcaption>
            </figure>
          </div>
        </article>

        {/* Lettering */}
        <article className="mk-card p-7 lg:col-span-3">
          <Tag><Type size={12} aria-hidden /> Lettering</Tag>
          <p className="mt-5 text-[22px] font-semibold leading-[1.15] tracking-[-0.01em]">The type follows the original’s voice.</p>
          <dl className="mt-6 grid grid-cols-2 gap-3">
            {[
              ["Narration", "The gate had stood for a thousand years.", "font-serif text-[15px] leading-snug"],
              ["Speech", "You’re late.", "font-archivo text-[20px] font-semibold uppercase"],
              ["Shout", "Go! Now!", "font-narrow text-[24px] font-bold italic uppercase"],
              ["Whisper", "…don’t look back.", "text-[17px] italic text-ink-muted [font-family:'Comic_Neue',cursive]"],
            ].map(([label, sample, cls]) => (
              <div key={label} className="rounded-xl border border-line bg-mk-page px-4 py-3.5">
                <dt className="mk-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">{label}</dt>
                <dd className={cn("m-0 mt-1.5 text-ink", cls)}>{sample}</dd>
              </div>
            ))}
          </dl>
        </article>
      </div>
    </section>
  );
}
