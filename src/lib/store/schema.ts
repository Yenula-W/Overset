import type {
  Character,
  ChapterStatus,
  DialogueRegion,
  GlossaryEntry,
  LanguageCode,
  MemoryEntry,
  PlanId,
  TeamMember,
  TranslationPreferences,
  UserPreferences,
  VersionEvent,
} from '@/lib/types/domain';

/** Records as persisted. Counts and progress are derived, never stored. */

export interface UserRecord {
  id: string;
  name: string;
  /** Always lowercased; unique. */
  email: string;
  passwordHash: string;
  salt: string;
  iterations: number;
  createdAt: string;
  onboardingComplete: boolean;
  preferences: UserPreferences & {
    emailOnProcessed?: boolean;
    emailOnComment?: boolean;
  };
  plan: PlanId;
}

/** A user as the UI sees them — never carries credentials. */
export type PublicUser = Omit<UserRecord, 'passwordHash' | 'salt' | 'iterations'>;

export interface ProjectRecord {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  coverColor: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  preferences: TranslationPreferences;
  createdAt: string;
  updatedAt: string;
}

export type StageState = 'pending' | 'running' | 'complete' | 'skipped' | 'failed';

export interface ChapterRecord {
  id: string;
  ownerId: string;
  projectId: string;
  name: string;
  number: number;
  status: ChapterStatus;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  preferences: TranslationPreferences;
  /** Per-stage outcome of the last processing run, keyed by stage id. */
  stages: Record<string, { state: StageState; message?: string }>;
  createdAt: string;
  updatedAt: string;
  lastExportedAt?: string;
}

export interface PageRecord {
  id: string;
  ownerId: string;
  chapterId: string;
  order: number;
  fileName: string;
  mimeType: string;
  bytes: number;
  /** Original pixel dimensions — exports always match these. */
  width: number;
  height: number;
  originalBlobId: string;
  thumbBlobId: string;
  regions: DialogueRegion[];
  createdAt: string;
}

export interface BlobRecord {
  id: string;
  ownerId: string;
  kind: 'original' | 'thumb';
  blob: Blob;
}

export interface CharacterRecord extends Character {
  ownerId: string;
}

export interface GlossaryRecord extends GlossaryEntry {
  ownerId: string;
}

export interface MemoryRecord extends MemoryEntry {
  ownerId: string;
  /** The region this entry was approved from, so re-approving updates it. */
  sourceRegionId?: string;
}

export interface CommentRecord {
  id: string;
  ownerId: string;
  chapterId: string;
  pageId: string;
  regionId: string;
  parentId?: string;
  authorName: string;
  body: string;
  createdAt: string;
  resolved: boolean;
}

export interface VersionRecord extends VersionEvent {
  regionSnapshot?: DialogueRegion[];
  ownerId: string;
  pageId?: string;
  /** Which field a restore should write `before` back into. */
  field?: 'finalTranslation' | 'sourceText';
}

export interface TeamRecord extends TeamMember {
  ownerId: string;
}

export interface UsageRecord {
  /** `${ownerId}:${YYYY-MM}` */
  id: string;
  ownerId: string;
  period: string;
  pagesProcessed: number;
  pagesExported: number;
  additionalCredits?: number;
  creditsUsed?: number;
  remaining?: number;
  resetsAt?: string;
  hasSubscription?: boolean;
}
