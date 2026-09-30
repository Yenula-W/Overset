"use client";

import * as React from 'react';
import { ArrowDown, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { Segmented, UploadBar } from './mk';
import { PanelArtFour, PanelArtOne, PanelArtThree, PanelArtTwo } from './paper-art';
import { useDeskScroll } from './use-desk-scroll';

type Lang = 'EN' | 'ES' | 'FR' | 'PT';

const LANGS: Record<Lang, [string, string, string, string]> = {
  EN: ['WHAT ARE YOU DOING HERE?', "YOU PROMISED. WE'D SEE THIS THROUGH TOGETHER.", '…YOU’RE LATE.', 'WE HAVE TO GO BEFORE THE GATE OPENS!'],
  ES: ['¿QUÉ HACES AQUÍ?', 'LO PROMETISTE. HASTA EL FINAL, JUNTOS.', '…LLEGAS TARDE.', '¡HAY QUE IRNOS ANTES DE QUE SE ABRA LA PUERTA!'],
  FR: ['QU’EST-CE QUE TU FAIS LÀ ?', 'TU AVAIS PROMIS. JUSQU’AU BOUT, ENSEMBLE.', '…T’ES EN RETARD.', 'ON DOIT PARTIR AVANT QUE LA PORTE S’OUVRE !'],
  PT: ['O QUE VOCÊ ESTÁ FAZENDO AQUI?', 'VOCÊ PROMETEU. ATÉ O FIM, JUNTOS.', '…VOCÊ ESTÁ ATRASADO.', 'TEMOS QUE IR ANTES QUE O PORTÃO ABRA!'],
};

/** Uppercase lettering → sentence case for the side card. */
const sentence = (s: string) =>
  s.toLowerCase()
    .replace(/^(\P{L}*)(\p{L})/u, (_m, prefix: string, letter: string) => prefix + letter.toUpperCase())
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


export function Hero() {
  const section = React.useRef<HTMLElement>(null);
  const [lang, setLang] = React.useState<Lang>('EN');
  const [step, setStep] = React.useState(-1);
  useDeskScroll(section, setStep);

  return (
    <section ref={section} className="scroll-hero" aria-label="Watch Overset translate a chapter">
      <div className="scroll-stage">
        <div className="scroll-progress" aria-hidden><div className="scroll-progress-fill" /></div>
        <div className="scroll-intro">
          <h1>Stop translating<br />bubble by bubble.</h1>
          <div className="scroll-intro-copy">
            <p className="scroll-lede">Upload your chapter. Overset detects, translates, cleans, and typesets every panel while preserving context, character voice, and the original artwork.</p>
            <UploadBar />
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[12px] text-ink-muted">Translate into</span>
              <Segmented label="Target language" value={lang} onChange={setLang} items={(Object.keys(LANGS) as Lang[]).map(code => ({ id: code, label: code }))} />
            </div>
          </div>
        </div>

        <div className="scroll-desk" aria-hidden>
          {/* Static raster layer: only its parent transform and opacity animate. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marketing/desk-studio.webp" width={1536} height={1024} alt="" fetchPriority="high" decoding="async" />
        </div>

        <div className="scroll-paper" role="img" aria-label={`Fictional comic page, ${step >= 3 ? 'translated' : step === 2 ? 'cleaned' : 'Korean source'} lettering`}>
          <div className="absolute left-3.5 right-3.5 top-3.5 flex justify-between font-mono text-[10px] tracking-[0.08em] text-ink-muted">
            <span>CH. 28 · P. 14</span><span>KO → {lang}</span>
          </div>
          {PANELS.map(({ Art, ...position }, index) => <div key={index} className="absolute overflow-hidden border-2 border-ink" style={position}><Art /></div>)}
          {BUBBLES.map((bubble, index) => (
            <div key={bubble.label} className="absolute grid place-items-center rounded-[50%] border-2 border-ink bg-white text-center"
              style={{left: bubble.left, top: bubble.top, width: bubble.width, height: bubble.height, padding: bubble.padding}}>
              <div data-detection className="absolute -inset-2 rounded-lg border-[1.5px] border-dashed border-accent opacity-0" aria-hidden>
                <span className="absolute -top-[9px] left-2 bg-accent px-[5px] py-0.5 font-mono text-[9px] font-semibold text-white">{bubble.label}</span>
              </div>
              <span data-source lang="ko" aria-hidden={step >= 2} className="font-kr font-bold" style={{gridArea:'1/1',fontSize:bubble.koreanSize,lineHeight:1.3}}>{bubble.korean}</span>
              <span data-target lang={lang.toLowerCase()} aria-hidden={step < 3} className="font-narrow font-bold opacity-0" style={{gridArea:'1/1',fontSize:bubble.targetSize,lineHeight:1.15}}>{LANGS[lang][index]}</span>
            </div>
          ))}
        </div>

        <div className="scroll-hint" aria-hidden><span className="scroll-hint-line" /><span>SCROLL TO TRANSLATE THE PAGE</span><ArrowDown size={14} /></div>
        <a href="#how-it-works" className="scroll-skip">Skip animation <ArrowDown size={12} aria-hidden /></a>

        <ol className="scroll-rail" aria-label="Translation pipeline" aria-hidden={step < 0}>
          <li className="mb-7 text-[10px] font-semibold tracking-[0.16em] text-ink-muted">ONE PAGE. EVERY STEP.</li>
          {STEPS.map(([number,label,description], index) => (
            <li key={number} aria-current={step === index ? 'step' : undefined} className="scroll-step" data-active={step === index} data-complete={step > index}>
              <span className="scroll-step-number">{step > index ? <Check size={13} aria-label="Complete" /> : number}</span>
              <div><p className="scroll-step-label">{label}</p><p className="scroll-step-description">{description}</p></div>
            </li>
          ))}
        </ol>

        <div className="scroll-mobile-step" aria-live="polite" aria-atomic="true">{step >= 0 ? `${STEPS[step][0]} / ${STEPS[step][1]}` : 'A chapter, in another language.'}</div>

        <aside className="scroll-inspector" aria-label="Demo translations" aria-hidden={step < 1}>
          <div className="flex justify-between border-b border-line px-[18px] py-3.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-ink-muted"><span>TRANSLATION REVIEW</span><span>KO → {lang}</span></div>
          {BUBBLES.map((bubble, index) => (
            <div key={bubble.label} className="flex flex-col gap-1.5 border-b border-line px-[18px] py-3.5 last:border-0">
              <span className="text-[11px] text-ink-muted">{String(index+1).padStart(2,'0')} · {bubble.speaker}</span>
              <span lang="ko" className="font-kr text-[13px] font-medium">{bubble.koreanFlat}</span>
              <span data-proposal lang={lang.toLowerCase()} className="text-[14px] font-medium text-accent-strong opacity-0">{sentence(LANGS[lang][index])}</span>
            </div>
          ))}
          <div className="bg-[#f8f8f4] px-[18px] py-3 text-[11px] text-ink-muted">Character voice · Previous dialogue · Glossary</div>
        </aside>

        <div className="scroll-finish">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] sm:text-[14px]">Same artwork. Same panels. <span className="text-accent-strong">Different language.</span></p>
          <Link href="/signup" className="mt-2 inline-flex min-h-9 items-center gap-2 text-[12px] font-medium text-ink-muted hover:text-ink">Try your own chapter <ArrowRight size={13} aria-hidden /></Link>
        </div>
        <span className="scroll-demo-label">FICTIONAL DEMO · ORIGINAL ARTWORK</span>
      </div>
    </section>
  );
}
