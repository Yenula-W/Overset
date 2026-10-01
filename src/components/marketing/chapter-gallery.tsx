"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ComicPage, type PageView } from "@/components/demo/comic-page";
import { DEMO_REGIONS } from "@/lib/data/chapter";

const FRAMES: Array<{ view: PageView; title: string; note: string }> = [
  {
    view: "original",
    title: "The original",
    note: "Start with the chapter as it is.",
  },
  {
    view: "detected",
    title: "Every region",
    note: "Dialogue, narration, and SFX.",
  },
  {
    view: "typeset",
    title: "Another language",
    note: "Back in the same bubbles.",
  },
];

/** Native swipe/snap on touch; expanding page cards on desktop. */
export function ChapterGallery() {
  const [active, setActive] = React.useState(0);
  const gallery = React.useRef<HTMLDivElement>(null);
  const destination = React.useRef<number | null>(null);
  function select(index: number) {
    setActive(index);
    const root = gallery.current;
    if (root && window.matchMedia("(max-width: 699px)").matches) {
      const card = root.children[index] as HTMLElement;
      destination.current = Math.min(
        root.scrollWidth - root.clientWidth,
        Math.max(0, card.offsetLeft - root.offsetLeft),
      );
      root.scrollTo({
        left: destination.current,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    }
  }
  return (
    <section
      className="mk-shell pt-20"
      aria-label="Chapter transformation gallery"
    >
      <div className="mb-7 flex items-end justify-between gap-5">
        <h2 className="mk-h2">The page stays the page.</h2>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="gallery-arrow"
            onClick={() => select((active + 2) % 3)}
            aria-label="Previous chapter state"
          >
            <ArrowLeft size={17} />
          </button>
          <button
            type="button"
            className="gallery-arrow"
            onClick={() => select((active + 1) % 3)}
            aria-label="Next chapter state"
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
      <div
        ref={gallery}
        className="chapter-gallery no-scrollbar"
        onPointerDown={() => {
          destination.current = null;
        }}
        onWheel={() => {
          destination.current = null;
        }}
        onScroll={(e) => {
          const root = e.currentTarget;
          if (destination.current !== null) {
            if (Math.abs(root.scrollLeft - destination.current) < 5)
              destination.current = null;
            return;
          }
          if (window.matchMedia("(max-width: 699px)").matches) {
            const nearest = [...root.children].map((child) =>
              Math.abs(
                (child as HTMLElement).offsetLeft -
                  root.offsetLeft -
                  root.scrollLeft,
              ),
            );
            setActive(nearest.indexOf(Math.min(...nearest)));
          }
        }}
      >
        {FRAMES.map(({ view, title, note }, index) => (
          <button
            key={view}
            type="button"
            className="chapter-gallery-card"
            data-active={active === index}
            aria-pressed={active === index}
            onClick={() => select(index)}
            onMouseEnter={() => {
              if (
                window.matchMedia("(min-width: 700px) and (hover: hover)")
                  .matches
              )
                setActive(index);
            }}
            onFocus={() => setActive(index)}
          >
            <div className="chapter-gallery-art" aria-hidden>
              <ComicPage view={view} regions={DEMO_REGIONS} />
            </div>
            <div className="chapter-gallery-caption">
              <span className="font-mono text-[10px] text-ink-muted">
                0{index + 1}
              </span>
              <span className="text-[20px] font-semibold tracking-[-.025em]">
                {title}
              </span>
              <span className="gallery-note text-[12px] text-ink-muted">
                {note}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
