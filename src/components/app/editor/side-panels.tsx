'use client';

import * as React from 'react';
import { Clock, RotateCcw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { DEMO_QA_ISSUES } from '@/lib/data/chapter';
import { DEMO_VERSIONS } from '@/lib/data/workspace';
import type { QaIssue } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

const SEVERITY: Record<QaIssue['severity'], { ring: string; text: string; label: string }> = {
  critical: { ring: 'border-danger/40 bg-danger/10', text: 'text-danger', label: 'Critical' },
  warning: { ring: 'border-warn/40 bg-warn/10', text: 'text-warn', label: 'Warning' },
  info: { ring: 'border-editor-line bg-editor-panel', text: 'text-editor-muted', label: 'Info' },
};

export function QaPanel({ onSelectRegion }: { onSelectRegion?: (id: string) => void }) {
  const open = DEMO_QA_ISSUES.filter((i) => !i.resolved);

  return (
    <div className="space-y-3 px-4 py-4">
      <div className="flex items-center gap-2">
        <ShieldCheck size={14} className="text-editor-muted" aria-hidden />
        <p className="text-[13px] font-medium text-editor-text">{open.length} issues found</p>
      </div>
      <ul className="space-y-2">
        {open.map((issue) => {
          const s = SEVERITY[issue.severity];
          return (
            <li key={issue.id} className={cn('rounded-lg border px-3 py-2.5', s.ring)}>
              <div className="flex items-center gap-1.5">
                <TriangleAlert size={11} className={s.text} aria-hidden />
                <p className={cn('text-[11px] font-semibold uppercase tracking-[0.08em]', s.text)}>{issue.title}</p>
                <span className="ml-auto text-[10px] text-editor-muted">{s.label}</span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-editor-muted">{issue.detail}</p>
              <button
                onClick={() => issue.regionId && onSelectRegion?.(issue.regionId)}
                className="mt-2 rounded-md border border-editor-line px-2 py-1 text-[11px] text-editor-text transition-colors hover:border-accent/60"
              >
                {issue.action.label}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] leading-relaxed text-editor-muted">
        Ambiguous literary decisions are flagged for review, never rewritten automatically.
      </p>
    </div>
  );
}

const KIND_LABEL: Record<string, string> = {
  ai_translation: 'AI translation',
  human_edit: 'Edit',
  approval: 'Approval',
  glossary_update: 'Glossary',
  typeset: 'Typesetting',
  ocr_edit: 'OCR',
  export: 'Export',
};

export function HistoryPanel() {
  return (
    <div className="space-y-3 px-4 py-4">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-editor-muted" aria-hidden />
        <p className="text-[13px] font-medium text-editor-text">Version history</p>
      </div>
      <ol className="space-y-2.5">
        {DEMO_VERSIONS.map((v) => (
          <li key={v.id} className="border-l border-editor-line pl-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] tabular-nums text-editor-muted">
                {new Date(v.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
              <span className="rounded bg-editor-panel px-1.5 py-0.5 text-[10px] text-editor-muted">{KIND_LABEL[v.kind]}</span>
            </div>
            <p className="mt-1 text-[12.5px] text-editor-text">
              {v.actor} · {v.summary}
            </p>
            {v.before && (
              <p className="mt-1 text-[11.5px] leading-relaxed text-editor-muted">
                <span className="line-through opacity-60">{v.before}</span>
                <br />
                {v.after}
              </p>
            )}
            <button className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-editor-muted transition-colors hover:text-editor-text">
              <RotateCcw size={10} />
              Restore
            </button>
          </li>
        ))}
      </ol>
      <p className="text-[11px] leading-relaxed text-editor-muted">
        Approved human work is never overwritten without a record of what changed.
      </p>
    </div>
  );
}
