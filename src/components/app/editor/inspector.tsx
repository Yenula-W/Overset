'use client';

import * as React from 'react';
import { BookPlus, Check, ChevronLeft, ChevronRight, History, Lock, RefreshCw, Trash2, X } from 'lucide-react';
import { REGION_TYPE_LABELS, type DialogueRegion } from '@/lib/types/domain';
import type { CharacterRecord, GlossaryRecord, MemoryRecord } from '@/lib/store/schema';
import { cn } from '@/lib/utils';

export function Inspector({
  region,
  index,
  total,
  characters,
  glossary,
  memory,
  rules,
  onChange,
  onCommit,
  onPrev,
  onNext,
  onApprove,
  onReject,
  onDelete,
  onAddGlossary,
  onRegenerate,
  onImprove,
  onCheckOriginal,
  onCleanup,
  busy = false,
}: {
  onRegenerate: () => void;
  onImprove: () => void;
  onCheckOriginal: () => void;
  onCleanup: () => void;
  busy?: boolean;
  region: DialogueRegion;
  index: number;
  total: number;
  characters: CharacterRecord[];
  glossary: GlossaryRecord[];
  memory: MemoryRecord[];
  rules: string[];
  onChange: (patch: Partial<DialogueRegion>) => void;
  /** Called when a text field loses focus, with its value when focus arrived. */
  onCommit: (field: 'finalTranslation' | 'sourceText', before: string, after: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onAddGlossary: (original: string, translation: string) => void;
}) {
  const speaker = characters.find((c) => c.id === region.speakerId);
  const focusValue = React.useRef('');
  const sourceRef = React.useRef<HTMLTextAreaElement>(null);
  const finalRef = React.useRef<HTMLTextAreaElement>(null);

  const terms = React.useMemo(
    () => glossary.filter((g) => g.original.trim() && region.sourceText.includes(g.original.trim())),
    [glossary, region.sourceText],
  );

  const matches = React.useMemo(() => {
    const src = region.sourceText.trim();
    if (src.length < 2) return [];
    const exact = memory.filter((m) => m.sourceText === src && m.sourceRegionId !== region.id);
    const partial = memory.filter(
      (m) => m.sourceText !== src && m.sourceRegionId !== region.id && (m.sourceText.includes(src) || src.includes(m.sourceText)) && m.sourceText.length >= 2,
    );
    return [...exact, ...partial].slice(0, 3);
  }, [memory, region.sourceText, region.id]);

  function addSelectionToGlossary() {
    const src = sourceRef.current;
    const fin = finalRef.current;
    const original = src && src.selectionStart !== src.selectionEnd ? src.value.slice(src.selectionStart, src.selectionEnd) : '';
    const translation = fin && fin.selectionStart !== fin.selectionEnd ? fin.value.slice(fin.selectionStart, fin.selectionEnd) : '';
    onAddGlossary(original.trim(), translation.trim());
  }

  const statusLabel: Record<DialogueRegion['status'], string> = {
    untranslated: 'Untranslated',
    machine: 'Machine draft',
    edited: 'Edited',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-editor-line px-4 py-3">
        <div>
          <h2 className="text-[14px] font-semibold text-editor-text">Region #{String(index + 1).padStart(2, '0')}</h2>
          <p className="text-[11px] text-editor-muted">{statusLabel[region.status]}</p>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn onClick={onPrev} label="Previous region (k)">
            <ChevronLeft size={14} />
          </IconBtn>
          <span className="px-1 text-[11.5px] tabular-nums text-editor-muted">
            {index + 1}/{total}
          </span>
          <IconBtn onClick={onNext} label="Next region (j)">
            <ChevronRight size={14} />
          </IconBtn>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <TextField
          readOnly={busy}
          refEl={sourceRef}
          label="Source text"
          hint="Read source text with OCR, or edit it here."
          value={region.sourceText}
          rows={2}
          onFocus={(v) => (focusValue.current = v)}
          onChange={(v) => onChange({ sourceText: v })}
          onBlur={(v) => onCommit('sourceText', focusValue.current, v)}
        />

        <TextField
          readOnly={busy}
          refEl={finalRef}
          label="Translation · live preview"
          value={region.finalTranslation}
          rows={3}
          onFocus={(v) => (focusValue.current = v)}
          // Any edit needs a fresh approval — including edits to an approved line.
          onChange={(v) => onChange({ finalTranslation: v, status: v.trim() ? 'edited' : 'untranslated' })}
          onBlur={(v) => onCommit('finalTranslation', focusValue.current, v)}
        />

        <div className="flex items-center justify-between gap-2">
          <button disabled={busy || !region.sourceText.trim()} onClick={onImprove} className="rounded-lg border border-accent/40 px-3 py-2 text-[12.5px] text-[#C3BEFF] disabled:opacity-40">{busy ? 'Working…' : 'Improve this line'}</button>
          <button onClick={onCheckOriginal} className="rounded-lg px-2 py-2 text-[12px] text-editor-muted hover:text-editor-text">Check original</button>
        </div>
        {region.revisionSuggestion && <div className="rounded-xl border border-accent/40 bg-accent/10 p-3">
          <p className="text-[11px] font-medium text-[#C3BEFF]">Suggested revision · your current line is kept</p>
          <p className="mt-2 text-[14px] leading-relaxed">{region.revisionSuggestion.translation}</p>
          {region.revisionSuggestion.note && <details className="mt-2 text-[12px] text-warn"><summary className="cursor-pointer">Why this suggestion?</summary><p className="mt-2 leading-relaxed">{region.revisionSuggestion.note}</p></details>}
          <div className="mt-3 flex gap-2">
            <button disabled={busy} onClick={()=>{const suggestion=region.revisionSuggestion!;onCommit('finalTranslation',region.finalTranslation,suggestion.translation);onChange({finalTranslation:suggestion.translation,literalTranslation:suggestion.literal,translationConfidence:suggestion.confidence,ambiguityNote:suggestion.note,status:'edited',revisionSuggestion:undefined});}} className="rounded-lg bg-accent px-3 py-2 text-[12px] text-white disabled:opacity-40">Use suggestion</button>
            <button disabled={busy} onClick={()=>onChange({revisionSuggestion:undefined})} className="rounded-lg px-3 py-2 text-[12px] text-editor-muted">Keep current</button>
          </div>
        </div>}
        {region.ambiguityNote && <details className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-[12px] text-warn"><summary className="cursor-pointer">Translation note</summary><p className="mt-2 leading-relaxed">{region.ambiguityNote}</p></details>}

        <details className="rounded-lg border border-editor-line p-3">
          <summary className="cursor-pointer text-[12px] text-editor-muted">Alternatives &amp; story context</summary>
          <div className="mt-3 space-y-4">
        {speaker && (
          <div className="rounded-lg bg-editor-panel px-3 py-2.5">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full" style={{ background: speaker.color }} aria-hidden />
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium text-editor-text">{speaker.name}</p>
                <p className="text-[11.5px] leading-relaxed text-editor-muted">
                  {[...speaker.voice, `${speaker.formality} formality`, `${speaker.slang} slang`].join(' · ')}
                </p>
              </div>
            </div>
            {speaker.speechRules.length > 0 && (
              <ul className="mt-2 space-y-0.5 border-t border-editor-line pt-2 text-[11.5px] leading-relaxed text-editor-muted">
                {speaker.speechRules.slice(0, 4).map((r) => (
                  <li key={r}>· {r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {region.romanization && (
          <Block label="Romanization">
            <p className="text-[12px] italic leading-relaxed text-editor-muted">{region.romanization}</p>
          </Block>
        )}
        {region.literalTranslation && (
          <Block label="Literal">
            <p className="text-[13px] leading-relaxed text-editor-muted">{region.literalTranslation}</p>
          </Block>
        )}

        {terms.length > 0 && (
          <Block label="Glossary in this line">
            <ul className="space-y-1.5">
              {terms.map((t) => {
                const used = region.finalTranslation.toLowerCase().includes(t.translation.toLowerCase());
                return (
                  <li key={t.id} className="flex items-center gap-2 rounded-lg border border-editor-line px-2.5 py-1.5 text-[12px]">
                    <span className="text-editor-text">{t.original}</span>
                    <span className="text-editor-muted">→</span>
                    <span className={cn('flex-1', used ? 'text-ok' : 'text-editor-text')}>{t.translation}</span>
                    {t.status === 'locked' && <Lock size={10} className="text-editor-muted" aria-label="Locked term" />}
                    {!used && (
                      <button
                        onClick={() => onChange({ finalTranslation: `${region.finalTranslation}${region.finalTranslation && !region.finalTranslation.endsWith(' ') ? ' ' : ''}${t.translation}`, status: 'edited' })}
                        className="text-[11px] text-[#B9B4FF] hover:underline"
                      >
                        Insert
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Block>
        )}

        {matches.length > 0 && (
          <Block label="Previously translated as">
            <ul className="space-y-1.5">
              {matches.map((m) => (
                <li key={m.id} className="rounded-lg border border-editor-line px-2.5 py-2">
                  <p className="text-[12.5px] leading-relaxed text-editor-text">{m.translation}</p>
                  <p className="mt-0.5 text-[11px] text-editor-muted">
                    {m.chapterName} · {m.regionLabel}
                    {m.speakerName ? ` · ${m.speakerName}` : ''}
                    {m.sourceText !== region.sourceText.trim() ? ' · partial match' : ''}
                  </p>
                  <button
                    onClick={() => {
                      onCommit('finalTranslation', region.finalTranslation, m.translation);
                      onChange({ finalTranslation: m.translation, status: 'edited' });
                    }}
                    className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] text-[#B9B4FF] hover:underline"
                  >
                    <History size={11} />
                    Use translation
                  </button>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {region.alternatives.length > 0 && (
          <Block label="Alternatives">
            <ul className="space-y-1.5">
              {region.alternatives.map((alt) => (
                <li key={alt}>
                  <button
                    onClick={() => {
                      onCommit('finalTranslation', region.finalTranslation, alt);
                      onChange({ finalTranslation: alt, status: 'edited' });
                    }}
                    className="w-full rounded-lg border border-editor-line px-2.5 py-2 text-left text-[12.5px] leading-relaxed text-editor-muted transition-colors hover:border-accent/60 hover:text-editor-text"
                  >
                    {alt}
                  </button>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {rules.length > 0 && (
          <Block label="Project rules">
            <ul className="space-y-0.5 text-[11.5px] leading-relaxed text-editor-muted">
              {rules.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
          </Block>
        )}

          </div>
        </details>
        <details className="rounded-lg border border-editor-line p-3">
          <summary className="cursor-pointer text-[12px] text-editor-muted">Region options</summary>
          <div className="mt-3 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <LabeledSelect
            label="Speaker"
            value={region.speakerId ?? ''}
            onChange={(v) => onChange({ speakerId: v || undefined })}
            options={[{ value: '', label: 'Unassigned' }, ...characters.map((c) => ({ value: c.id, label: c.name }))]}
          />
          <LabeledSelect
            label="Type"
            value={region.type}
            onChange={(v) => onChange({ type: v as DialogueRegion['type'], embeddedInArtwork: v === 'sfx' ? true : region.embeddedInArtwork })}
            options={Object.entries(REGION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>

            <label className="block text-[12px] text-editor-muted">Translator note
              <textarea value={region.translatorNote??''} maxLength={2000} onChange={e=>onChange({translatorNote:e.target.value,revisionSuggestion:undefined})} placeholder="Optional: explain the scene or intended tone" rows={2} className="mt-2 w-full rounded-lg border border-editor-line bg-editor-panel px-3 py-2 text-editor-text" />
            </label>
        <div className="space-y-2 rounded-lg bg-editor-panel px-3 py-2.5">
          <Toggle label="Translate this region" checked={region.translate} onChange={(v) => onChange({ translate: v })} />
          <Toggle
            label="Text sits on artwork"
            hint="Use the cleanup brush to replace only the source lettering."
            checked={region.embeddedInArtwork}
            onChange={(v) => onChange({ embeddedInArtwork: v })}
          />
        </div>

        {(region.embeddedInArtwork || region.type === 'sfx' || region.type === 'background') && <div className="flex gap-2"><button onClick={onCleanup} className="rounded-md border border-editor-line px-3 py-2 text-[12px] text-editor-text">Clean artwork text</button>{region.artworkCleanup && <button onClick={()=>onChange({artworkCleanup:undefined,status:'edited'})} className="text-[12px] text-editor-muted">Remove cleanup</button>}</div>}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <button onClick={addSelectionToGlossary} className="inline-flex items-center gap-1.5 text-[12px] text-editor-muted hover:text-editor-text">
            <BookPlus size={12} />
            Add to glossary
          </button>
          <button onClick={onDelete} className="inline-flex items-center gap-1.5 text-[12px] text-editor-muted hover:text-danger">
            <Trash2 size={12} />
            Delete region
          </button>
        </div>
            <button disabled={busy} onClick={onRegenerate} className="rounded-lg border border-editor-line px-3 py-2 text-[12px] text-editor-muted disabled:opacity-40">Replace with new AI draft</button>
          </div>
        </details>
      </div>

      <div className="flex gap-2 border-t border-editor-line px-4 py-3">
        <button
          onClick={onApprove}
          disabled={busy || !region.finalTranslation.trim()}
          title={region.finalTranslation.trim() ? 'Approve (a)' : 'Add a translation first'}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors disabled:opacity-40',
            region.status === 'approved' ? 'bg-ok/20 text-ok' : 'bg-accent text-white hover:bg-accent-strong',
          )}
        >
          <Check size={14} />
          {region.status === 'approved' ? 'Approved' : index < total - 1 ? 'Approve & next' : 'Approve'}
        </button>
        <button
          onClick={onReject}
          title="Mark as needing another pass"
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] transition-colors',
            region.status === 'rejected' ? 'border-danger/60 text-danger' : 'border-editor-line text-editor-muted hover:text-editor-text',
          )}
        >
          <X size={13} />
          Needs work
        </button>

      </div>
    </div>
  );
}

function TextField({
  label,
  hint,
  value,
  rows,
  refEl,
  readOnly,
  onChange,
  onFocus,
  onBlur,
}: {
  label: string;
  hint?: string;
  value: string;
  rows: number;
  refEl?: React.RefObject<HTMLTextAreaElement | null>;
  readOnly?: boolean;
  onChange: (v: string) => void;
  onFocus: (v: string) => void;
  onBlur: (v: string) => void;
}) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-editor-muted">
        {label}
      </label>
      <textarea
        readOnly={readOnly}
        ref={refEl}
        id={id}
        value={value}
        rows={rows}
        onFocus={(e) => onFocus(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-lg border border-editor-line bg-editor-panel px-3 py-2.5 text-[13.5px] leading-relaxed text-editor-text placeholder:text-editor-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
      />
      {hint && !value && <p className="mt-1 text-[11px] text-editor-muted">{hint}</p>}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = React.useId();
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[12px] text-editor-muted">
          {label}
        </label>
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-accent" />
      </div>
      {hint && checked && <p className="mt-0.5 text-[11px] leading-relaxed text-editor-muted/80">{hint}</p>}
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
    <button onClick={onClick} aria-label={label} title={label} className="rounded-md border border-editor-line p-1 text-editor-muted transition-colors hover:text-editor-text">
      {children}
    </button>
  );
}
