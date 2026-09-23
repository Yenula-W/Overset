import Link from 'next/link';
import { StatusBadge, Progress } from '@/components/ui';
import type { Chapter, Project } from '@/lib/types/domain';
import { LANGUAGE_LABELS } from '@/lib/types/domain';
import { formatNumber } from '@/lib/utils';

const STATUS_TONE: Record<Chapter['status'], { tone: 'ok' | 'accent' | 'warn' | 'neutral' | 'danger'; label: string }> = {
  draft: { tone: 'neutral', label: 'Draft' },
  uploading: { tone: 'accent', label: 'Uploading' },
  processing: { tone: 'accent', label: 'Processing' },
  review: { tone: 'warn', label: 'Review' },
  proofreading: { tone: 'warn', label: 'Proofreading' },
  typesetting: { tone: 'warn', label: 'Typesetting' },
  complete: { tone: 'ok', label: 'Complete' },
  failed: { tone: 'danger', label: 'Failed' },
};

export function chapterStatus(status: Chapter['status']) {
  return STATUS_TONE[status];
}

export function ProjectCard({ project, latest }: { project: Project; latest?: Chapter }) {
  const status = latest ? STATUS_TONE[latest.status] : undefined;
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col rounded-xl2 border border-line bg-surface p-5 transition-[border-color,box-shadow] hover:border-ink/20 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="h-9 w-9 shrink-0 rounded-lg" style={{ background: project.coverColor }} aria-hidden />
        {status && <StatusBadge tone={status.tone} label={status.label} />}
      </div>
      <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.01em]">{project.name}</h3>
      <p className="mt-1 text-[13px] text-ink-muted">
        {LANGUAGE_LABELS[project.sourceLanguage]} → {LANGUAGE_LABELS[project.targetLanguage]}
      </p>
      {latest && (
        <>
          <div className="mt-4 flex items-baseline justify-between text-[12.5px]">
            <span className="text-ink-muted">{latest.name}</span>
            <span className="tabular-nums font-medium">{latest.progress}%</span>
          </div>
          <Progress value={latest.progress} className="mt-1.5" label={`${latest.name} progress`} />
        </>
      )}
      <dl className="mt-5 flex gap-5 border-t border-line pt-4 text-[12px] text-ink-muted">
        <div>
          <dt className="sr-only">Chapters</dt>
          <dd>
            <span className="font-medium text-ink">{project.chapterCount}</span> chapters
          </dd>
        </div>
        <div>
          <dt className="sr-only">Pages</dt>
          <dd>
            <span className="font-medium text-ink">{formatNumber(project.pageCount)}</span> pages
          </dd>
        </div>
        <div>
          <dt className="sr-only">Glossary terms</dt>
          <dd>
            <span className="font-medium text-ink">{project.glossaryCount}</span> terms
          </dd>
        </div>
      </dl>
    </Link>
  );
}
