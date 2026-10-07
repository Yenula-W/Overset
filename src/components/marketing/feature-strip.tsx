'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FileStack, Languages, Layers, ScanText, ShieldCheck, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

const FEATURES = [
  { icon: ScanText, title: 'Smart OCR', body: 'Dialogue, narration, signs and SFX are found and classified separately.', tint: '#EFEEFF' },
  { icon: Languages, title: 'Context translation', body: 'Each line is translated with the chapter, scene and speaker in view.', tint: '#F2EEE6' },
  { icon: Layers, title: 'Layout kept', body: 'Artwork, bubbles and page size come out exactly as they went in.', tint: '#EAF2EC' },
  { icon: Type, title: 'Auto typesetting', body: 'Translations are lettered inside the original bubbles.', tint: '#F9ECEA' },
  { icon: FileStack, title: 'Translation memory', body: 'Approved wording and terms carry over to every chapter.', tint: '#EEF3F8' },
  { icon: ShieldCheck, title: 'Built-in QA', body: 'Terminology drift and missed text are flagged before export.', tint: '#FAF2E6' },
];

/**
 * Panels that widen on hover to reveal their detail. Adapted from Skiper UI's
 * horizontal hover-expand (skiper52). Stacks vertically on small screens.
 */
export function FeatureStrip() {
  const [active, setActive] = React.useState(0);
  const reduced = useReducedMotion();
  return (
    <section className="mk-shell pb-8 pt-20">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-muted">What’s inside</p>
      <h2 className="mk-h2 mt-3 max-w-[16ch]">Everything a chapter needs.</h2>
      <div className="mt-10 flex flex-col gap-2 md:h-[340px] md:flex-row">
        {FEATURES.map((f, i) => {
          const open = active === i;
          return (
            <motion.button
              key={f.title}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-expanded={open}
              layout={!reduced}
              transition={{ type: 'spring', stiffness: 220, damping: 30 }}
              className={cn(
                'relative flex min-h-[72px] flex-col overflow-hidden rounded-2xl border border-line p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 md:min-h-0',
                open ? 'md:flex-[3.2]' : 'md:flex-1',
              )}
              style={{ background: f.tint }}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-accent-strong shadow-[0_1px_2px_rgba(22,22,22,0.06)]">
                <f.icon size={18} aria-hidden />
              </span>
              <span className={cn('mt-auto block pt-5 text-[17px] font-semibold tracking-[-0.01em] text-ink', !open && 'md:[writing-mode:vertical-rl] md:rotate-180 md:pt-0')}>
                {f.title}
              </span>
              <motion.span
                initial={false}
                animate={{ opacity: open ? 1 : 0, height: open ? 'auto' : 0 }}
                transition={{ duration: reduced ? 0 : 0.3, delay: open && !reduced ? 0.12 : 0 }}
                className="block max-w-[34ch] overflow-hidden text-[14px] leading-relaxed text-ink-muted"
              >
                <span className="block pt-2">{f.body}</span>
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
