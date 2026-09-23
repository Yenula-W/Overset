'use client';

import * as React from 'react';
import { Check, ChevronLeft, ChevronRight, MessageSquare, RefreshCw, Sparkles } from 'lucide-react';
import { characterById, DEMO_CHARACTERS } from '@/lib/data/characters';
import { DEMO_COMMENTS } from '@/lib/data/workspace';
import { REGION_TYPE_LABELS, type DialogueRegion } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

export function Inspector({
  region,
  index,
  total,
  onChange,
  onPrev,
  onNext,
  onApprove,
}: {
  region: DialogueRegion;
  index: number;
  total: number;
  onChange: (patch: Partial<DialogueRegion>) => void;
  onPrev: () => void;
  onNext: () => void;
  onApprove: () => void;
}) {
  const speaker = characterById(region.speakerId);
  const comments = DEMO_COMMENTS.filter((c) => c.regionId === region.id);
  const [regenerating, setRegenerating] = React.useState(false);

  function regenerate() {
    setRegenerating(true);
    setTimeout(() => setRegenerating(false), 900);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-editor-line px-4 py-3">
        <h2 className="text-[14px] font-semibold text-editor-text">Bubble #{String(index + 1).padStart(2, '0')}</h2>
        <div className="flex items-center gap-1">
          <IconBtn onClick={onPrev} label="Previous region">
            <ChevronLeft size={14} />
          </IconBtn>
          <span className="px-1 text-[11.5px] tabular-nums text-editor-muted">
            {index + 1}/{total}
          </span>
          <IconBtn onClick={onNext} label="Next region">
            <ChevronRight size={14} />
          </IconBtn>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          <LabeledSelect
            label="Speaker"
            value={region.speakerId ?? ''}
            onChange={(v) => onChange({ speakerId: v || undefined })}
            options={[{ value: '', label: 'Unassigned' }, ...DEMO_CHARACTERS.map((c) => ({ value: c.id, label: c.name }))]}
          />
          <LabeledSelect
            label="Type"
            value={region.type}
            onChange={(v) => onChange({ type: v as DialogueRegion['type'] })}
            options={Object.entries(REGION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>

        {speaker && (
          <div className="flex items-start gap-2 rounded-lg bg-editor-panel px-3 py-2.5">
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full" style={{ background: speaker.color }} aria-hidden />
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-editor-text">{speaker.name}</p>
              <p className="text-[11.5px] leading-relaxed text-editor-muted">
                {speaker.voice.join(' · ')} · {speaker.formality} formality
              </p>
            </div>
          </div>
        )}

        <Block label="Source">
          <p className="text-[13.5px] leading-relaxed text-editor-text">{region.sourceText}</p>
        </Block>

        {region.romanization && (
          <Block label="Romanization">
            <p className="text-[12px] italic leading-relaxed text-editor-muted">{region.romanization}</p>
          </Block>
        )}

        <Block label="Literal">
          <p className="text-[13px] leading-relaxed text-editor-muted">{region.literalTranslation}</p>
        </Block>

        <div>
          <label htmlFor="final" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-editor-muted">
            Final translation
          </label>
          <textarea
            id="final"
            value={region.finalTranslation}
            onChange={(e) => onChange({ finalTranslation: e.target.value, status: 'edited' })}
            rows={3}
            className="w-full resize-y rounded-lg border border-editor-line bg-editor-panel px-3 py-2.5 text-[13.5px] leading-relaxed text-editor-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        </div>

        {region.alternatives.length > 0 && (
          <Block label="Alternatives">
            <ul className="space-y-1.5">
              {region.alternatives.map((alt) => (
                <li key={alt}>
                  <button
                    onClick={() => onChange({ finalTranslation: alt, status: 'edited' })}
                    className="w-full rounded-lg border border-editor-line px-2.5 py-2 text-left text-[12.5px] leading-relaxed text-editor-muted transition-colors hover:border-accent/60 hover:text-editor-text"
                  >
                    {alt}
                  </button>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {region.ambiguityNote && (
          <div className="rounded-lg border border-warn/35 bg-warn/10 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-warn">Ambiguity</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-editor-muted">{region.ambiguityNote}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Stat label="OCR" value={`${Math.round(region.ocrConfidence * 100)}%`} />
          <Stat label="Translation" value={`${Math.round(region.translationConfidence * 100)}%`} />
        </div>

        <Block label="Context used">
          <ul className="space-y-1.5">
            {region.contextUsed.map((c) => (
              <li key={c.label} className="flex items-start gap-1.5">
                <Check size={11} className="mt-[3px] shrink-0 text-ok" aria-hidden />
                <span className="text-[12px] leading-relaxed text-editor-muted">
                  <span className="text-editor-text">{c.label}</span>
                  {c.detail && <span className="block text-editor-muted">{c.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Block>

        {comments.length > 0 && (
          <Block label="Comments">
            <ul className="space-y-2">
              {comments.map((c) => (
                <li key={c.id} className="rounded-lg bg-editor-panel px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={11} className="text-editor-muted" aria-hidden />
                    <span className="text-[11.5px] font-medium text-editor-text">{c.authorName}</span>
                    {c.resolved && <span className="ml-auto text-[10.5px] text-ok">Resolved</span>}
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-editor-muted">{c.body}</p>
                  {c.replies.map((r) => (
                    <p key={r.id} className="mt-2 border-l border-editor-line pl-2 text-[12px] leading-relaxed text-editor-muted">
                      <span className="text-editor-text">{r.authorName}: </span>
                      {r.body}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </Block>
        )}
      </div>

      <div className="flex gap-2 border-t border-editor-line px-4 py-3">
        <button
          onClick={onApprove}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
            region.status === 'approved' ? 'bg-ok/20 text-ok' : 'bg-accent text-white hover:bg-accent-strong',
          )}
        >
          <Check size={14} />
          {region.status === 'approved' ? 'Approved' : 'Approve'}
        </button>
        <button
          onClick={regenerate}
          className="flex items-center gap-1.5 rounded-lg border border-editor-line px-3 py-2 text-[13px] text-editor-muted transition-colors hover:text-editor-text"
        >
          {regenerating ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
          Regenerate
        </button>
      </div>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-editor-muted">{label}</p>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-editor-panel px-3 py-2">
      <p className="text-[10.5px] text-editor-muted">{label} confidence</p>
      <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-editor-text">{value}</p>
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-editor-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-editor-line bg-editor-panel px-2 py-1.5 text-[12.5px] text-editor-text focus:border-accent focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function IconBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-md border border-editor-line p-1 text-editor-muted transition-colors hover:text-editor-text"
    >
      {children}
    </button>
  );
}
