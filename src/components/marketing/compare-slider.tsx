"use client";

import * as React from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronsLeftRight } from "lucide-react";
import { ComicPage } from "@/components/demo/comic-page";
import { DEMO_REGIONS } from "@/lib/data/chapter";

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/**
 * "Drag to translate": the same demo page twice, Korean underneath and the
 * typeset English on top, with a handle that reveals one over the other.
 * It shows the product's promise (same artwork, different language) with your
 * own hands. Pointer, touch and keyboard all work; on first sight it sweeps
 * once to hint at the interaction, unless the visitor prefers reduced motion.
 */
export function CompareSlider() {
  const reduced = useReducedMotion();
  const frame = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState(50);
  const touched = React.useRef(false);
  const dragging = React.useRef(false);

  // One gentle sweep the first time the slider scrolls into view.
  React.useEffect(() => {
    const el = frame.current;
    if (!el || reduced) return;
    let raf = 0;
    let started = false;
    const sweep = () => {
      const t0 = performance.now();
      const run = (now: number) => {
        if (touched.current) return;
        const t = Math.min(1, (now - t0) / 2600);
        // 50 -> 14 -> 86 -> 50, eased
        const wave = Math.sin(t * Math.PI * 2);
        const eased = wave * (1 - 0.25 * t);
        setPosition(clamp(50 - eased * 36));
        if (t < 1) raf = requestAnimationFrame(run);
        else setPosition(50);
      };
      raf = requestAnimationFrame(run);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          sweep();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const moveTo = (clientX: number) => {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    touched.current = true;
    setPosition(clamp(((clientX - rect.left) / rect.width) * 100));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 15 : 5;
    let next: number | null = null;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = position - step;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = position + step;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = 100;
    if (next === null) return;
    event.preventDefault();
    touched.current = true;
    setPosition(clamp(next));
  };

  return (
    <section className="mk-shell pt-24" aria-labelledby="compare-title">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:gap-20">
        <div>
          <p className="mk-eyebrow m-0 uppercase">Try it</p>
          <h2 id="compare-title" className="mk-h2 mt-3 max-w-[14ch]">
            Drag to translate.
          </h2>
          <p className="mt-5 max-w-[44ch] text-pretty text-[16px] leading-[1.55] text-ink-muted">
            Same panels. Same line art. Same bubbles. Only the language changes, and
            the page keeps its original dimensions.
          </p>
          <ul className="mt-7 grid max-w-[44ch] gap-3 text-[14px] text-ink">
            {[
              "Only the original lettering is removed, never the artwork.",
              "Each line is translated with the chapter and speaker in view.",
              "Every region stays editable before you export.",
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent" />
                {line}
              </li>
            ))}
          </ul>
          <Link href="/signup" className="editorial-link mt-6">
            Try your own chapter <ArrowRight size={15} aria-hidden />
          </Link>
        </div>

        <div className="mx-auto w-full max-w-[540px]">
          <div
            ref={frame}
            role="slider"
            tabIndex={0}
            aria-label="Reveal the translation by dragging left or right"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            aria-valuetext={`${Math.round(position)}% translated`}
            onKeyDown={onKeyDown}
            onPointerDown={(event) => {
              dragging.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              moveTo(event.clientX);
            }}
            onPointerMove={(event) => dragging.current && moveTo(event.clientX)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
            className="relative cursor-ew-resize select-none overflow-hidden rounded-2xl border border-line bg-white shadow-lift outline-none [touch-action:pan-y] focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <ComicPage view="original" regions={DEMO_REGIONS} />
            <div
              className="pointer-events-none absolute inset-0 bg-white"
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
              aria-hidden
            >
              <ComicPage view="typeset" regions={DEMO_REGIONS} />
            </div>

            <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white shadow-card">
              EN · Translated
            </span>
            <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white shadow-card">
              KO · Original
            </span>

            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-px bg-white shadow-[0_0_0_1px_rgba(22,22,22,0.18)]"
              style={{ left: `${position}%` }}
            >
              <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-lift">
                <ChevronsLeftRight size={18} />
              </span>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-ink-faint">Fictional demo chapter</p>
        </div>
      </div>
    </section>
  );
}
