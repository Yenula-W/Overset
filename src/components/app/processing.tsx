'use client';

import * as React from 'react';
import { Check, Minus, X } from 'lucide-react';
import { Button, Progress } from '@/components/ui';
import type { StageView } from '@/lib/processing';
import type { IngestProblem } from '@/lib/imaging/ingest';
import { cn } from '@/lib/utils';

/**
 * Shows what each stage is doing and what it found. A spinner alone would
 * leave the translator guessing whether anything is happening.
 */
export function ProcessingScreen({
  chapterName,
  stages,
  progress,
  done,
  failed,
  problems,
  overAllowance,
  onOpenEditor,
  onBack,
}: {
  chapterName: string;
  stages: StageView[];
  progress: { done: number; total: number; label: string };
  done: boolean;
  failed: string | null;
  problems: IngestProblem[];
  overAllowance: string | null;
  onOpenEditor: () => void;
  onBack: () => void;
}) {
  const pct = progress.total ? (progress.done / progress.total) * 100 : 0;

  return (
    <div className="mx-auto max-w-xl py-6">
      <h1 className="text-[26px] font-semibold tracking-[-0.03em]">
        {failed ? `${chapterName} couldn’t be processed` : done ? `${chapterName} is ready` : `Processing ${chapterName}`}
      </h1>
      <p className="mt-2 text-[14px] text-ink-muted" aria-live="polite">
        {failed ? failed : done ? 'Review and edit the translated pages before exporting.' : progress.label || 'Starting…'}
      </p>

      {!done && !failed && <Progress value={pct} className="mt-5" label="Processing progress" />}

      <ul className="mt-8 space-y-3" aria-live="polite">
        {stages.map((s) => (
          <li key={s.id} className="flex items-start gap-3 text-[14px]">
            <span
              aria-hidden
              className={cn(
                'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[10px]',
                s.state === 'complete' && 'border-ok bg-ok text-white',
                s.state === 'running' && 'animate-pulse border-accent text-accent',
                s.state === 'skipped' && 'border-line bg-ink/[0.06] text-ink-muted',
                s.state === 'failed' && 'border-danger bg-danger text-white',
                s.state === 'pending' && 'border-line text-transparent',
              )}
            >
              {s.state === 'complete' ? <Check size={10} /> : s.state === 'skipped' ? <Minus size={10} /> : s.state === 'failed' ? <X size={10} /> : '●'}
            </span>
            <span className="min-w-0">
              <span className={cn(s.state === 'pending' ? 'text-ink-faint' : s.state === 'running' ? 'font-medium text-ink' : 'text-ink')}>
                {s.label}
                {s.state === 'running' && '…'}
                <span className="sr-only"> — {s.state}</span>
              </span>
              {s.message && <span className={cn('block text-[12.5px]', s.state === 'failed' ? 'text-danger' : 'text-ink-muted')}>{s.message}</span>}
            </span>
          </li>
        ))}
      </ul>

      {problems.length > 0 && (
        <div className="mt-7 rounded-xl border border-warn/30 bg-warnSoft px-4 py-3.5">
          <p className="text-[13px] font-medium">
            {problems.length} {problems.length === 1 ? 'file was' : 'files were'} skipped
          </p>
          <ul className="mt-1.5 space-y-1 text-[12.5px] leading-relaxed text-ink-muted">
            {problems.map((p) => (
              <li key={p.file}>{p.reason}</li>
            ))}
          </ul>
        </div>
      )}

      {overAllowance && (
        <p className="mt-5 rounded-xl bg-accent-soft px-4 py-3 text-[13px] leading-relaxed text-ink-muted">{overAllowance}</p>
      )}

      {(done || failed) && (
        <div className="mt-8 flex flex-wrap gap-2">
          {done && (
            <Button size="lg" onClick={onOpenEditor}>
              Open in editor
            </Button>
          )}
          <Button size="lg" variant="secondary" onClick={onBack}>
            {failed ? 'Try again' : 'Back to project'}
          </Button>
        </div>
      )}
    </div>
  );
}
