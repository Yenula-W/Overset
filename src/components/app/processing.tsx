'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button, Progress } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Line {
  label: string;
  done: string;
}

/**
 * The processing screen names the stage that is running and what it has already
 * found. A spinner would leave the translator guessing whether it had frozen.
 */
const LINES: Line[] = [
  { label: 'Uploading pages', done: 'Uploaded 46 pages' },
  { label: 'Detecting panels', done: 'Detected 173 panels' },
  { label: 'Detecting text regions', done: 'Detected 291 dialogue regions' },
  { label: 'Identifying characters', done: 'Identified 7 characters' },
  { label: 'Reading dialogue', done: 'OCR complete' },
  { label: 'Translating dialogue', done: 'Translation complete' },
  { label: 'Checking terminology', done: 'Terminology checked' },
  { label: 'Cleaning text regions', done: 'Text regions cleaned' },
  { label: 'Typesetting', done: 'Typesetting complete' },
  { label: 'Running QA', done: 'QA complete' },
];

const TOTAL_PAGES = 46;

export function ProcessingScreen({ chapterName = 'Chapter 28' }: { chapterName?: string }) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [pages, setPages] = React.useState(0);

  React.useEffect(() => {
    if (step >= LINES.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [step]);

  React.useEffect(() => {
    if (pages >= TOTAL_PAGES) return;
    const t = setTimeout(() => setPages((p) => Math.min(TOTAL_PAGES, p + 2)), 420);
    return () => clearTimeout(t);
  }, [pages]);

  const complete = step >= LINES.length;
  const secondsLeft = Math.max(0, Math.round((LINES.length - step) * 10.2));

  return (
    <div className="mx-auto max-w-lg py-10">
      <h1 className="text-[26px] font-semibold tracking-[-0.03em]">
        {complete ? `${chapterName} is ready` : `Translating ${chapterName}`}
      </h1>
      <p className="mt-2 text-[14px] text-ink-muted">
        {complete ? 'Nothing is final until you approve it.' : `${pages} / ${TOTAL_PAGES} pages`}
      </p>

      <Progress value={(pages / TOTAL_PAGES) * 100} className="mt-5" label="Pages processed" />

      <ul className="mt-8 space-y-2.5" aria-live="polite">
        {LINES.map((line, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={line.label} className="flex items-center gap-3 text-[14px]">
              <span
                aria-hidden
                className={cn(
                  'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                  done ? 'border-ok bg-ok text-white' : active ? 'animate-pulse border-accent text-accent' : 'border-line text-transparent',
                )}
              >
                {done ? <Check size={10} /> : active ? '●' : '○'}
              </span>
              <span className={cn(done ? 'text-ink-muted' : active ? 'font-medium text-ink' : 'text-ink-faint')}>
                {done ? line.done : active ? `${line.label}…` : line.label}
              </span>
            </li>
          );
        })}
      </ul>

      {!complete && (
        <p className="mt-7 text-[13px] text-ink-faint">
          Estimated time remaining: {Math.floor(secondsLeft / 60)}m {String(secondsLeft % 60).padStart(2, '0')}s
        </p>
      )}

      {complete && (
        <div className="mt-8 flex gap-2">
          <Button size="lg" onClick={() => router.push('/translate/editor')}>
            Review translation
          </Button>
          <Button size="lg" variant="secondary" href="/projects">
            Back to projects
          </Button>
        </div>
      )}
    </div>
  );
}
