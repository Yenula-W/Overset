'use client';

/**
 * Small motion pieces shared by the marketing site and the workspace.
 * Several are adapted from Skiper UI (skiper-ui.com), credited per component.
 * Every effect stands still for people who ask for reduced motion.
 */

import * as React from 'react';
import NumberFlow from '@number-flow/react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------- count up */

/**
 * A number that counts up from zero the first time it scrolls into view,
 * then animates between later values. Adapted from Skiper UI (skiper37).
 */
export function CountUp({ value, className, suffix }: { value: number; className?: string; suffix?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setSeen(true), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return (
    <span ref={ref} className={className}>
      <NumberFlow value={seen || reduced ? value : 0} suffix={suffix} animated={!reduced} willChange />
    </span>
  );
}

/* ------------------------------------------------------------ spotlight */

/** Pointer handler that lets `.fx-spotlight` paint a soft glow under the cursor. */
export function trackSpotlight(event: React.PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
}

/* ------------------------------------------------------------- magnetic */

/**
 * Pulls its child a few pixels toward the cursor, springing back on leave.
 * Adapted from Skiper UI's spring mouse-follow (skiper61).
 */
export function Magnetic({ children, strength = 0.25, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const reduced = useReducedMotion();
  const x = useSpring(0, { stiffness: 260, damping: 18, mass: 0.4 });
  const y = useSpring(0, { stiffness: 260, damping: 18, mass: 0.4 });
  if (reduced) return <span className={cn('inline-flex', className)}>{children}</span>;
  return (
    <motion.span
      className={cn('inline-flex', className)}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/* ---------------------------------------------------------- scroll fade */

/**
 * A scrolling container whose top and bottom edges fade out while there is
 * more to scroll. Adapted from Skiper UI (skiper87).
 */
export function ScrollFade({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ top: false, bottom: false });
  const update = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ top: el.scrollTop > 2, bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 2 });
  }, []);
  React.useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);
  const top = edges.top ? 'transparent, #000 28px' : '#000, #000';
  const bottom = edges.bottom ? '#000 calc(100% - 28px), transparent' : '#000, #000';
  const mask = `linear-gradient(to bottom, ${top}, ${bottom})`;
  return (
    <div ref={ref} onScroll={update} className={className} style={{ maskImage: mask, WebkitMaskImage: mask }} {...props}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------ progressive blur */

/** A strip that blurs content progressively as it slides under a bar. Adapted from Skiper UI (skiper41). */
export function ProgressiveBlur({ className, height = 28, color = '#FBFBF9', position = 'top' }: { className?: string; height?: number; color?: string; position?: 'top' | 'bottom' }) {
  const toward = position === 'top' ? 'to bottom' : 'to top';
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none select-none', className)}
      style={{
        height,
        background: `linear-gradient(${toward}, ${color}, transparent)`,
        maskImage: `linear-gradient(${toward}, #000 40%, transparent)`,
        WebkitMaskImage: `linear-gradient(${toward}, #000 40%, transparent)`,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    />
  );
}

/* ---------------------------------------------------- scroll progress dial */

/**
 * A small ring in the corner that fills as you read and takes you back to
 * the top when clicked. Adapted from Skiper UI (skiper89).
 */
export function ScrollProgressDial() {
  const { scrollYProgress } = useScroll();
  const reduced = useReducedMotion();
  const ring = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  const [percent, setPercent] = React.useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setPercent(Math.round(Math.min(1, Math.max(0, v)) * 100)));
  const r = 18;
  return (
    <motion.button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}
      aria-label={`${percent}% read. Back to top`}
      initial={false}
      animate={{ opacity: percent > 4 ? 1 : 0, scale: percent > 4 ? 1 : 0.8 }}
      style={{ pointerEvents: percent > 4 ? 'auto' : 'none' }}
      className="group fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-2xl border border-line bg-white/80 text-accent shadow-card backdrop-blur"
    >
      <svg className="size-10" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r={r} stroke="currentColor" strokeWidth="3" fill="none" className="opacity-15" />
        <motion.circle cx="24" cy="24" r={r} stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" style={{ pathLength: reduced ? scrollYProgress : ring, rotate: -90, transformOrigin: '50% 50%' }} />
      </svg>
      <span className="absolute text-[10px] font-semibold tabular-nums text-ink transition-opacity group-hover:opacity-0">{percent}</span>
      <ArrowUp size={14} className="absolute text-ink opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
    </motion.button>
  );
}

/* ---------------------------------------------------------- page enter */

/** Fades and lifts a page in when it opens. */
export function PageEnter({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
