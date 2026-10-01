'use client';

import * as React from 'react';
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import { LANGUAGE_LABELS, type LanguageCode } from '@/lib/types/domain';
import type { ProjectRecord } from '@/lib/store/schema';

export interface ProjectFormValues {
  name: string;
  description: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
}

/** Create or edit a project. */
export function ProjectFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  title,
  submitLabel,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  initial?: Partial<ProjectRecord>;
  title: string;
  submitLabel: string;
}) {
  const [values, setValues] = React.useState<ProjectFormValues>({
    name: '',
    description: '',
    sourceLanguage: 'ko',
    targetLanguage: 'en',
  });
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setValues({
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      sourceLanguage: initial?.sourceLanguage && initial.sourceLanguage !== 'auto' ? initial.sourceLanguage : 'ko',
      targetLanguage: initial?.targetLanguage ?? 'en',
    });
  }, [open, initial]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!values.name.trim()) {
      setError('Give the project a name.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The project couldn’t be saved.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={busy}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Project name" htmlFor="p-name" error={error ?? undefined}>
          <Input id="p-name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="e.g. The Fallen Hero" autoFocus />
        </Field>
        <Field label="Description" htmlFor="p-desc" hint="Optional — genre, tone, anything collaborators should know.">
          <Textarea id="p-desc" value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Source language" htmlFor="p-src">
            <Select id="p-src" value={values.sourceLanguage} onChange={(e) => setValues({ ...values, sourceLanguage: e.target.value as LanguageCode })}>
              {(['ko', 'ja', 'zh'] as const).map((l) => (
                <option key={l} value={l}>
                  {LANGUAGE_LABELS[l]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Target language" htmlFor="p-tgt">
            <Select id="p-tgt" value={values.targetLanguage} onChange={(e) => setValues({ ...values, targetLanguage: e.target.value as LanguageCode })}>
              {(['en', 'es', 'fr', 'de', 'pt', 'id'] as const).map((l) => (
                <option key={l} value={l}>
                  {LANGUAGE_LABELS[l]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

/** "Are you sure?" for destructive actions. */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
}) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="This cannot be undone."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onClose();
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[14px] leading-relaxed text-ink-muted">{body}</div>
    </Modal>
  );
}
