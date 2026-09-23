import type { Character } from '@/lib/types/domain';

export const DEMO_CHARACTERS: Character[] = [
  {
    id: 'ch-jinseo',
    projectId: 'p-fallen-hero',
    name: 'Jin Seo',
    aliases: ['Jin', 'Seo'],
    role: 'Protagonist',
    color: '#6C63E8',
    voice: ['Casual', 'Sarcastic', 'Confident'],
    personality: ['Confident', 'Sarcastic', 'Loyal under pressure'],
    formality: 'low',
    slang: 'moderate',
    speechRules: [
      'Uses contractions almost always',
      'Rarely uses formal vocabulary, even with elders',
      'Calls Minseo "Min"',
      'Deflects serious moments with a joke before answering honestly',
    ],
    relationships: [
      { characterId: 'ch-minseo', name: 'Minseo', relation: 'Childhood friend' },
      { characterId: 'ch-hyunwoo', name: 'Hyunwoo', relation: 'Rival' },
      { characterId: 'ch-kang', name: 'Master Kang', relation: 'Teacher' },
    ],
    dialogueCount: 1284,
    notes: 'Keeps his register low even in formal settings — that contrast is characterization, not an error.',
  },
  {
    id: 'ch-minseo',
    projectId: 'p-fallen-hero',
    name: 'Minseo',
    aliases: ['Min'],
    role: 'Deuteragonist',
    color: '#4F8A5B',
    voice: ['Warm', 'Direct', 'Dry'],
    personality: ['Practical', 'Protective', 'Quietly stubborn'],
    formality: 'medium',
    slang: 'light',
    speechRules: [
      'Speaks plainly, short sentences under stress',
      'Uses Jin Seo’s full name when she is annoyed with him',
      'Never swears',
    ],
    relationships: [
      { characterId: 'ch-jinseo', name: 'Jin Seo', relation: 'Childhood friend' },
      { characterId: 'ch-kang', name: 'Master Kang', relation: 'Mentor' },
    ],
    dialogueCount: 902,
  },
  {
    id: 'ch-hyunwoo',
    projectId: 'p-fallen-hero',
    name: 'Hyunwoo',
    aliases: ['Hyun'],
    role: 'Rival',
    color: '#B4833A',
    voice: ['Formal', 'Clipped', 'Cold'],
    personality: ['Disciplined', 'Proud', 'Withholding'],
    formality: 'high',
    slang: 'none',
    speechRules: [
      'Full sentences, no contractions',
      'Addresses others by title rather than name',
      'Understates threats rather than shouting them',
    ],
    relationships: [
      { characterId: 'ch-jinseo', name: 'Jin Seo', relation: 'Rival' },
      { characterId: 'ch-kang', name: 'Master Kang', relation: 'Former teacher' },
    ],
    dialogueCount: 477,
  },
  {
    id: 'ch-kang',
    projectId: 'p-fallen-hero',
    name: 'Master Kang',
    aliases: ['Kang', 'the Old Master'],
    role: 'Mentor',
    color: '#B4544A',
    voice: ['Measured', 'Wry', 'Archaic'],
    personality: ['Patient', 'Evasive', 'Amused by his students'],
    formality: 'high',
    slang: 'none',
    speechRules: [
      'Answers questions with questions',
      'Uses older martial terminology that should keep its weight in English',
      'Calls Jin Seo "boy" affectionately',
    ],
    relationships: [
      { characterId: 'ch-jinseo', name: 'Jin Seo', relation: 'Student' },
      { characterId: 'ch-minseo', name: 'Minseo', relation: 'Student' },
    ],
    dialogueCount: 318,
  },
];

export function characterById(id?: string) {
  return DEMO_CHARACTERS.find((c) => c.id === id);
}
