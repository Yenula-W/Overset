'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { UploadZone, type UploadItem } from '@/components/app/upload-zone';
import { ProcessingScreen } from '@/components/app/processing';
import { Button, Card, CardBody, Checkbox, Field, Input, Select } from '@/components/ui';
import { planById } from '@/lib/billing';
import { processChapter, STAGES, type StageView } from '@/lib/processing';
import type { IngestProblem } from '@/lib/imaging/ingest';
import { useLiveQuery, useUser, useActiveWorkspace } from '@/lib/store/hooks';
import { createChapter, createProject, getUsage, listChapters, listProjects } from '@/lib/store/repo';
import {
  DEFAULT_TRANSLATION_PREFERENCES,
  LANGUAGE_LABELS,
  type LanguageCode,
  type TranslationPreferences,
  type TranslationStyle,
} from '@/lib/types/domain';
import { cn, formatNumber } from '@/lib/utils';

const STEPS = ['Upload', 'Settings', 'Process', 'Review'];
const NEW_PROJECT = '__new__';

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
  const user = useUser();
  const workspace = useActiveWorkspace();
  const router = useRouter();
  const projects = useLiveQuery(() => listProjects(workspace.id), [workspace.id], ['projects']);

  const [step, setStep] = React.useState(0);
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const [projectId, setProjectId] = React.useState<string>('');
  const [newProjectName, setNewProjectName] = React.useState('');
  const [chapterName, setChapterName] = React.useState('');
  const [source, setSource] = React.useState<LanguageCode>(user.preferences.primarySourceLanguage ?? 'ko');
  const [target, setTarget] = React.useState<LanguageCode>('en');
  const [style, setStyle] = React.useState<TranslationStyle>('natural');
  const [prefs, setPrefs] = React.useState<TranslationPreferences>(DEFAULT_TRANSLATION_PREFERENCES);
  const [detect, setDetect] = React.useState(true);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Processing state
  const [stages, setStages] = React.useState<StageView[]>(STAGES.map((s) => ({ ...s, state: 'pending' })));
  const [progress, setProgress] = React.useState({ done: 0, total: 0, label: '' });
  const [result, setResult] = React.useState<{ chapterId: string; projectId: string } | null>(null);
  const [failed, setFailed] = React.useState<string | null>(null);
  const [problems, setProblems] = React.useState<IngestProblem[]>([]);
  const [overAllowance, setOverAllowance] = React.useState<string | null>(null);
  const [processingName, setProcessingName] = React.useState('your chapter');

  // Pick a project: ?project= wins, then the most recent one, else "new".
  React.useEffect(() => {
    if (!projects.data || projectId) return;
    const wanted = new URLSearchParams(window.location.search).get('project');
    const match = projects.data.find((p) => p.id === wanted) ?? projects.data[0];
    setProjectId(match ? match.id : NEW_PROJECT);
  }, [projects.data, projectId]);

  // Follow the chosen project's languages and preferences.
  React.useEffect(() => {
    const p = projects.data?.find((x) => x.id === projectId);
    if (!p) return;
    setSource(p.sourceLanguage === 'auto' ? 'ko' : p.sourceLanguage);
    setTarget(p.targetLanguage);
    setStyle(p.preferences.style);
    setPrefs(p.preferences);
  }, [projectId, projects.data]);

  async function start() {
    setFormError(null);
    if (projectId === NEW_PROJECT && !newProjectName.trim()) {
      setFormError('Name the new project.');
      return;
    }
    setStep(2);
    setStages(STAGES.map((s) => ({ ...s, state: 'pending' })));
    setFailed(null);
    setProblems([]);
    setOverAllowance(null);
    try {
      const chapterPrefs = { ...prefs, style };
      const project =
        projectId === NEW_PROJECT
          ? await createProject(workspace.id, { name: newProjectName, sourceLanguage: source, targetLanguage: target, preferences: chapterPrefs })
          : projects.data!.find((p) => p.id === projectId)!;
      const chapter = await createChapter(workspace.id, project.id, {
        name: chapterName || undefined,
        sourceLanguage: source,
        targetLanguage: target,
        preferences: chapterPrefs,
      });
      setProcessingName(chapter.name);
      const res = await processChapter({
        ownerId: workspace.id,
        chapterId: chapter.id,
        files: items.map((i) => i.file),
        sourceLanguage: source,
        detect,
        onStage: (id, state, message) => setStages((prev) => prev.map((s) => (s.id === id ? { ...s, state, message } : s))),
        onProgress: (done, total, label) => setProgress({ done, total, label }),
      });
      setProblems(res.problems);
      if (res.pageCount === 0) {
        setFailed('None of the uploaded files could be read as pages.');
        return;
      }
      setResult({ chapterId: chapter.id, projectId: project.id });
      setStep(3);

      const plan = planById(workspace.plan);
      const usage = await getUsage(workspace.id);
      if (usage.pagesProcessed > plan.pageAllowance) {
        setOverAllowance(
          `You’ve processed ${formatNumber(usage.pagesProcessed)} pages this month, over the ${plan.name} plan’s ${formatNumber(plan.pageAllowance)}. Billing isn’t connected yet, so nothing was blocked.`,
        );
      }
    } catch (err) {
      setFailed(err instanceof Error ? err.message : 'Processing stopped unexpectedly.');
    }
  }

  const processing = step >= 2;

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
            <UploadZone items={items} onChange={setItems} />
            <div className="mt-5 flex justify-end">
              <Button size="lg" disabled={items.length === 0} onClick={() => setStep(1)}>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Project" htmlFor="proj" hint="Glossary, characters, and memory come from the project.">
                    <Select id="proj" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                      {projects.data?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                      <option value={NEW_PROJECT}>+ New project…</option>
                    </Select>
                  </Field>
                  {projectId === NEW_PROJECT ? (
                    <Field label="New project name" htmlFor="pname" error={formError ?? undefined}>
                      <Input id="pname" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="e.g. The Fallen Hero" autoFocus />
                    </Field>
                  ) : (
                    <ChapterNameField ownerId={workspace.id} projectId={projectId} value={chapterName} onChange={setChapterName} />
                  )}
                  {projectId === NEW_PROJECT && <ChapterNameField ownerId={workspace.id} projectId="" value={chapterName} onChange={setChapterName} />}
                  <Field label="Source language" htmlFor="src" hint="Sets reading order — Japanese reads right to left.">
                    <Select id="src" value={source} onChange={(e) => setSource(e.target.value as LanguageCode)}>
                      <option value="ko">Korean</option>
                      <option value="ja">Japanese</option>
                      <option value="zh">Chinese</option>
                    </Select>
                  </Field>
                  <Field label="Target language" htmlFor="tgt">
                    <Select id="tgt" value={target} onChange={(e) => setTarget(e.target.value as LanguageCode)}>
                      {(['en', 'es', 'fr', 'de', 'pt', 'id'] as const).map((l) => (
                        <option key={l} value={l}>
                          {LANGUAGE_LABELS[l]}
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
                    <Checkbox
                      label="Detect speech bubbles on this device"
                      description="Finds likely text regions for you to review."
                      checked={detect}
                      onChange={(e) => setDetect(e.target.checked)}
                    />
                    {ADVANCED.map((a) => (
                      <Checkbox
                        key={a.key}
                        label={a.label}
                        checked={Boolean(prefs[a.key])}
                        onChange={(e) => setPrefs({ ...prefs, [a.key]: e.target.checked })}
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-[12.5px] leading-relaxed text-ink-faint">
                    Automatic OCR and AI translation need an AI provider, which isn’t connected yet. Everything else —
                    detection, cleaning, typesetting, QA, and export — runs here.
                  </p>
                </div>
              </CardBody>
            </Card>
            <div className="mt-5 flex justify-between">
              <Button variant="ghost" size="lg" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button size="lg" onClick={() => void start()} disabled={!projects.data}>
                Process chapter
                <ArrowRight size={16} />
              </Button>
            </div>
          </>
        )}

        {processing && (
          <ProcessingScreen
            chapterName={processingName}
            stages={stages}
            progress={progress}
            done={step === 3}
            failed={failed}
            problems={problems}
            overAllowance={overAllowance}
            onOpenEditor={() => result && router.push(`/translate/editor?chapter=${result.chapterId}`)}
            onBack={() => {
              if (failed) {
                setStep(1);
                setFailed(null);
              } else if (result) router.push(`/projects/${result.projectId}`);
            }}
          />
        )}
      </div>
    </AppShellPage>
  );
}

function ChapterNameField({
  ownerId,
  projectId,
  value,
  onChange,
}: {
  ownerId: string;
  projectId: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const chapters = useLiveQuery(() => (projectId ? listChapters(ownerId, projectId) : Promise.resolve([])), [ownerId, projectId], ['chapters']);
  const nextNumber = (chapters.data ?? []).reduce((m, c) => Math.max(m, c.number), 0) + 1;
  return (
    <Field label="Chapter name" htmlFor="cname" hint="Leave blank to number it automatically.">
      <Input id="cname" value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Chapter ${String(nextNumber).padStart(2, '0')}`} />
    </Field>
  );
}
