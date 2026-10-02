import type { StageView } from './processing';

const groups = [
  { id: 'pages', label: 'Save pages', members: ['upload', 'dimensions', 'detect', 'order'] },
  { id: 'translation', label: 'Read & translate', members: ['ocr', 'translate', 'terminology'] },
  { id: 'preview', label: 'Prepare preview', members: ['clean', 'qa'] },
];
export function processingSummary(stages: StageView[]): StageView[] {
  return groups.map(group => {
    const parts = stages.filter(s => group.members.includes(s.id));
    const active = parts.find(s => s.state === 'failed') ?? parts.find(s => s.state === 'running');
    const finished = parts.length === group.members.length && parts.every(s => s.state === 'complete' || s.state === 'skipped');
    return { id: group.id, label: group.label, state: active?.state ?? (finished ? 'complete' : 'pending'),
      message: active?.state === 'running' ? active.label + '…' : undefined };
  });
}
