'use client';

import * as React from 'react';
import { Clock, MessageSquare, RotateCcw, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { QaFinding } from '@/lib/qa';
import type { CommentRecord, VersionRecord } from '@/lib/store/schema';
import { cn } from '@/lib/utils';

const SEVERITY: Record<QaFinding['severity'], { ring: string; text: string; label: string }> = {
  critical: { ring: 'border-danger/40 bg-danger/10', text: 'text-danger', label: 'Critical' },
  warning: { ring: 'border-warn/40 bg-warn/10', text: 'text-warn', label: 'Warning' },
  info: { ring: 'border-editor-line bg-editor-panel', text: 'text-editor-muted', label: 'Info' },
};

export function QaPanel({ findings, onGo }: { findings: QaFinding[]; onGo: (f: QaFinding) => void }) {
  const [showInfo, setShowInfo] = React.useState(false);
  const visible = showInfo ? findings : findings.filter((f) => f.severity !== 'info');
  const infoCount = findings.length - findings.filter((f) => f.severity !== 'info').length;

  return (
    <div className="space-y-3 px-4 py-4">
      <div className="flex items-center gap-2">
        <ShieldCheck size={14} className="text-editor-muted" aria-hidden />
        <p className="text-[13px] font-medium text-editor-text">
          {visible.length === 0 ? 'No issues found' : `${visible.length} ${visible.length === 1 ? 'issue' : 'issues'} found`}
        </p>
      </div>
      {infoCount > 0 && (
        <label className="flex items-center gap-2 text-[11.5px] text-editor-muted">
          <input type="checkbox" checked={showInfo} onChange={(e) => setShowInfo(e.target.checked)} className="accent-accent" />
          Show {infoCount} informational {infoCount === 1 ? 'note' : 'notes'}
        </label>
      )}
      <ul className="space-y-2">
        {visible.map((f) => {
          const s = SEVERITY[f.severity];
          return (
            <li key={f.id} className={cn('rounded-lg border px-3 py-2.5', s.ring)}>
              <div className="flex items-center gap-1.5">
                <TriangleAlert size={11} className={s.text} aria-hidden />
                <p className={cn('text-[11px] font-semibold uppercase tracking-[0.08em]', s.text)}>{f.title}</p>
                <span className="ml-auto text-[10px] text-editor-muted">
                  {s.label} · p.{String(f.pageOrder).padStart(2, '0')}
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-editor-muted">{f.detail}</p>
              <button onClick={() => onGo(f)} className="mt-2 rounded-md border border-editor-line px-2 py-1 text-[11px] text-editor-text transition-colors hover:border-accent/60">
                {f.regionId ? 'Review' : 'View page'}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] leading-relaxed text-editor-muted">QA only flags. Wording and literary calls are never changed for you.</p>
    </div>
  );
}

const KIND_LABEL: Record<string, string> = {
  ai_translation: 'AI translation',
  human_edit: 'Edit',
  approval: 'Approval',
  glossary_update: 'Glossary',
  typeset: 'Typesetting',
  ocr_edit: 'Source text',
  export: 'Export',
};

export function HistoryPanel({ versions, onRestore }: { versions: VersionRecord[]; onRestore: (v: VersionRecord) => void }) {
  return (
    <div className="space-y-3 px-4 py-4">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-editor-muted" aria-hidden />
        <p className="text-[13px] font-medium text-editor-text">Version history</p>
      </div>
      {versions.length === 0 ? (
        <p className="text-[12px] text-editor-muted">Edits, approvals, and exports will appear here.</p>
      ) : (
        <ol className="space-y-2.5">
          {versions.slice(0, 100).map((v) => (
            <li key={v.id} className="border-l border-editor-line pl-3">
              <div className="flex items-baseline gap-2">
                <time dateTime={v.createdAt} className="text-[11px] tabular-nums text-editor-muted">
                  {new Date(v.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </time>
                <span className="rounded bg-editor-panel px-1.5 py-0.5 text-[10px] text-editor-muted">{KIND_LABEL[v.kind] ?? v.kind}</span>
              </div>
              <p className="mt-1 text-[12.5px] text-editor-text">
                {v.actor} · {v.summary}
              </p>
              {v.before !== undefined && v.after !== undefined && (
                <p className="mt-1 text-[11.5px] leading-relaxed text-editor-muted">
                  <span className="line-through opacity-60">{v.before || '(empty)'}</span>
                  <br />
                  {v.after || '(empty)'}
                </p>
              )}
              {v.field && v.before !== undefined && v.regionId && (
                <button
                  onClick={() => onRestore(v)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-editor-muted transition-colors hover:text-editor-text"
                >
                  <RotateCcw size={10} />
                  Restore previous
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
      <p className="text-[11px] leading-relaxed text-editor-muted">Restoring is recorded too, so nothing is overwritten without a trace.</p>
    </div>
  );
}

export function CommentsPanel({
  comments,
  hasRegion,
  authorName,
  onAdd,
  onResolve,
}: {
  comments: CommentRecord[];
  hasRegion: boolean;
  authorName: string;
  onAdd: (body: string, parentId?: string) => Promise<void>;
  onResolve: (id: string, resolved: boolean) => void;
}) {
  const [draft, setDraft] = React.useState('');
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const [reply, setReply] = React.useState('');
  const roots = comments.filter((c) => !c.parentId);

  if (!hasRegion) return <p className="px-4 py-4 text-[12px] text-editor-muted">Select a region to see and add comments.</p>;

  return (
    <div className="space-y-3 px-4 py-4">
      <div className="flex items-center gap-2">
        <MessageSquare size={14} className="text-editor-muted" aria-hidden />
        <p className="text-[13px] font-medium text-editor-text">Comments on this region</p>
      </div>
      {roots.length === 0 && <p className="text-[12px] text-editor-muted">No comments yet.</p>}
      <ul className="space-y-2">
        {roots.map((c) => (
          <li key={c.id} className={cn('rounded-lg bg-editor-panel px-3 py-2.5', c.resolved && 'opacity-60')}>
            <div className="flex items-center gap-1.5">
              <span className="text-[11.5px] font-medium text-editor-text">{c.authorName}</span>
              <time className="text-[10.5px] text-editor-muted">{new Date(c.createdAt).toLocaleDateString()}</time>
              {c.resolved && <span className="ml-auto text-[10.5px] text-ok">Resolved</span>}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-editor-muted">{c.body}</p>
            {comments
              .filter((r) => r.parentId === c.id)
              .map((r) => (
                <p key={r.id} className="mt-2 border-l border-editor-line pl-2 text-[12px] leading-relaxed text-editor-muted">
                  <span className="text-editor-text">{r.authorName}: </span>
                  {r.body}
                </p>
              ))}
            {replyTo === c.id ? (
              <form
                className="mt-2 space-y-1.5"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!reply.trim()) return;
                  await onAdd(reply.trim(), c.id);
                  setReply('');
                  setReplyTo(null);
                }}
              >
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={2}
                  autoFocus
                  aria-label="Reply"
                  className="w-full rounded-md border border-editor-line bg-editor-bg px-2 py-1.5 text-[12px] text-editor-text focus:border-accent focus:outline-none"
                />
                <div className="flex gap-2">
                  <button type="submit" className="rounded-md bg-accent px-2 py-1 text-[11px] font-medium text-white">
                    Reply
                  </button>
                  <button type="button" onClick={() => setReplyTo(null)} className="text-[11px] text-editor-muted">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-2 flex gap-3">
                <button onClick={() => setReplyTo(c.id)} className="text-[11px] text-editor-muted hover:text-editor-text">
                  Reply
                </button>
                <button onClick={() => onResolve(c.id, !c.resolved)} className="text-[11px] text-editor-muted hover:text-editor-text">
                  {c.resolved ? 'Reopen' : 'Resolve'}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <form
        className="space-y-2 border-t border-editor-line pt-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          await onAdd(draft.trim());
          setDraft('');
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder={`Comment as ${authorName}…`}
          aria-label="New comment"
          className="w-full rounded-lg border border-editor-line bg-editor-panel px-3 py-2 text-[12.5px] text-editor-text placeholder:text-editor-muted/60 focus:border-accent focus:outline-none"
        />
        <button type="submit" disabled={!draft.trim()} className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-40">
          Add comment
        </button>
      </form>
    </div>
  );
}
