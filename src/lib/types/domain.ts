/**
 * Overset domain model.
 *
 * These types are the contract shared by the UI, the mock service layer, and
 * (eventually) the real backend + database. Nothing here is UI-specific.
 */

export type ID = string;
export type ISODate = string;

/* ------------------------------------------------------------------ users */

export type PlanId = 'free' | 'creator' | 'pro' | 'team' | 'publisher';

export interface User {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: ISODate;
  onboardingComplete: boolean;
  preferences: UserPreferences;
}

export interface UserPreferences {
  primaryMedium?: 'manhwa' | 'manga' | 'webtoon' | 'other';
  role?: 'individual' | 'creator' | 'group' | 'publisher';
  primarySourceLanguage?: LanguageCode;
  theme?: 'light' | 'dark' | 'system';
  reduceMotion?: boolean;
}

export interface Subscription {
  id: ID;
  userId: ID;
  plan: PlanId;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  interval: 'month' | 'year';
  currentPeriodStart: ISODate;
  currentPeriodEnd: ISODate;
  seats: number;
  /** Pages included per cycle by the plan. */
  pageAllowance: number;
  /** Extra pages purchased on top of the allowance. */
  additionalCredits: number;
  cancelAtPeriodEnd: boolean;
}

/* -------------------------------------------------------------- languages */

export type LanguageCode = 'ko' | 'ja' | 'zh' | 'en' | 'es' | 'fr' | 'de' | 'pt' | 'id' | 'auto';

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  auto: 'Auto detect',
  ko: 'Korean',
  ja: 'Japanese',
  zh: 'Chinese',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  id: 'Indonesian',
};

/* --------------------------------------------------------------- projects */

export type TranslationStyle = 'natural' | 'faithful' | 'localized' | 'custom';

export interface TranslationPreferences {
  style: TranslationStyle;
  /** Keep -ssi / -nim / hyung etc. rather than flattening them away. */
  preserveHonorifics: boolean;
  translateSfx: boolean;
  automaticTypesetting: boolean;
  removeOriginalText: boolean;
  useTranslationMemory: boolean;
  useCharacterProfiles: boolean;
  runQaAfterTranslation: boolean;
  /** Romanize names, or use an approved localized spelling. */
  nameHandling: 'romanize' | 'localize' | 'keep-source';
  /** Free-form rules the translator wants the model to respect. */
  customRules: string[];
}

export const DEFAULT_TRANSLATION_PREFERENCES: TranslationPreferences = {
  style: 'natural',
  preserveHonorifics: true,
  translateSfx: true,
  automaticTypesetting: true,
  removeOriginalText: true,
  useTranslationMemory: true,
  useCharacterProfiles: true,
  runQaAfterTranslation: true,
  nameHandling: 'romanize',
  customRules: [],
};

export interface Project {
  id: ID;
  ownerId: ID;
  name: string;
  description?: string;
  coverColor: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  preferences: TranslationPreferences;
  createdAt: ISODate;
  updatedAt: ISODate;
  chapterCount: number;
  pageCount: number;
  characterCount: number;
  glossaryCount: number;
  teamMemberIds: ID[];
}

/* --------------------------------------------------------------- chapters */

export type ChapterStatus =
  | 'draft'
  | 'uploading'
  | 'processing'
  | 'review'
  | 'proofreading'
  | 'typesetting'
  | 'complete'
  | 'failed';

export interface Chapter {
  id: ID;
  projectId: ID;
  name: string;
  number: number;
  status: ChapterStatus;
  pageCount: number;
  regionCount: number;
  approvedRegionCount: number;
  createdAt: ISODate;
  /** 0–100, derived from approved regions. */
  progress: number;
  qaStatus: 'not_run' | 'passing' | 'issues' | 'running';
  exportStatus: 'none' | 'queued' | 'ready' | 'failed';
}

/* ------------------------------------------------------------------ pages */

export interface Page {
  id: ID;
  chapterId: ID;
  order: number;
  /** Original pixel dimensions — exports MUST match these. */
  width: number;
  height: number;
  originalUrl: string;
  cleanedUrl?: string;
  translatedUrl?: string;
  thumbnailUrl?: string;
  panels: Panel[];
  regions: DialogueRegion[];
  qaIssueIds: ID[];
}

export interface Panel {
  id: ID;
  pageId: ID;
  order: number;
  bounds: Rect;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/* -------------------------------------------------------- dialogue region */

export type RegionType =
  | 'dialogue'
  | 'thought'
  | 'narration'
  | 'sfx'
  | 'sign'
  | 'label'
  | 'title'
  | 'background';

export const REGION_TYPE_LABELS: Record<RegionType, string> = {
  dialogue: 'Dialogue',
  thought: 'Thought',
  narration: 'Narration',
  sfx: 'SFX',
  sign: 'Sign',
  label: 'Label',
  title: 'Title',
  background: 'Background text',
};

export type ApprovalStatus = 'untranslated' | 'machine' | 'edited' | 'approved' | 'rejected';

export interface DialogueRegion {
  id: ID;
  pageId: ID;
  /** Percentage-based so overlays scale with any render size. */
  bounds: Rect;
  /** Optional finer mask for text sitting directly on artwork. */
  polygon?: Array<{ x: number; y: number }>;
  type: RegionType;
  readingOrder: number;
  panelId?: ID;
  sourceLanguage: LanguageCode;
  sourceText: string;
  romanization?: string;
  speakerId?: ID;
  literalTranslation: string;
  finalTranslation: string;
  alternatives: string[];
  ocrConfidence: number;
  translationConfidence: number;
  status: ApprovalStatus;
  /** Text baked into artwork needs inpainting rather than a bubble refill. */
  embeddedInArtwork: boolean;
  translate: boolean;
  contextUsed: ContextReference[];
  typesetting: TypesettingProperties;
  ambiguityNote?: string;
}

export interface ContextReference {
  kind: 'character' | 'previous_dialogue' | 'glossary' | 'memory' | 'chapter' | 'scene' | 'rule';
  label: string;
  detail?: string;
}

export interface TypesettingProperties {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  rotation: number;
  outline: boolean;
  direction: 'horizontal' | 'vertical';
  autoFit: boolean;
  /** Set when the translation cannot fit at a readable size. */
  overflow?: 'none' | 'tight' | 'overflowing';
}

export const DEFAULT_TYPESETTING: TypesettingProperties = {
  fontFamily: 'Comic Neue',
  fontSize: 15,
  fontWeight: 600,
  align: 'center',
  lineHeight: 1.15,
  letterSpacing: 0,
  rotation: 0,
  outline: false,
  direction: 'horizontal',
  autoFit: true,
  overflow: 'none',
};

/* ------------------------------------------------------------- characters */

export interface Character {
  id: ID;
  projectId: ID;
  name: string;
  aliases: string[];
  role: string;
  color: string;
  voice: string[];
  personality: string[];
  formality: 'low' | 'medium' | 'high';
  slang: 'none' | 'light' | 'moderate' | 'heavy';
  speechRules: string[];
  relationships: CharacterRelationship[];
  dialogueCount: number;
  notes?: string;
}

export interface CharacterRelationship {
  characterId: ID;
  name: string;
  relation: string;
}

/* --------------------------------------------------------------- glossary */

export type GlossaryType =
  | 'name'
  | 'location'
  | 'ability'
  | 'organization'
  | 'title'
  | 'item'
  | 'technique'
  | 'idiom'
  | 'honorific'
  | 'term';

export type GlossaryStatus = 'suggested' | 'approved' | 'locked';

export interface GlossaryEntry {
  id: ID;
  projectId: ID;
  original: string;
  romanization?: string;
  translation: string;
  alternatives: string[];
  type: GlossaryType;
  notes?: string;
  status: GlossaryStatus;
  occurrences: number;
  firstAppearance?: string;
  lastAppearance?: string;
  characterIds: ID[];
}

/* ------------------------------------------------------- translation memory */

export interface MemoryEntry {
  id: ID;
  projectId: ID;
  sourceText: string;
  translation: string;
  speakerId?: ID;
  speakerName?: string;
  chapterName: string;
  regionLabel: string;
  context: string;
  approvedAt: ISODate;
  occurrences: number;
}

/* --------------------------------------------------------------------- qa */

export type QaSeverity = 'critical' | 'warning' | 'info';

export type QaCategory =
  | 'missing_dialogue'
  | 'untranslated'
  | 'terminology'
  | 'character_name'
  | 'low_ocr_confidence'
  | 'low_translation_confidence'
  | 'character_voice'
  | 'reading_order'
  | 'typesetting_overflow'
  | 'missing_sfx'
  | 'grammar'
  | 'duplicate_text'
  | 'rule_violation';

export interface QaIssue {
  id: ID;
  chapterId: ID;
  pageId?: ID;
  regionId?: ID;
  category: QaCategory;
  severity: QaSeverity;
  title: string;
  detail: string;
  /** What the user can do about it — never auto-applied for literary calls. */
  action: { label: string; kind: 'fix' | 'review' | 'view' };
  resolved: boolean;
}

/* ----------------------------------------------------------- team & audit */

export type TeamRole = 'owner' | 'translator' | 'proofreader' | 'typesetter' | 'viewer';

export interface TeamMember {
  id: ID;
  name: string;
  email: string;
  role: TeamRole;
  avatarColor: string;
  lastActive: ISODate;
  status: 'active' | 'invited';
}

export interface Comment {
  id: ID;
  regionId?: ID;
  chapterId: ID;
  authorId: ID;
  authorName: string;
  body: string;
  createdAt: ISODate;
  resolved: boolean;
  replies: Comment[];
}

export type VersionEventKind =
  | 'ai_translation'
  | 'human_edit'
  | 'approval'
  | 'glossary_update'
  | 'typeset'
  | 'ocr_edit'
  | 'export';

export interface VersionEvent {
  id: ID;
  chapterId: ID;
  regionId?: ID;
  kind: VersionEventKind;
  actor: string;
  summary: string;
  before?: string;
  after?: string;
  createdAt: ISODate;
}

/* ------------------------------------------------------------------ usage */

export interface UsageSnapshot {
  periodLabel: string;
  periodResetsAt: ISODate;
  pagesUsed: number;
  pagesIncluded: number;
  additionalCredits: number;
  breakdown: { label: string; value: string }[];
  storageGb: number;
  /** Internal cost tracking — pricing must be validated against this. */
  costCents?: CostBreakdown;
}

export interface CostBreakdown {
  ocr: number;
  vision: number;
  translation: number;
  imageProcessing: number;
  storage: number;
  exports: number;
}

/* ---------------------------------------------------------------- exports */

export interface ExportRequest {
  chapterId: ID;
  imageFormat: 'png' | 'jpg' | 'webp';
  dataFormats: Array<'csv' | 'json' | 'txt'>;
  bundle: 'files' | 'zip';
  preserveOriginalResolution: boolean;
  includeTranslatedSfx: boolean;
  includeMetadata: boolean;
  runFinalQa: boolean;
}
