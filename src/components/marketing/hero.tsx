"use client";

import * as React from "react";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { Segmented, UploadBar } from "./mk";
import {
  PanelArtFour,
  PanelArtOne,
  PanelArtThree,
  PanelArtTwo,
} from "./paper-art";
import { useDeskScroll } from "./use-desk-scroll";

import { setHeroLanguage, useHeroLanguage, type Lang } from "./hero-language";

const LANGS: Record<Lang, [string, string, string, string]> = {
  EN: [
    "WHAT ARE YOU DOING HERE?",
    "YOU PROMISED. WE'D SEE THIS THROUGH TOGETHER.",
    "…YOU’RE LATE.",
    "WE HAVE TO GO BEFORE THE GATE OPENS!",
  ],
  ES: [
    "¿QUÉ HACES AQUÍ?",
    "LO PROMETISTE. HASTA EL FINAL, JUNTOS.",
    "…LLEGAS TARDE.",
    "¡HAY QUE IRNOS ANTES DE QUE SE ABRA LA PUERTA!",
  ],
  FR: [
    "QU’EST-CE QUE TU FAIS LÀ ?",
    "TU AVAIS PROMIS. JUSQU’AU BOUT, ENSEMBLE.",
    "…T’ES EN RETARD.",
    "ON DOIT PARTIR AVANT QUE LA PORTE S’OUVRE !",
  ],
  PT: [
    "O QUE VOCÊ ESTÁ FAZENDO AQUI?",
    "VOCÊ PROMETEU. ATÉ O FIM, JUNTOS.",
    "…VOCÊ ESTÁ ATRASADO.",
    "TEMOS QUE IR ANTES QUE O PORTÃO ABRA!",
  ],
};

const STEPS = [
  ["Detect", "Find each text region"],
  ["Translate", "Read the dialogue in context"],
  ["Clean", "Remove the source lettering"],
  ["Typeset", "Fit the original bubbles"],
  ["Export", "Keep the original dimensions"],
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
  speaker: "Minseo" | "Jin Seo";
  label: string;
}

const BUBBLES: BubbleDef[] = [
  {
    left: 26,
    top: 52,
    width: 184,
    height: 84,
    padding: "8px 22px",
    korean: "여기서 뭐 하는 거야?",
    koreanFlat: "여기서 뭐 하는 거야?",
    koreanSize: 15,
    targetSize: 12.5,
    speaker: "Minseo",
    label: "01 DIALOGUE",
  },
  {
    left: 22,
    top: 256,
    width: 174,
    height: 100,
    padding: "10px 20px",
    korean: (
      <>
        약속했잖아.
        <br />
        끝까지 같이 가기로.
      </>
    ),
    koreanFlat: "약속했잖아. 끝까지 같이 가기로.",
    koreanSize: 14,
    targetSize: 12,
    speaker: "Jin Seo",
    label: "02 DIALOGUE",
  },
  {
    left: 296,
    top: 262,
    width: 100,
    height: 58,
    padding: "6px 12px",
    korean: "…늦었어.",
    koreanFlat: "…늦었어.",
    koreanSize: 15,
    targetSize: 12,
    speaker: "Minseo",
    label: "03",
  },
  {
    left: 190,
    top: 440,
    width: 204,
    height: 96,
    padding: "10px 24px",
    korean: (
      <>
        문이 열리기 전에
        <br />
        가야 해!
      </>
    ),
    koreanFlat: "문이 열리기 전에 가야 해!",
    koreanSize: 15,
    targetSize: 12,
    speaker: "Jin Seo",
    label: "04 DIALOGUE",
  },
];

const PANELS = [
  { left: 14, top: 38, width: 392, height: 196, Art: PanelArtOne },
  { left: 14, top: 244, width: 189, height: 172, Art: PanelArtTwo },
  { left: 213, top: 244, width: 193, height: 172, Art: PanelArtThree },
  { left: 14, top: 426, width: 392, height: 160, Art: PanelArtFour },
];

export function Hero() {
  const section = React.useRef<HTMLElement>(null);
  const lang = useHeroLanguage();
  const [step, setStep] = React.useState(-1);
  useDeskScroll(section, setStep);

  return (
    <section
      ref={section}
      className="scroll-hero"
      aria-label="Watch Overset translate a chapter"
    >
      <div className="scroll-stage">
        <div className="scroll-progress" aria-hidden>
          <div className="scroll-progress-fill" />
        </div>
        <div className="scroll-intro">
          <h1>
            Stop translating
            <br />
            bubble by bubble.
          </h1>
          <div className="scroll-intro-copy">
            <p className="scroll-lede">
              Translate your chapter. Keep the artwork.
            </p>
            <UploadBar />
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                label="Target language"
                value={lang}
                onChange={setHeroLanguage}
                items={(Object.keys(LANGS) as Lang[]).map((code) => ({
                  id: code,
                  label: code,
                }))}
              />
            </div>
          </div>
        </div>

        <div className="scroll-desk" aria-hidden>
          {/* Static raster layer: only its parent transform and opacity animate. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/marketing/desk-studio.webp"
            width={1536}
            height={1024}
            alt=""
            fetchPriority="high"
            decoding="async"
          />
        </div>

        <div
          className="scroll-paper"
          role="img"
          aria-label={`Fictional comic page, ${step >= 3 ? "translated" : step === 2 ? "cleaned" : "Korean source"} lettering`}
        >
          {PANELS.map(({ Art, ...position }, index) => (
            <div
              key={index}
              className="absolute overflow-hidden border-2 border-ink"
              style={position}
            >
              <Art />
            </div>
          ))}
          {BUBBLES.map((bubble, index) => (
            <div
              key={bubble.label}
              data-bubble
              className="absolute rounded-[50%] border-2 border-ink bg-white text-center"
              style={{
                left: bubble.left,
                top: bubble.top,
                width: bubble.width,
                height: bubble.height,
              }}
            >
              <div data-detection className="scroll-detection" aria-hidden>
                <span className="scroll-chip">
                  KO <ArrowRight size={9} strokeWidth={2.5} /> {lang}
                </span>
              </div>
              <div
                data-source
                className="scroll-layer"
                style={{ padding: bubble.padding }}
              >
                <span
                  lang="ko"
                  aria-hidden={step >= 2}
                  className="font-kr font-bold"
                  style={{ fontSize: bubble.koreanSize, lineHeight: 1.3 }}
                >
                  {bubble.korean}
                </span>
              </div>
              <div
                data-target
                className="scroll-layer"
                style={{ padding: bubble.padding }}
              >
                <span
                  lang={lang.toLowerCase()}
                  aria-hidden={step < 3}
                  className="font-narrow font-bold"
                  style={{ fontSize: bubble.targetSize, lineHeight: 1.15 }}
                >
                  {LANGS[lang][index]}
                </span>
              </div>
              <div data-wipe className="scroll-wipe" aria-hidden />
            </div>
          ))}
          <div className="scroll-scan" aria-hidden />
        </div>

        <ol
          className="scroll-rail"
          aria-label="Translation workflow"
          aria-hidden={step < 0}
        >
          {STEPS.map(([label, description], index) => (
            <li
              key={label}
              className="scroll-step"
              data-active={step === index}
              data-complete={step > index}
              aria-current={step === index ? "step" : undefined}
            >
              <span className="scroll-step-number">
                {step > index ? (
                  <Check size={13} aria-label="Complete" />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </span>
              <div>
                <p className="scroll-step-label">{label}</p>
                <p className="scroll-step-description">{description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div
          className="scroll-mobile-step"
          aria-live="polite"
          aria-atomic="true"
        >
          {step >= 0 ? STEPS[step][0] : ""}
        </div>

        <div className="scroll-finish">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] sm:text-[14px]">
            Same artwork.{" "}
            <span className="text-accent-strong">Different language.</span>
          </p>
          <Link
            href="/signup"
            className="mt-2 inline-flex min-h-9 items-center gap-2 text-[12px] font-medium text-ink-muted hover:text-ink"
          >
            Try your own chapter <ArrowRight size={13} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
