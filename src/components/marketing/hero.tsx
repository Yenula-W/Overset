import { ArrowDown, ArrowRight, Check } from 'lucide-react';
import { MkButton } from './mk';
import { ChapterDemo } from './chapter-demo';

/** Normal document flow keeps the product and calls to action visible at every size. */
export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="home-hero mk-shell pb-10 pt-10 sm:pt-14 lg:pb-16 lg:pt-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12 xl:gap-20">
        <div className="max-w-[650px] lg:py-8">
          <p className="mb-6 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden /> A new chapter in comic translation
          </p>
          <h1
            id="hero-heading"
            className="m-0 text-[clamp(42px,6.3vw,88px)] font-bold leading-[0.98] tracking-[-0.055em]"
          >
            Same artwork.
            <br />
            <span className="text-accent-strong">New language.</span>
          </h1>
          <p className="mb-0 mt-7 max-w-[420px] text-pretty text-[17px] leading-[1.65] text-ink-muted">
            Translate the story. Keep every panel, expression, and speech bubble intact. Your entire chapter, in one
            workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <MkButton href="/signup" className="min-h-12 rounded-md px-5">
              Translate a chapter free <ArrowRight size={16} aria-hidden />
            </MkButton>
            <a
              href="#how-it-works"
              className="inline-flex min-h-12 items-center gap-2 px-3 text-[14px] font-medium text-ink-muted transition-colors hover:text-ink"
            >
              See how it works <ArrowDown size={14} aria-hidden />
            </a>
          </div>
          <p className="mt-4 text-[12px] text-ink-muted">
            30 pages free <span className="mx-2 text-line">/</span> No credit card required
          </p>
          <div className="mt-16 hidden max-w-[420px] border-t border-line pt-5 lg:block">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Made for the way you translate
            </p>
            <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-[12px] text-ink-muted">
              {['Story-aware translation', 'Editable at every step', 'Original resolution'].map((label) => (
                <li key={label} className="flex items-center gap-1.5">
                  <Check size={12} className="text-accent" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[580px] lg:mx-0">
          <ChapterDemo />
        </div>
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-b border-t border-line py-5 text-[11px] sm:mt-16">
        <span className="font-semibold uppercase tracking-[0.12em] text-ink-muted">Built for stories that travel</span>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-[13px] font-medium">
          <span>Manhwa</span>
          <span>Manga</span>
          <span>Webtoons</span>
          <span>Comics</span>
        </div>
        <span className="font-mono text-[10px] text-ink-muted">SAME PANELS. MORE READERS.</span>
      </div>
    </section>
  );
}
