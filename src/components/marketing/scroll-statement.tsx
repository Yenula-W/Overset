"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

const LINES = ["Read like it was", "drawn in English."];

/** Each letter starts fanned out and tilted, and settles as the line scrolls in. */
function Letter({
  char,
  offset,
  progress,
}: {
  char: string;
  offset: number;
  progress: MotionValue<number>;
}) {
  const x = useTransform(progress, [0, 1], [offset * 46, 0]);
  const rotateX = useTransform(progress, [0, 1], [offset * 34, 0]);
  const opacity = useTransform(progress, [0, 0.35, 1], [0, 0.35, 1]);
  return (
    <motion.span className="inline-block" style={{ x, rotateX, opacity }}>
      {char === " " ? " " : char}
    </motion.span>
  );
}

/**
 * A single pinned statement between the hero and the workflow. Adapted from
 * Skiper UI's scroll text animation (skiper31).
 */
export function ScrollStatement() {
  const section = React.useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start end", "end end"],
  });
  const progress = useTransform(scrollYProgress, [0.15, 0.85], [0, 1], {
    clamp: true,
  });

  return (
    <section ref={section} className="statement" data-motion={reduced ? "reduced" : "full"}>
      <div className="statement-stage">
        <p className="statement-eyebrow">Overset keeps the page. You keep the reader.</p>
        <h2 className="statement-text" aria-label={LINES.join(" ")}>
          {LINES.map((line, l) => (
            <span key={l} className="block" aria-hidden>
              {reduced
                ? line
                : line.split("").map((char, i) => (
                    <Letter
                      key={i}
                      char={char}
                      offset={i - (line.length - 1) / 2}
                      progress={progress}
                    />
                  ))}
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
}
