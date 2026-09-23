'use client';

import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { UploadZone, type UploadedFile } from '@/components/app/upload-zone';
import { ProcessingScreen } from '@/components/app/processing';
import { Button, Card, CardBody, Checkbox, Field, Select } from '@/components/ui';
import { DEMO_PROJECTS } from '@/lib/data/workspace';
import { DEFAULT_TRANSLATION_PREFERENCES, LANGUAGE_LABELS, type TranslationPreferences, type TranslationStyle } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

const STEPS = ['Upload', 'Settings', 'Process', 'Review'];

const ADVANCED: Array<{ key: keyof TranslationPreferences; label: string }> = [
  { key: 'preserveHonorifics', label: 'Preserve honorifics' },
  { key: 'translateSfx', label: 'Translate SFX' },
  { key: 'automaticTypesetting', label: 'Automatic typesetting' },
  { key: 'removeOriginalText', label: 'Remove original text' },
  { key: 'useTranslationMemory', label: 'Use translation memory' },
  { key: 'useCharacterProfiles', label: 'Use character profiles' },
  { key: 'runQaAfterTranslation', label: 'Run QA after translation' },
];

export default function TranslatePage() {
  const [step, setStep] = React.useState(0);
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [source, setSource] = React.useState('auto');
  const [target, setTarget] = React.useState('en');
  const [projectId, setProjectId] = React.useState(DEMO_PROJECTS[0].id);
  const [style, setStyle] = React.useState<TranslationStyle>('natural');
  const [prefs, setPrefs] = React.useState(DEFAULT_TRANSLATION_PREFERENCES);

  return (
    <AppShellPage>
      <PageHeader title="Start a translation" lede="Upload a chapter you own or are authorized to translate." />

      <ol className="mt-7 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10.5px] font-semibold',
                i < step ? 'bg-ok text-white' : i === step ? 'bg-ink text-canvas' : 'bg-ink/[0.07] text-ink-faint',
              )}
            >
              {i + 1}
            </span>
            <span className={cn('text-[13px]', i === step ? 'font-medium text-ink' : 'text-ink-muted')}>{s}</span>
            {i < STEPS.length - 1 && <span className="mx-1 text-ink-faint" aria-hidden>→</span>}
          </li>
        ))}
      </ol>

      <div className="mt-7">
        {step === 0 && (
          <>
            <UploadZone files={files} onFilesChange={setFiles} />
            <div className="mt-5 flex justify-end">
              <Button size="lg" disabled={files.length === 0} onClick={() => setStep(1)}>
                Continue to settings
                <ArrowRight size={16} />
              </Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <Card>
              <CardBody className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Source language" htmlFor="src">
                    <Select id="src" value={source} onChange={(e) => setSource(e.target.value)}>
                      <option value="auto">Auto detect</option>
                      <option value="ko">Korean</option>
                      <option value="ja">Japanese</option>
                      <option value="zh">Chinese</option>
                    </Select>
                  </Field>
                  <Field label="Target language" htmlFor="tgt">
                    <Select id="tgt" value={target} onChange={(e) => setTarget(e.target.value)}>
                      {(['en', 'es', 'fr', 'de', 'pt', 'id'] as const).map((l) => (
                        <option key={l} value={l}>
                          {LANGUAGE_LABELS[l]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Project" htmlFor="proj" hint="Glossary, characters, and memory come from the project.">
                    <Select id="proj" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                      {DEMO_PROJECTS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="border-t border-line pt-5">
                  <p className="text-[13px] font-medium">Translation style</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    {(['natural', 'faithful', 'localized', 'custom'] as TranslationStyle[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        aria-pressed={style === s}
                        className={cn(
                          'rounded-lg border px-3 py-2.5 text-left text-[13px] capitalize transition-colors',
                          style === s ? 'border-accent bg-accent-soft font-medium' : 'border-line hover:border-ink/25',
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-line pt-5">
                  <p className="text-[13px] font-medium">Advanced</p>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {ADVANCED.map((a) => (
                      <Checkbox
                        key={a.key}
                        label={a.label}
                        checked={Boolean(prefs[a.key])}
                        onChange={(e) => setPrefs({ ...prefs, [a.key]: e.target.checked })}
                      />
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
            <div className="mt-5 flex justify-between">
              <Button variant="ghost" size="lg" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button size="lg" onClick={() => setStep(2)}>
                Translate chapter
                <ArrowRight size={16} />
              </Button>
            </div>
          </>
        )}

        {step >= 2 && <ProcessingScreen />}
      </div>
    </AppShellPage>
  );
}
