'use client';

import * as React from 'react';
import { Segmented, UploadBar } from './mk';
import { PanelArtFour, PanelArtOne, PanelArtThree, PanelArtTwo } from './paper-art';

/**
 * Home hero: a scroll-driven scene. The camera zooms from a desk onto a manhwa
 * page, the page tilts up to face the reader, and its bubbles are detected,
 * translated, cleaned, and typeset.
 *
 * Per-frame values are written straight to refs; only the few values that
 * change which elements render (step, wide, compact) live in React state.
 * Fades are pure CSS driven by the `--p` custom property on the stage.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Lang = 'EN' | 'ES' | 'FR' | 'PT';

const LANGS: Record<Lang, [string, string, string, string]> = {
  EN: ['WHAT ARE YOU DOING HERE?', "YOU PROMISED. WE'D SEE THIS THROUGH TOGETHER.", '…YOU’RE LATE.', 'WE HAVE TO GO BEFORE THE GATE OPENS!'],
  ES: ['¿QUÉ HACES AQUÍ?', 'LO PROMETISTE. HASTA EL FINAL, JUNTOS.', '…LLEGAS TARDE.', '¡HAY QUE IRNOS ANTES DE QUE SE ABRA LA PUERTA!'],
  FR: ['QU’EST-CE QUE TU FAIS LÀ ?', 'TU AVAIS PROMIS. JUSQU’AU BOUT, ENSEMBLE.', '…T’ES EN RETARD.', 'ON DOIT PARTIR AVANT QUE LA PORTE S’OUVRE !'],
  PT: ['O QUE VOCÊ ESTÁ FAZENDO AQUI?', 'VOCÊ PROMETEU. ATÉ O FIM, JUNTOS.', '…VOCÊ ESTÁ ATRASADO.', 'TEMOS QUE IR ANTES QUE O PORTÃO ABRA!'],
};

/** Uppercase lettering → sentence case for the side card. */
const sentence = (s: string) =>
  s.charAt(0) +
  s
    .slice(1)
    .toLowerCase()
    .replace(/([.!?¡¿…]\s+)(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase())
    .replace(/\bjin seo\b/gi, 'Jin Seo');

const STEPS: Array<[string, string, string]> = [
  ['01', 'Detect', 'Find every text region'],
  ['02', 'Translate', 'With chapter and character context'],
  ['03', 'Clean', 'Remove only the original text'],
  ['04', 'Typeset', 'Fit it back into the same bubble'],
  ['05', 'Export', 'At the original dimensions'],
];

interface BubbleDef {
  left: number;
  top: number;
  width: number;
  height: number;
  padding: string;
  korean: React.ReactNode;
  koreanFlat: string;
  koreanSize: number;
  targetSize: number;
  speaker: 'Minseo' | 'Jin Seo';
  label: string;
}

const BUBBLES: BubbleDef[] = [
  { left: 26, top: 52, width: 184, height: 84, padding: '8px 22px', korean: '여기서 뭐 하는 거야?', koreanFlat: '여기서 뭐 하는 거야?', koreanSize: 15, targetSize: 12.5, speaker: 'Minseo', label: '01 DIALOGUE' },
  { left: 22, top: 256, width: 174, height: 100, padding: '10px 20px', korean: <>약속했잖아.<br />끝까지 같이 가기로.</>, koreanFlat: '약속했잖아. 끝까지 같이 가기로.', koreanSize: 14, targetSize: 12, speaker: 'Jin Seo', label: '02 DIALOGUE' },
  { left: 296, top: 262, width: 100, height: 58, padding: '6px 12px', korean: '…늦었어.', koreanFlat: '…늦었어.', koreanSize: 15, targetSize: 12, speaker: 'Minseo', label: '03' },
  { left: 190, top: 440, width: 204, height: 96, padding: '10px 24px', korean: <>문이 열리기 전에<br />가야 해!</>, koreanFlat: '문이 열리기 전에 가야 해!', koreanSize: 15, targetSize: 12, speaker: 'Jin Seo', label: '04 DIALOGUE' },
];

const PANELS = [
  { left: 14, top: 38, width: 392, height: 196, Art: PanelArtOne },
  { left: 14, top: 244, width: 189, height: 172, Art: PanelArtTwo },
  { left: 213, top: 244, width: 193, height: 172, Art: PanelArtThree },
  { left: 14, top: 426, width: 392, height: 160, Art: PanelArtFour },
];

// Paper anchor on the desk, in box units, and paper width as a fraction of the box.
const AX = 0.585;
const AY = 0.395;
const PW = 0.13;

/** `opacity` that ramps 0→1 starting at `start` across ~0.03 of progress. */
const fadeIn = (start: number, rate = 33) => `clamp(0, calc((var(--p, 0) - ${start}) * ${rate}), 1)`;
/** `opacity` that ramps 1→0, reaching zero at `end`. */
const fadeOut = (end: number, rate = 33) => `clamp(0, calc((${end} - var(--p, 0)) * ${rate}), 1)`;

export function Hero() {
  const secRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const heroRef = React.useRef<HTMLDivElement>(null);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const scrimRef = React.useRef<HTMLDivElement>(null);
  const paperRef = React.useRef<HTMLDivElement>(null);

  const [lang, setLang] = React.useState<Lang>('EN');
  const [step, setStep] = React.useState(-1);
  const [wide, setWide] = React.useState(true);
  const [compact, setCompact] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);

  // Mirrors of the render-affecting values, read inside the frame loop.
  const live = React.useRef({ step: -1, wide: true, compact: false, reduced: false });

  const update = React.useCallback(() => {
    const sec = secRef.current;
    const stage = stageRef.current;
    const hero = heroRef.current;
    const frame = frameRef.current;
    const box = boxRef.current;
    const paper = paperRef.current;
    if (!sec || !stage || !hero || !frame || !box || !paper) return;

    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const r = sec.getBoundingClientRect();
    const total = Math.max(1, r.height - sh);
    // Reduced motion keeps the static opening frame instead of zooming.
    const p = live.current.reduced ? 0 : clamp01((stage.getBoundingClientRect().top - r.top) / total);
    stage.style.setProperty('--p', p.toFixed(4));

    const e0 = ease(clamp01(p / 0.12));
    const e1 = ease(clamp01((p - 0.12) / 0.36));
    const e2 = ease(clamp01((p - 0.22) / 0.28));

    // Phase 0–0.12: the hero lifts away and the frame opens to full bleed.
    const heroH = hero.offsetHeight;
    hero.style.transform = `translateY(${-e0 * heroH * 0.5}px)`;
    hero.style.opacity = String(1 - clamp01(e0 * 1.4));
    const pad = sw < 700 ? 16 : 32;
    const ft = lerp(heroH, 0, e0);
    const fl = lerp(pad, 0, e0);
    const fb = lerp(pad, 0, e0);
    Object.assign(frame.style, { top: `${ft}px`, left: `${fl}px`, right: `${fl}px`, bottom: `${fb}px` });

    const fw = sw - 2 * fl;
    const fh = Math.max(120, sh - ft - fb);
    const side = Math.min(fh * 1.35, fw * 1.2);
    const bx = (fw - side) / 2;
    const by = (fh - side) / 2;

    // Phase 0.12–0.48: exponential camera zoom onto the paper.
    const fitS = Math.min(1, (sh * 0.84) / 600, (sw - 32) / 420);
    const sT = Math.max(1, (420 * fitS) / (PW * side));
    const s = Math.pow(sT, e1);
    const a0x = fl + bx + AX * side;
    const a0y = ft + by + AY * side;
    const ax = lerp(a0x, sw / 2, e1);
    const ay = lerp(a0y, sh / 2, e1);
    const tx = ax - fl - bx - s * AX * side;
    const ty = ay - ft - by - s * AY * side;
    Object.assign(box.style, {
      width: `${side}px`,
      height: `${side}px`,
      left: `${bx}px`,
      top: `${by}px`,
      transform: `translate(${tx}px,${ty}px) scale(${s})`,
      filter: `blur(${(12 * clamp01((p - 0.24) / 0.24)).toFixed(2)}px)`,
    });
    // The design's 0.6 scrim left the pale inactive step labels unreadable where
    // they cross the blurred monitor; 0.78 keeps the desk visible behind them.
    if (scrimRef.current) scrimRef.current.style.opacity = String(0.78 * clamp01((p - 0.3) / 0.2));

    // The paper lies flat on the desk, then tilts up to face the reader.
    const k = (s * PW * side) / 420;
    paper.style.visibility = 'visible';
    paper.style.transform = `translate(${ax - 210}px,${ay - 300}px) scale(${k}) perspective(1100px) rotateX(${72 * (1 - e2)}deg) rotateZ(${-14 * (1 - e2)}deg)`;

    const nextStep = p < 0.5 ? -1 : p < 0.6 ? 0 : p < 0.72 ? 1 : p < 0.82 ? 2 : p < 0.92 ? 3 : 4;
    const nextWide = sw >= 1100;
    const nextCompact = sw < 760 || sh < 700;
    const cur = live.current;
    if (nextStep !== cur.step) setStep((cur.step = nextStep));
    if (nextWide !== cur.wide) setWide((cur.wide = nextWide));
    if (nextCompact !== cur.compact) setCompact((cur.compact = nextCompact));
  }, []);

  React.useEffect(() => {
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotion = () => {
      live.current.reduced = mq.matches;
      setReduced(mq.matches);
      schedule();
    };
    applyMotion();
    mq.addEventListener('change', applyMotion);

    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule);
    const t = window.setTimeout(update, 300);
    // The hero's height changes once the display font loads.
    document.fonts?.ready.then(update).catch(() => {});

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(t);
      mq.removeEventListener('change', applyMotion);
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
    };
  }, [update]);

  // Layout changes (compact toggles the lede) alter the hero height.
  React.useLayoutEffect(() => {
    update();
  }, [compact, wide, reduced, update]);

  const L = LANGS[lang];

  return (
    <section
      ref={secRef}
      className="relative"
      style={{ height: reduced ? 'calc(100vh - 64px)' : '650vh' }}
      aria-label="Overset translating a manhwa page"
    >
      <div
        ref={stageRef}
        className="sticky top-16 overflow-hidden bg-mk-page"
        style={{ height: 'calc(100vh - 64px)' }}
      >
        {/* Hero block */}
        <div
          ref={heroRef}
          className="absolute left-0 right-0 top-0 mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-x-14 gap-y-6 px-4 pb-7 pt-11 sm:px-8"
        >
          <h1
            className="m-0 font-extrabold uppercase"
            style={{ flex: '1 1 560px', fontSize: 'clamp(36px, min(6.4vw, 10vh), 96px)', lineHeight: 0.94, letterSpacing: '-0.025em' }}
          >
            Stop translating
            <br />
            bubble by bubble.
          </h1>
          <div className="flex max-w-[460px] flex-col gap-4" style={{ flex: '1 1 340px' }}>
            {!compact && (
              <>
                <p className="m-0 text-pretty text-[15px] leading-[1.55] text-ink-muted">
                  Upload your chapter. Overset detects, translates, cleans, and typesets every panel while preserving
                  context, terminology, character voice, and the original artwork.
                </p>
                <UploadBar />
              </>
            )}
            <div className="flex flex-wrap items-center gap-3.5">
              <span className="text-[13px] text-ink-muted">Translate into</span>
              <Segmented
                label="Target language"
                value={lang}
                onChange={setLang}
                items={(Object.keys(LANGS) as Lang[]).map((code) => ({ id: code, label: code }))}
              />
            </div>
          </div>
        </div>

        {/* Frame with the desk */}
        <div ref={frameRef} className="absolute overflow-hidden bg-mk-frame" style={{ top: 340, left: 32, right: 32, bottom: 32 }}>
          <div ref={boxRef} className="absolute left-0 top-0 bg-mk-frame" style={{ width: 600, height: 600, transformOrigin: '0 0' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- transformed by hand every frame; next/image adds nothing here */}
            <img
              src="/marketing/desk.jpeg"
              alt=""
              className="block h-full w-full object-cover"
              style={{
                mixBlendMode: 'multiply',
                filter: 'contrast(1.04) saturate(0.9)',
                // The photo's studio backdrop is not pure white, so its left and
                // right edges show as seams against the frame. Feather them out.
                maskImage: 'linear-gradient(to right, transparent 0%, #000 11%, #000 89%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 11%, #000 89%, transparent 100%)',
              }}
            />
            <MonitorOverlay />
          </div>
          <div ref={scrimRef} className="pointer-events-none absolute inset-0 bg-mk-scrim" style={{ opacity: 0 }} />
          {!reduced && (
            <div
              className="absolute bottom-5 left-5 flex items-center gap-2.5 bg-white px-3.5 py-2.5 text-[12px] font-semibold tracking-[0.08em]"
              style={{ opacity: fadeOut(0.05, 20) }}
              aria-hidden
            >
              SCROLL — WATCH THE PAGE TRANSLATE <span className="text-accent">↓</span>
            </div>
          )}
        </div>

        {/* The manhwa page */}
        <div
          ref={paperRef}
          className="absolute left-0 top-0 z-[3] bg-white"
          style={{
            width: 420,
            height: 600,
            visibility: 'hidden',
            transformOrigin: '50% 50%',
            boxShadow: '0 24px 60px -24px rgba(22,22,22,0.35), 0 2px 6px rgba(22,22,22,0.08)',
          }}
        >
          <div className="absolute left-3.5 right-3.5 top-3.5 flex justify-between font-mono text-[10px] tracking-[0.08em] text-ink-faint">
            <span>CH. 28 · P. 14</span>
            <span>KO → {lang}</span>
          </div>
          {PANELS.map(({ Art, ...pos }, i) => (
            <div key={i} className="absolute overflow-hidden border-2 border-ink" style={pos}>
              <Art />
            </div>
          ))}
          {BUBBLES.map((b, i) => (
            <div
              key={b.label}
              className="absolute grid place-items-center border-2 border-ink bg-white text-center"
              style={{ left: b.left, top: b.top, width: b.width, height: b.height, padding: b.padding, borderRadius: '50%' }}
            >
              <div
                className="absolute rounded-lg border-[1.5px] border-dashed border-accent"
                style={{ inset: -8, opacity: `min(${fadeIn(0.5 + i * 0.02)}, ${fadeOut(0.93)})` }}
                aria-hidden
              >
                <span className="absolute -top-[9px] left-2 bg-accent px-[5px] py-0.5 font-mono text-[9px] font-semibold text-white">
                  {b.label}
                </span>
              </div>
              <span
                lang="ko"
                className="font-kr font-bold"
                style={{ gridArea: '1/1', fontSize: b.koreanSize, lineHeight: 1.3, opacity: fadeOut(0.75 + i * 0.02) }}
              >
                {b.korean}
              </span>
              <span
                lang={lang.toLowerCase()}
                className="font-narrow font-bold"
                style={{ gridArea: '1/1', fontSize: b.targetSize, lineHeight: 1.15, opacity: fadeIn(0.82 + i * 0.02) }}
              >
                {L[i]}
              </span>
            </div>
          ))}
        </div>

        {wide ? (
          <>
            <ol
              className="absolute left-10 top-1/2 z-[4] m-0 flex w-[260px] -translate-y-1/2 list-none flex-col gap-[18px] p-0"
              style={{ opacity: fadeIn(0.47, 25) }}
              aria-label="Pipeline steps"
            >
              {STEPS.map(([n, label, desc], i) => {
                const active = i === step;
                return (
                  <li
                    key={n}
                    aria-current={active ? 'step' : undefined}
                    className="flex items-baseline gap-3.5"
                    style={{ color: active ? '#161616' : '#B8B8B2' }}
                  >
                    <span className="font-mono text-[12px] font-semibold" style={{ color: active ? '#6C63E8' : '#B8B8B2' }}>
                      {n}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="text-[22px] font-extrabold tracking-[-0.01em]">{label}</span>
                      <span className="text-[13px] text-ink-muted transition-opacity" style={{ opacity: active ? 1 : 0 }}>
                        {desc}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div
              className="absolute right-10 top-1/2 z-[4] w-[300px] -translate-y-1/2 border border-line bg-white"
              style={{ opacity: fadeIn(0.58) }}
            >
              <div className="flex justify-between border-b border-line px-[18px] py-3.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-ink-muted">
                <span>TRANSLATION</span>
                <span>KO → {lang}</span>
              </div>
              {BUBBLES.map((b, i) => (
                <div
                  key={b.label}
                  className={`flex flex-col gap-[5px] px-[18px] py-3.5 ${i < BUBBLES.length - 1 ? 'border-b border-line' : ''}`}
                >
                  <span className="text-[11px] text-ink-faint">
                    {String(i + 1).padStart(2, '0')} · {b.speaker}
                  </span>
                  <span lang="ko" className="font-kr text-[14px] font-semibold">
                    {b.koreanFlat}
                  </span>
                  <span
                    lang={lang.toLowerCase()}
                    className="text-[14px] font-medium text-accent-strong"
                    style={{ opacity: fadeIn(0.6 + i * 0.025) }}
                  >
                    {sentence(L[i])}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          step >= 0 && (
            <div className="absolute left-1/2 top-3.5 z-[4] -translate-x-1/2 bg-ink px-3.5 py-2 text-[12px] font-bold tracking-[0.08em] text-white">
              {STEPS[step][0]} {STEPS[step][1].toUpperCase()}
            </div>
          )
        )}

        <div
          className="absolute bottom-[18px] left-0 right-0 z-[4] px-4 text-center text-[14px] font-extrabold tracking-[0.06em]"
          style={{ opacity: fadeIn(0.93, 25) }}
        >
          SAME ARTWORK. SAME PANELS. SAME BUBBLES. <span className="text-accent">DIFFERENT LANGUAGE.</span>
        </div>
      </div>
    </section>
  );
}

/** The mini editor drawn over the desk monitor's screen. */
function MonitorOverlay() {
  return (
    <div
      className="absolute flex overflow-hidden bg-editor-bg"
      style={{ left: '28.2%', top: '23.9%', width: '19.2%', height: '12.9%', gap: '3%', padding: '2.5%' }}
      aria-hidden
    >
      <div className="bg-editor-panel" style={{ width: '10%' }} />
      <div className="flex flex-1 items-center justify-center bg-editor-panel">
        <div className="relative bg-[#F4F3EE]" style={{ height: '88%', aspectRatio: 0.7 }}>
          <div className="absolute rounded-full bg-white outline outline-1 outline-accent" style={{ left: '14%', top: '12%', width: '44%', height: '16%' }} />
          <div className="absolute rounded-full bg-white outline outline-1 outline-accent" style={{ right: '12%', top: '52%', width: '40%', height: '14%' }} />
        </div>
      </div>
      <div className="flex flex-col" style={{ width: '28%', gap: '9%', paddingTop: '4%' }}>
        <div className="bg-accent" style={{ height: '6%', width: '70%' }} />
        <div className="bg-editor-line" style={{ height: '5%' }} />
        <div className="bg-editor-line" style={{ height: '5%', width: '80%' }} />
        <div className="bg-editor-line" style={{ height: '5%', width: '60%' }} />
      </div>
    </div>
  );
}
