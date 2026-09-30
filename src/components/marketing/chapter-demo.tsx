'use client';

import * as React from 'react';
import { Check, ScanLine } from 'lucide-react';
import { PanelArtFour, PanelArtOne, PanelArtThree, PanelArtTwo } from './paper-art';
import { cn } from '@/lib/utils';

type Lang = 'EN' | 'ES' | 'FR' | 'PT';

const LANGS: Record<Lang, [string, string, string, string]> = {
  EN: [
    'WHAT ARE YOU DOING HERE?',
    "YOU PROMISED. WE'D SEE THIS THROUGH TOGETHER.",
    '…YOU’RE LATE.',
    'WE HAVE TO GO BEFORE THE GATE OPENS!',
  ],
  ES: [
    '¿QUÉ HACES AQUÍ?',
    'LO PROMETISTE. HASTA EL FINAL, JUNTOS.',
    '…LLEGAS TARDE.',
    '¡HAY QUE IRNOS ANTES DE QUE SE ABRA LA PUERTA!',
  ],
  FR: [
    'QU’EST-CE QUE TU FAIS LÀ ?',
    'TU AVAIS PROMIS. JUSQU’AU BOUT, ENSEMBLE.',
    '…T’ES EN RETARD.',
    'ON DOIT PARTIR AVANT QUE LA PORTE S’OUVRE !',
  ],
  PT: [
    'O QUE VOCÊ ESTÁ FAZENDO AQUI?',
    'VOCÊ PROMETEU. ATÉ O FIM, JUNTOS.',
    '…VOCÊ ESTÁ ATRASADO.',
    'TEMOS QUE IR ANTES QUE O PORTÃO ABRA!',
  ],
};

/** Uppercase lettering → sentence case for the side card. */
const sentence = (s: string) =>
  s
    .toLowerCase()
    .replace(/^(\P{L}*)(\p{L})/u, (_m, prefix: string, letter: string) => prefix + letter.toUpperCase())
    .replace(/([.!?]\s+)(\p{L})/gu, (_m, prefix: string, letter: string) => prefix + letter.toUpperCase());

interface BubbleDef {
  left: number;
  top: number;
  width: number;
  height: number;
  korean: React.ReactNode;
  koreanSize: number;
  targetSize: number;
  speaker: 'Minseo' | 'Jin Seo';
  label: string;
}

const BUBBLES: BubbleDef[] = [
  {
    left: 26,
    top: 52,
    width: 184,
    height: 84,
    korean: '여기서 뭐 하는 거야?',
    koreanSize: 15,
    targetSize: 12.5,
    speaker: 'Minseo',
    label: '01 DIALOGUE',
  },
  {
    left: 22,
    top: 256,
    width: 174,
    height: 100,
    korean: (
      <>
        약속했잖아.
        <br />
        끝까지 같이 가기로.
      </>
    ),
    koreanSize: 14,
    targetSize: 12,
    speaker: 'Jin Seo',
    label: '02 DIALOGUE',
  },
  {
    left: 296,
    top: 262,
    width: 100,
    height: 58,
    korean: '…늦었어.',
    koreanSize: 15,
    targetSize: 12,
    speaker: 'Minseo',
    label: '03',
  },
  {
    left: 190,
    top: 440,
    width: 204,
    height: 96,
    korean: (
      <>
        문이 열리기 전에
        <br />
        가야 해!
      </>
    ),
    koreanSize: 15,
    targetSize: 12,
    speaker: 'Jin Seo',
    label: '04 DIALOGUE',
  },
];

const PANELS = [
  { left: 14, top: 38, width: 392, height: 196, Art: PanelArtOne },
  { left: 14, top: 244, width: 189, height: 172, Art: PanelArtTwo },
  { left: 213, top: 244, width: 193, height: 172, Art: PanelArtThree },
  { left: 14, top: 426, width: 392, height: 160, Art: PanelArtFour },
];

type View = 'original' | 'detected' | 'cleaned' | 'typeset';
const VIEWS: { id: View; label: string; detail: string }[] = [
  { id: 'original', label: 'Original', detail: 'The source page, exactly as drawn.' },
  { id: 'detected', label: 'Detected', detail: 'Four dialogue regions. Every panel stays in place.' },
  { id: 'cleaned', label: 'Cleaned', detail: 'Source lettering removed. Bubbles and artwork preserved.' },
  { id: 'typeset', label: 'Translated', detail: 'New dialogue, fitted into the original bubbles.' },
];

/** A fixed-layout demo: scrolling never measures, transforms, or repaints it. */
export function ChapterDemo() {
  const [view, setView] = React.useState<View>('typeset');
  const [lang, setLang] = React.useState<Lang>('EN');
  const [selected, setSelected] = React.useState(1);
  const tabs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const active = VIEWS.find((item) => item.id === view)!;
  const bubble = BUBBLES[selected];

  function moveTab(event: React.KeyboardEvent, index: number) {
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % VIEWS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + VIEWS.length) % VIEWS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = VIEWS.length - 1;
    else return;
    event.preventDefault();
    setView(VIEWS[next].id);
    tabs.current[next]?.focus();
  }

  return (
    <div className="chapter-demo overflow-hidden rounded-xl border border-line bg-white shadow-[0_20px_70px_-36px_rgba(22,22,22,0.25)]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <span className="flex items-center gap-2 text-[12px] font-semibold">
          <ScanLine size={14} className="text-accent" aria-hidden /> The Fallen Hero
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">Chapter 28 · Demo</span>
      </div>
      <div
        role="tablist"
        aria-label="Comic translation stages"
        className="grid grid-cols-4 border-b border-line bg-[#FAFAF7] px-2"
      >
        {VIEWS.map((item, index) => (
          <button
            key={item.id}
            ref={(el) => {
              tabs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`demo-tab-${item.id}`}
            aria-selected={view === item.id}
            aria-controls="demo-page"
            tabIndex={view === item.id ? 0 : -1}
            onKeyDown={(event) => moveTab(event, index)}
            onClick={() => setView(item.id)}
            className={cn(
              'min-h-11 border-b-2 px-1 text-[12px] font-medium transition-colors',
              view === item.id
                ? 'border-accent text-accent-strong'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        id="demo-page"
        role="tabpanel"
        aria-labelledby={`demo-tab-${view}`}
        tabIndex={0}
        className="demo-stage px-5 py-5 sm:px-8"
      >
        <div
          className="demo-paper relative mx-auto bg-white shadow-[0_4px_18px_rgba(22,22,22,0.10)]"
          aria-label={`Fictional comic page, ${active.label.toLowerCase()} view`}
        >
          <div className="absolute left-[3.33%] right-[3.33%] top-[2.33%] flex justify-between font-mono text-[2.38cqw] tracking-wider text-ink-muted">
            <span>CH. 28 / P. 14</span>
            <span>KO → {lang}</span>
          </div>
          {PANELS.map(({ Art, ...pos }, index) => (
            <div
              key={index}
              aria-hidden
              className="absolute overflow-hidden border-[1.5px] border-ink"
              style={{
                left: `${pos.left / 4.2}%`,
                top: `${pos.top / 6}%`,
                width: `${pos.width / 4.2}%`,
                height: `${pos.height / 6}%`,
              }}
            >
              <Art />
            </div>
          ))}
          {BUBBLES.map((b, index) => (
            <button
              key={b.label}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Dialogue ${index + 1}, ${b.speaker}`}
              aria-pressed={selected === index}
              className={cn(
                'demo-bubble absolute grid place-items-center rounded-[50%] border-[1.5px] border-ink bg-white text-center',
                view === 'detected' && 'demo-detected',
              )}
              style={{
                left: `${b.left / 4.2}%`,
                top: `${b.top / 6}%`,
                width: `${b.width / 4.2}%`,
                height: `${b.height / 6}%`,
                padding: '1.5% 3%',
              }}
            >
              {view === 'detected' && (
                <span
                  aria-hidden
                  className="absolute -top-3 left-0 rounded-sm bg-accent px-1 font-mono text-[2.2cqw] text-white"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              )}
              <span
                lang={view === 'typeset' ? lang.toLowerCase() : 'ko'}
                className={cn('font-bold', view === 'typeset' ? 'font-narrow' : 'font-kr')}
                style={{
                  fontSize: `${(view === 'typeset' ? b.targetSize : b.koreanSize) / 4.2}cqw`,
                  lineHeight: 1.2,
                  visibility: view === 'cleaned' ? 'hidden' : 'visible',
                }}
              >
                {view === 'typeset' ? LANGS[lang][index] : b.korean}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-y border-line px-4 py-2">
        <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <Check size={13} className="text-ok" aria-hidden /> Original layout preserved
        </span>
        <label className="flex items-center gap-2 text-[11px] text-ink-muted">
          KO →
          <select
            aria-label="Demo target language"
            value={lang}
            onChange={(event) => setLang(event.target.value as Lang)}
            className="min-h-9 rounded border border-line bg-white px-2 text-[12px] font-semibold text-ink"
          >
            {Object.keys(LANGS).map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="min-h-[100px] px-4 py-3" aria-live="polite" aria-atomic="true">
        <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-ink-muted">
          <span>
            {bubble.speaker} · Dialogue {String(selected + 1).padStart(2, '0')}
          </span>
          <span className="normal-case tracking-normal">Select a bubble</span>
        </div>
        <p className="m-0 text-[14px] font-medium" lang={lang.toLowerCase()}>
          {sentence(LANGS[lang][selected])}
        </p>
        <p className="mb-0 mt-1 text-[11px] text-ink-muted">{active.detail}</p>
      </div>
    </div>
  );
}
