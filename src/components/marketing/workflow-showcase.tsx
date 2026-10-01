"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, FileStack, Upload } from "lucide-react";
import { PanelArtOne } from "./paper-art";

const STEPS = ["Upload", "Translate", "Review & export"];

/** Original, keyboard-friendly expanding workflow inspired by Skiper galleries. */
export function WorkflowShowcase() {
  const [step, setStep] = React.useState(0);
  return (
    <section id="how-it-works" className="mk-shell pt-24">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <h2 className="mk-h2">One chapter. One workspace.</h2>
        <Link href="/about" className="editorial-link">
          Inside Overset <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
      <div className="workflow-showcase">
        <div className="workflow-selector">
          {STEPS.map((title, i) => (
            <button
              key={title}
              type="button"
              aria-pressed={step === i}
              aria-controls="workflow-preview"
              onClick={() => setStep(i)}
              className="workflow-choice"
              data-active={step === i}
            >
              <span className="font-mono text-[11px]">0{i + 1}</span>
              <span>{title}</span>
              <ArrowRight size={18} aria-hidden />
            </button>
          ))}
        </div>
        <div className="workflow-preview" id="workflow-preview">
          <div className="workflow-window">
            <div className="flex items-center justify-between border-b border-line px-5 py-3 text-[11px] text-ink-muted">
              <span>Chapter 28</span>
              <span>{step === 0 ? "Upload" : "KO → EN"}</span>
            </div>
            <div key={step} className="workflow-content about-demo-reveal">
              {step === 0 ? (
                <>
                  <div className="upload-stack" aria-hidden>
                    <div />
                    <div />
                    <div className="overflow-hidden">
                      <PanelArtOne />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-line bg-white p-4">
                    <FileStack
                      size={18}
                      className="text-ink-muted"
                      aria-hidden
                    />
                    <div className="flex-1">
                      <p className="text-[13px] font-medium">Chapter_28.zip</p>
                      <p className="mt-1 text-[11px] text-ink-muted">
                        46 pages
                      </p>
                    </div>
                    <Check size={17} className="text-ok" aria-label="Ready" />
                  </div>
                  <Link
                    href="/signup"
                    className="editorial-link justify-center text-[12px]"
                  >
                    <Upload size={14} aria-hidden /> Upload your chapter
                  </Link>
                </>
              ) : (
                <>
                  <div className="workflow-panel" aria-hidden>
                    <PanelArtOne />
                    <div className="workflow-bubble">
                      {step === 1
                        ? "여기서 뭐 하는 거야?"
                        : "WHAT ARE YOU DOING HERE?"}
                    </div>
                    {step === 1 && <div className="workflow-detection" />}
                  </div>
                  {step === 1 ? (
                    <div className="rounded-lg border border-line bg-white p-5">
                      <p className="mb-2 text-[11px] text-ink-muted">
                        Suggested translation
                      </p>
                      <p className="text-[20px] font-medium tracking-[-.025em]">
                        What are you doing here?
                      </p>
                      <p className="mt-4 text-[11px] text-ink-muted">
                        Minseo · Chapter context
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border border-line bg-white p-5">
                      <div>
                        <p className="text-[13px] font-medium">
                          Chapter_28_EN.zip
                        </p>
                        <p className="mt-1 text-[11px] text-ink-muted">
                          Original dimensions
                        </p>
                      </div>
                      <Check
                        size={18}
                        className="text-ok"
                        aria-label="Reviewed"
                      />
                    </div>
                  )}
                  {step === 2 && (
                    <Link
                      href="/translate"
                      className="editorial-link justify-center text-[12px]"
                    >
                      Open workspace <ArrowRight size={14} aria-hidden />
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          <span className="mt-5 text-[10px] text-[#b0afa8]">
            Fictional demo chapter
          </span>
        </div>
      </div>
    </section>
  );
}
