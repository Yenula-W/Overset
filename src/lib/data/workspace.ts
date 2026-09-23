import {
  DEFAULT_TRANSLATION_PREFERENCES,
  type Chapter,
  type Comment,
  type MemoryEntry,
  type Project,
  type Subscription,
  type TeamMember,
  type UsageSnapshot,
  type User,
  type VersionEvent,
} from '@/lib/types/domain';

export const DEMO_USER: User = {
  id: 'u-1',
  name: 'Yenula',
  email: 'yenula@panelflow.ai',
  createdAt: '2026-02-11T09:00:00Z',
  onboardingComplete: true,
  preferences: { primaryMedium: 'manhwa', role: 'individual', primarySourceLanguage: 'ko' },
};

export const DEMO_SUBSCRIPTION: Subscription = {
  id: 'sub-1',
  userId: 'u-1',
  plan: 'pro',
  status: 'active',
  interval: 'month',
  currentPeriodStart: '2026-09-01T00:00:00Z',
  currentPeriodEnd: '2026-10-01T00:00:00Z',
  seats: 1,
  pageAllowance: 1000,
  additionalCredits: 0,
  cancelAtPeriodEnd: false,
};

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'p-fallen-hero',
    ownerId: 'u-1',
    name: 'The Fallen Hero',
    description: 'Murim serial. Heavy terminology, four recurring speakers, honorifics preserved.',
    coverColor: '#6C63E8',
    sourceLanguage: 'ko',
    targetLanguage: 'en',
    preferences: { ...DEFAULT_TRANSLATION_PREFERENCES, style: 'natural', preserveHonorifics: true },
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-09-21T18:42:00Z',
    chapterCount: 14,
    pageCount: 612,
    characterCount: 7,
    glossaryCount: 48,
    teamMemberIds: ['u-1', 'u-2', 'u-3'],
  },
  {
    id: 'p-eclipse',
    ownerId: 'u-1',
    name: 'Project Eclipse',
    description: 'Modern urban fantasy. Lighter register, lots of SFX.',
    coverColor: '#4F8A5B',
    sourceLanguage: 'ko',
    targetLanguage: 'en',
    preferences: { ...DEFAULT_TRANSLATION_PREFERENCES, style: 'localized', preserveHonorifics: false },
    createdAt: '2026-04-18T10:00:00Z',
    updatedAt: '2026-09-20T22:10:00Z',
    chapterCount: 27,
    pageCount: 1104,
    characterCount: 11,
    glossaryCount: 76,
    teamMemberIds: ['u-1'],
  },
  {
    id: 'p-crimson-moon',
    ownerId: 'u-1',
    name: 'Crimson Moon',
    description: 'Romance drama. Character voice matters more than terminology here.',
    coverColor: '#B4544A',
    sourceLanguage: 'ko',
    targetLanguage: 'en',
    preferences: { ...DEFAULT_TRANSLATION_PREFERENCES, style: 'natural' },
    createdAt: '2026-05-30T10:00:00Z',
    updatedAt: '2026-09-22T14:05:00Z',
    chapterCount: 14,
    pageCount: 488,
    characterCount: 9,
    glossaryCount: 31,
    teamMemberIds: ['u-1', 'u-2'],
  },
  {
    id: 'p-tower-zero',
    ownerId: 'u-1',
    name: 'Tower Zero',
    description: 'Japanese-source tower climb. Vertical text throughout.',
    coverColor: '#B4833A',
    sourceLanguage: 'ja',
    targetLanguage: 'en',
    preferences: { ...DEFAULT_TRANSLATION_PREFERENCES, style: 'faithful' },
    createdAt: '2026-07-08T10:00:00Z',
    updatedAt: '2026-09-19T11:30:00Z',
    chapterCount: 8,
    pageCount: 276,
    characterCount: 6,
    glossaryCount: 22,
    teamMemberIds: ['u-1', 'u-4'],
  },
];

export const DEMO_CHAPTERS: Chapter[] = [
  { id: 'c-fh-14', projectId: 'p-fallen-hero', name: 'Chapter 14', number: 14, status: 'review', pageCount: 43, regionCount: 186, approvedRegionCount: 154, createdAt: '2026-09-21T18:00:00Z', progress: 83, qaStatus: 'issues', exportStatus: 'none' },
  { id: 'c-fh-13', projectId: 'p-fallen-hero', name: 'Chapter 13', number: 13, status: 'complete', pageCount: 41, regionCount: 178, approvedRegionCount: 178, createdAt: '2026-09-14T18:00:00Z', progress: 100, qaStatus: 'passing', exportStatus: 'ready' },
  { id: 'c-fh-12', projectId: 'p-fallen-hero', name: 'Chapter 12', number: 12, status: 'complete', pageCount: 44, regionCount: 192, approvedRegionCount: 192, createdAt: '2026-09-07T18:00:00Z', progress: 100, qaStatus: 'passing', exportStatus: 'ready' },
  { id: 'c-ecl-27', projectId: 'p-eclipse', name: 'Chapter 27', number: 27, status: 'complete', pageCount: 46, regionCount: 291, approvedRegionCount: 291, createdAt: '2026-09-20T18:00:00Z', progress: 100, qaStatus: 'passing', exportStatus: 'ready' },
  { id: 'c-cm-14', projectId: 'p-crimson-moon', name: 'Chapter 14', number: 14, status: 'processing', pageCount: 38, regionCount: 164, approvedRegionCount: 136, createdAt: '2026-09-22T13:00:00Z', progress: 83, qaStatus: 'running', exportStatus: 'none' },
  { id: 'c-tz-08', projectId: 'p-tower-zero', name: 'Chapter 08', number: 8, status: 'review', pageCount: 34, regionCount: 142, approvedRegionCount: 61, createdAt: '2026-09-19T09:00:00Z', progress: 43, qaStatus: 'issues', exportStatus: 'none' },
];

export const DEMO_TEAM: TeamMember[] = [
  { id: 'u-1', name: 'Yenula', email: 'yenula@panelflow.ai', role: 'owner', avatarColor: '#6C63E8', lastActive: '2026-09-22T19:12:00Z', status: 'active' },
  { id: 'u-2', name: 'Alex Rhee', email: 'alex@panelflow.ai', role: 'proofreader', avatarColor: '#4F8A5B', lastActive: '2026-09-22T17:40:00Z', status: 'active' },
  { id: 'u-3', name: 'Dana Okafor', email: 'dana@panelflow.ai', role: 'typesetter', avatarColor: '#B4833A', lastActive: '2026-09-22T12:05:00Z', status: 'active' },
  { id: 'u-4', name: 'Sam Ito', email: 'sam@panelflow.ai', role: 'translator', avatarColor: '#B4544A', lastActive: '2026-09-21T20:15:00Z', status: 'invited' },
];

export const DEMO_MEMORY: MemoryEntry[] = [
  { id: 'm-1', projectId: 'p-fallen-hero', sourceText: '그림자 문이 다시 열렸다.', translation: 'The Shadow Gate has opened again.', speakerId: 'ch-kang', speakerName: 'Master Kang', chapterName: 'Chapter 07', regionLabel: 'Bubble 18', context: 'First reveal of the organization', approvedAt: '2026-06-02T14:20:00Z', occurrences: 4 },
  { id: 'm-2', projectId: 'p-fallen-hero', sourceText: '그림자 문 사람들은 기다리지 않는다.', translation: 'The Shadow Gate does not wait for anyone.', speakerId: 'ch-hyunwoo', speakerName: 'Hyunwoo', chapterName: 'Chapter 13', regionLabel: 'Bubble 42', context: 'Threat delivered flatly', approvedAt: '2026-09-14T19:02:00Z', occurrences: 2 },
  { id: 'm-3', projectId: 'p-fallen-hero', sourceText: '천마신공을 이어받을 자격.', translation: 'The right to inherit the Heavenly Demon Divine Art.', speakerId: 'ch-kang', speakerName: 'Master Kang', chapterName: 'Chapter 09', regionLabel: 'Bubble 24', context: 'Terminology first locked here', approvedAt: '2026-07-19T16:45:00Z', occurrences: 6 },
  { id: 'm-4', projectId: 'p-fallen-hero', sourceText: '너 진짜 그렇게 생각해?', translation: 'You seriously think that?', speakerId: 'ch-jinseo', speakerName: 'Jin Seo', chapterName: 'Chapter 11', regionLabel: 'Bubble 29', context: 'Same sarcastic register as Chapter 14', approvedAt: '2026-08-24T11:12:00Z', occurrences: 3 },
  { id: 'm-5', projectId: 'p-fallen-hero', sourceText: '사형, 그만하세요.', translation: 'Sahyeong, that is enough.', speakerId: 'ch-minseo', speakerName: 'Minseo', chapterName: 'Chapter 12', regionLabel: 'Bubble 07', context: 'Honorific preserved per project setting', approvedAt: '2026-09-07T20:30:00Z', occurrences: 5 },
];

export const DEMO_COMMENTS: Comment[] = [
  {
    id: 'cm-1',
    regionId: 'r-06',
    chapterId: 'c-fh-14',
    authorId: 'u-2',
    authorName: 'Alex Rhee',
    body: '@Yenula Should we preserve the honorific here, or is "boy" doing enough work already?',
    createdAt: '2026-09-22T18:12:00Z',
    resolved: false,
    replies: [
      {
        id: 'cm-1-r1',
        chapterId: 'c-fh-14',
        authorId: 'u-1',
        authorName: 'Yenula',
        body: '"boy" is right — 아이야 is affectionate, not a title. Leaving it.',
        createdAt: '2026-09-22T18:26:00Z',
        resolved: false,
        replies: [],
      },
    ],
  },
  {
    id: 'cm-2',
    regionId: 'r-07',
    chapterId: 'c-fh-14',
    authorId: 'u-3',
    authorName: 'Dana Okafor',
    body: 'KRAKK reads better than BOOM against that impact line. Keeping the rotation as-is.',
    createdAt: '2026-09-22T16:44:00Z',
    resolved: true,
    replies: [],
  },
];

export const DEMO_VERSIONS: VersionEvent[] = [
  { id: 'v-1', chapterId: 'c-fh-14', regionId: 'r-05', kind: 'human_edit', actor: 'Yenula', summary: 'Edited Bubble 05', before: 'Jin Seo, if you step back now, sahyeong will never stop.', after: 'Jin Seo — if you back off now, sahyeong will never stop.', createdAt: '2026-09-22T19:42:00Z' },
  { id: 'v-2', chapterId: 'c-fh-14', regionId: 'r-07', kind: 'typeset', actor: 'Dana Okafor', summary: 'Adjusted SFX rotation on Bubble 07', createdAt: '2026-09-22T19:35:00Z' },
  { id: 'v-3', chapterId: 'c-fh-14', kind: 'ai_translation', actor: 'PanelFlow', summary: 'AI translation generated for 186 regions', createdAt: '2026-09-22T19:31:00Z' },
  { id: 'v-4', chapterId: 'c-fh-14', kind: 'glossary_update', actor: 'Yenula', summary: 'Locked “Heavenly Demon Divine Art”', before: 'Heavenly Demon Technique', after: 'Heavenly Demon Divine Art', createdAt: '2026-09-22T19:29:00Z' },
  { id: 'v-5', chapterId: 'c-fh-14', regionId: 'r-01', kind: 'approval', actor: 'Alex Rhee', summary: 'Approved Bubble 01', createdAt: '2026-09-22T19:20:00Z' },
];

export const DEMO_USAGE: UsageSnapshot = {
  periodLabel: 'September',
  periodResetsAt: '2026-10-01T00:00:00Z',
  pagesUsed: 621,
  pagesIncluded: 1000,
  additionalCredits: 0,
  storageGb: 1.8,
  breakdown: [
    { label: 'Translation', value: '621 pages' },
    { label: 'Cleaning', value: '382 pages' },
    { label: 'SFX', value: '117 pages' },
    { label: 'Storage', value: '1.8 GB' },
  ],
};

export function projectById(id: string) {
  return DEMO_PROJECTS.find((p) => p.id === id);
}

export function chaptersForProject(id: string) {
  return DEMO_CHAPTERS.filter((c) => c.projectId === id);
}
