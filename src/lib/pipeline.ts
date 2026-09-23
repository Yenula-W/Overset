/**
 * The chapter processing pipeline.
 *
 * Each stage is addressable and has its own state, so a chapter that fails at
 * (say) cleaning can retry from cleaning instead of re-running OCR and paying
 * for it twice.
 */

export type StageId =
  | 'upload'
  | 'validate'
  | 'dimensions'
  | 'panels'
  | 'regions'
  | 'reading_order'
  | 'ocr'
  | 'classify'
  | 'speaker'
  | 'context'
  | 'translate'
  | 'glossary_check'
  | 'memory_check'
  | 'alternatives'
  | 'clean'
  | 'typeset'
  | 'qa'
  | 'review'
  | 'export';

export type StageState = 'pending' | 'running' | 'complete' | 'failed' | 'skipped';

export interface StageDefinition {
  id: StageId;
  /** Shown in the processing screen — never just a spinner. */
  label: string;
  /** Present-tense label used while the stage is running. */
  activeLabel: string;
  /** Stages that must complete first. */
  requires: StageId[];
  /** Whether a failure here can be retried without redoing earlier work. */
  retryable: boolean;
  /** Which provider the stage bills against, for cost tracking. */
  costCenter?: 'vision' | 'ocr' | 'translation' | 'imageProcessing' | 'storage' | 'exports';
  /** Stages the user can turn off in translation settings. */
  optionalFlag?: string;
}

export const PIPELINE: StageDefinition[] = [
  { id: 'upload', label: 'Upload pages', activeLabel: 'Uploading pages…', requires: [], retryable: true, costCenter: 'storage' },
  { id: 'validate', label: 'Validate files', activeLabel: 'Validating files…', requires: ['upload'], retryable: true },
  { id: 'dimensions', label: 'Record original dimensions', activeLabel: 'Reading page dimensions…', requires: ['validate'], retryable: true },
  { id: 'panels', label: 'Detect panels', activeLabel: 'Detecting panels…', requires: ['dimensions'], retryable: true, costCenter: 'vision' },
  { id: 'regions', label: 'Detect text regions', activeLabel: 'Detecting text…', requires: ['dimensions'], retryable: true, costCenter: 'vision' },
  { id: 'reading_order', label: 'Determine reading order', activeLabel: 'Ordering dialogue…', requires: ['regions', 'panels'], retryable: true, costCenter: 'vision' },
  { id: 'ocr', label: 'Read text', activeLabel: 'Reading dialogue…', requires: ['regions'], retryable: true, costCenter: 'ocr' },
  { id: 'classify', label: 'Classify regions', activeLabel: 'Classifying dialogue, narration, and SFX…', requires: ['ocr'], retryable: true, costCenter: 'vision' },
  { id: 'speaker', label: 'Identify speakers', activeLabel: 'Identifying characters…', requires: ['classify'], retryable: true, costCenter: 'vision' },
  { id: 'context', label: 'Build chapter context', activeLabel: 'Building chapter context…', requires: ['speaker', 'reading_order'], retryable: true },
  { id: 'translate', label: 'Translate dialogue', activeLabel: 'Translating dialogue…', requires: ['context'], retryable: true, costCenter: 'translation' },
  { id: 'glossary_check', label: 'Check terminology', activeLabel: 'Checking terminology…', requires: ['translate'], retryable: true },
  { id: 'memory_check', label: 'Apply translation memory', activeLabel: 'Checking translation memory…', requires: ['translate'], retryable: true, optionalFlag: 'useTranslationMemory' },
  { id: 'alternatives', label: 'Generate alternatives', activeLabel: 'Drafting alternatives…', requires: ['translate'], retryable: true, costCenter: 'translation' },
  { id: 'clean', label: 'Clean text regions', activeLabel: 'Removing original text…', requires: ['regions'], retryable: true, costCenter: 'imageProcessing', optionalFlag: 'removeOriginalText' },
  { id: 'typeset', label: 'Typeset translation', activeLabel: 'Fitting dialogue…', requires: ['clean', 'glossary_check'], retryable: true, costCenter: 'imageProcessing', optionalFlag: 'automaticTypesetting' },
  { id: 'qa', label: 'Run QA', activeLabel: 'Running QA…', requires: ['typeset'], retryable: true, optionalFlag: 'runQaAfterTranslation' },
  { id: 'review', label: 'Human review', activeLabel: 'Ready for review', requires: ['qa'], retryable: false },
  { id: 'export', label: 'Export', activeLabel: 'Exporting chapter…', requires: ['review'], retryable: true, costCenter: 'exports' },
];

export interface StageStatus {
  id: StageId;
  state: StageState;
  /** Unit progress within the stage, 0–1. */
  progress: number;
  message?: string;
  error?: PipelineError;
  startedAt?: string;
  completedAt?: string;
}

export interface PipelineError {
  code: string;
  /** Errors must be specific and actionable — never "Something went wrong". */
  message: string;
  affectedPageIds?: string[];
  retryable: boolean;
  action?: { label: string; kind: 'retry' | 'review' | 'select_speaker' | 'view' };
}

export interface ChapterJob {
  id: string;
  chapterId: string;
  stages: StageStatus[];
  createdAt: string;
  pagesTotal: number;
  pagesComplete: number;
  estimatedSecondsRemaining?: number;
}

export function stageById(id: StageId): StageDefinition {
  const stage = PIPELINE.find((s) => s.id === id);
  if (!stage) throw new Error(`Unknown pipeline stage: ${id}`);
  return stage;
}

/** Stages that are safe to restart given what has already completed. */
export function retryableFrom(stages: StageStatus[]): StageId[] {
  const failed = stages.filter((s) => s.state === 'failed');
  return failed.filter((s) => stageById(s.id).retryable).map((s) => s.id);
}

export function overallProgress(job: ChapterJob): number {
  const total = job.stages.length;
  const done = job.stages.reduce((acc, s) => {
    if (s.state === 'complete' || s.state === 'skipped') return acc + 1;
    if (s.state === 'running') return acc + s.progress;
    return acc;
  }, 0);
  return Math.round((done / total) * 100);
}
