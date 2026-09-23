/**
 * Provider interfaces.
 *
 * Overset must never be welded to one AI vendor. Every external capability
 * goes through one of these interfaces so a provider can be swapped — or
 * A/B benchmarked for cost and quality — without touching the UI.
 *
 * All implementations run SERVER-SIDE ONLY. Provider keys are read from
 * server environment variables and are never shipped to the browser.
 */

import type {
  DialogueRegion,
  LanguageCode,
  Panel,
  Rect,
  RegionType,
  TypesettingProperties,
} from '@/lib/types/domain';

export interface ProviderMeta {
  /** Stable id used in logs, cost attribution, and benchmarking. */
  id: string;
  displayName: string;
  /** Rough cost signal, in cents per page, for the billing model. */
  estimatedCentsPerPage: number;
}

export interface ProviderResult<T> {
  data: T;
  /** Actual measured cost, when the provider reports it. */
  costCents?: number;
  latencyMs?: number;
  providerId: string;
}

/* ------------------------------------------------------------------ vision */

export interface DetectedTextRegion {
  bounds: Rect;
  polygon?: Array<{ x: number; y: number }>;
  type: RegionType;
  confidence: number;
  embeddedInArtwork: boolean;
}

export interface VisionProvider extends ProviderMeta {
  /** Panel layout detection — never used to modify the artwork itself. */
  detectPanels(input: PageImageInput): Promise<ProviderResult<Omit<Panel, 'id' | 'pageId'>[]>>;
  detectTextRegions(input: PageImageInput): Promise<ProviderResult<DetectedTextRegion[]>>;
  /** Reading order across panels — right-to-left, vertical scroll, etc. */
  inferReadingOrder(
    input: PageImageInput,
    regions: DetectedTextRegion[],
  ): Promise<ProviderResult<number[]>>;
}

export interface PageImageInput {
  pageId: string;
  /** Signed, short-lived URL or server-local path. Never a public URL. */
  source: string;
  width: number;
  height: number;
}

/* --------------------------------------------------------------------- ocr */

export interface OcrLine {
  text: string;
  confidence: number;
  bounds: Rect;
}

export interface OcrReadResult {
  text: string;
  romanization?: string;
  detectedLanguage: LanguageCode;
  confidence: number;
  lines: OcrLine[];
  /** Measurements typesetting needs to match the original. */
  estimatedFontSize?: number;
  estimatedLineHeight?: number;
  orientation?: 'horizontal' | 'vertical';
}

export interface OcrProvider extends ProviderMeta {
  read(input: PageImageInput, region: Rect): Promise<ProviderResult<OcrReadResult>>;
  readBatch(
    input: PageImageInput,
    regions: Rect[],
  ): Promise<ProviderResult<OcrReadResult[]>>;
}

/* ------------------------------------------------------------- translation */

/**
 * Structured context handed to the translation model. This is the heart of
 * "translate the story, not isolated sentences" — the model never sees a
 * bare sentence.
 */
export interface TranslationContext {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  currentText: string;
  regionType: RegionType;
  speaker?: {
    name: string;
    role: string;
    voice: string[];
    personality: string[];
    formality: string;
    slang: string;
    speechRules: string[];
    relationships: Array<{ name: string; relation: string }>;
  };
  /** Bubbles immediately before this one, in reading order. */
  surroundingDialogue: Array<{ speaker?: string; source: string; translation?: string }>;
  chapterSummary?: string;
  sceneSummary?: string;
  glossary: Array<{ original: string; translation: string; locked: boolean; type: string }>;
  memory: Array<{ source: string; translation: string; context: string }>;
  style: string;
  preserveHonorifics: boolean;
  culturalNotes?: string[];
  customRules: string[];
  /** Bubble geometry — a hint only. Fit must never outrank meaning. */
  bubbleHint?: { widthPx: number; heightPx: number; estimatedCharsPerLine: number };
}

export interface TranslationOutput {
  literal: string;
  recommended: string;
  alternatives: string[];
  confidence: number;
  ambiguityNote?: string;
  terminologyUsed: Array<{ original: string; translation: string }>;
  culturalNote?: string;
}

export interface TranslationProvider extends ProviderMeta {
  translate(context: TranslationContext): Promise<ProviderResult<TranslationOutput>>;
  translateBatch(contexts: TranslationContext[]): Promise<ProviderResult<TranslationOutput[]>>;
  /** Separate proofreading pass — flags, never silently rewrites. */
  proofread(
    regions: Array<Pick<DialogueRegion, 'id' | 'sourceText' | 'finalTranslation' | 'speakerId'>>,
    context: Omit<TranslationContext, 'currentText' | 'regionType'>,
  ): Promise<ProviderResult<ProofreadFinding[]>>;
}

export interface ProofreadFinding {
  regionId: string;
  category:
    | 'meaning'
    | 'grammar'
    | 'phrasing'
    | 'voice'
    | 'tone'
    | 'terminology'
    | 'name'
    | 'continuity'
    | 'missing'
    | 'duplicate'
    | 'overflow'
    | 'mistranslation'
    | 'cultural';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

/* --------------------------------------------------------- image cleaning */

export interface CleaningRequest {
  input: PageImageInput;
  /** Only these regions may be touched. Everything else must be byte-identical. */
  regions: Array<{ bounds: Rect; polygon?: Array<{ x: number; y: number }>; embeddedInArtwork: boolean }>;
}

export interface CleaningResult {
  cleanedImageRef: string;
  /** Per-region record of what was actually modified, for the compare tool. */
  modifiedRegions: Rect[];
  /** True when pixels outside the requested regions are provably unchanged. */
  outsideRegionsUnchanged: boolean;
}

export interface ImageCleaningProvider extends ProviderMeta {
  /**
   * Removes ONLY the source text and restores the background beneath it.
   * Implementations must never run the whole page through generative
   * regeneration — that risks altering faces, hands, and line art.
   */
  removeText(request: CleaningRequest): Promise<ProviderResult<CleaningResult>>;
}

/* -------------------------------------------------------------- typesetting */

export interface TypesetRequest {
  text: string;
  bubble: { bounds: Rect; polygon?: Array<{ x: number; y: number }> };
  source: { fontSize?: number; lineHeight?: number; align?: string; orientation?: string };
  minReadableFontSize: number;
}

export interface TypesetResult {
  properties: TypesettingProperties;
  lines: string[];
  fits: boolean;
  /** Set when the only way to fit would be an unreadable size. */
  warning?: 'too_long' | 'below_min_font' | 'bubble_too_small';
}

export interface TypesettingProvider extends ProviderMeta {
  fit(request: TypesetRequest): Promise<ProviderResult<TypesetResult>>;
}

/* -------------------------------------------------------------- registry */

export interface ProviderRegistry {
  vision: VisionProvider;
  ocr: OcrProvider;
  translation: TranslationProvider;
  cleaning: ImageCleaningProvider;
  typesetting: TypesettingProvider;
}
