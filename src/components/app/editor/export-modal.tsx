'use client';

import * as React from 'react';
import { Check, TriangleAlert } from 'lucide-react';
import { Button, Checkbox, Modal, Progress } from '@/components/ui';
import { exportChapter, type DataFormat, type ImageFormat } from '@/lib/imaging/export';
import { downloadBlob, formatBytes } from '@/lib/download';
import type { ChapterRecord, PageRecord, ProjectRecord } from '@/lib/store/schema';
import { qaSummary, type QaFinding } from '@/lib/qa';
import { cn } from '@/lib/utils';

export function ExportModal({
  open,
  onClose,
  project,
  chapter,
  pages,
  findings,
  speakerName,
  loadOriginal,
  onExported,
}: {
  open: boolean;
  onClose: () => void;
  project: ProjectRecord;
  chapter: ChapterRecord;
  pages: PageRecord[];
  findings: QaFinding[];
  speakerName: (id?: string) => string;
  loadOriginal: (page: PageRecord) => Promise<Blob | undefined>;
  onExported: (info: { pages: number; bytes: number }) => Promise<void>;
}) {
  const [imageFormat, setImageFormat] = React.useState<ImageFormat>('png');
  const [dataFormats, setDataFormats] = React.useState<DataFormat[]>(['json']);
  const [includeImages, setIncludeImages] = React.useState(true);
  const [includeSfx, setIncludeSfx] = React.useState(true);
  const [includeMetadata, setIncludeMetadata] = React.useState(true);
  const [runQa, setRunQa] = React.useState(true);
  const [progress, setProgress] = React.useState<{ done: number; total: number; label: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setProgress(null);
      setError(null);
      setDone(null);
    }
  }, [open]);

  const regions = pages.flatMap((p) => p.regions.filter((r) => r.translate));
  const translated = regions.filter((r) => r.finalTranslation.trim()).length;
  const qa = qaSummary(findings);
  const nothingSelected = !includeImages && dataFormats.length === 0;

  function toggleData(f: DataFormat) {
    setDataFormats((d) => (d.includes(f) ? d.filter((x) => x !== f) : [...d, f]));
  }

  async function run() {
    setError(null);
    setDone(null);
    setProgress({ done: 0, total: pages.length, label: 'Starting…' });
    try {
      const { blob, fileName, imageCount } = await exportChapter({
        project,
        chapter,
        pages,
        loadOriginal,
        speakerName,
        options: { imageFormat, dataFormats, includeImages, includeTranslatedSfx: includeSfx, includeMetadata, mode: 'translated' },
        onProgress: (d, t, label) => setProgress({ done: d, total: t, label }),
      });
      downloadBlob(blob, fileName);
      await onExported({ pages: imageCount, bytes: blob.size });
      setDone(`${fileName} · ${formatBytes(blob.size)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The export failed.');
    } finally {
      setProgress(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export chapter"
      description={`${project.name} · ${chapter.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {done ? 'Close' : 'Cancel'}
          </Button>
          <Button onClick={() => void run()} loading={progress !== null} disabled={nothingSelected}>
            {runQa && qa.critical > 0 ? 'Export anyway' : 'Export chapter'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <ul className={cn('space-y-2 rounded-xl border px-4 py-3.5', runQa && qa.critical > 0 ? 'border-warn/30 bg-warnSoft' : 'border-line bg-okSoft')}>
          <Line ok>{`${pages.length} / ${pages.length} pages ready at original resolution`}</Line>
          <Line ok={translated === regions.length}>{`${translated} / ${regions.length} text regions translated`}</Line>
          {runQa && <Line ok={qa.critical === 0}>{`${qa.critical} critical QA ${qa.critical === 1 ? 'issue' : 'issues'}${qa.warning ? ` · ${qa.warning} warnings` : ''}`}</Line>}
        </ul>

        <fieldset disabled={!includeImages}>
          <legend className="text-[13px] font-medium">Image format</legend>
          <div className="mt-2 flex gap-2">
            {(['png', 'jpg', 'webp'] as const).map((f) => (
              <Choice key={f} active={imageFormat === f} onClick={() => setImageFormat(f)}>
                {f}
              </Choice>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[13px] font-medium">Translation data</legend>
          <div className="mt-2 flex gap-2">
            {(['csv', 'json', 'txt'] as const).map((f) => (
              <Choice key={f} active={dataFormats.includes(f)} onClick={() => toggleData(f)}>
                {f}
              </Choice>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2.5 border-t border-line pt-5">
          <Checkbox label="Include translated pages" checked={includeImages} onChange={(e) => setIncludeImages(e.target.checked)} />
          <Checkbox label="Preserve original resolution" description="Always on — pages export at exactly the dimensions they came in at." checked disabled readOnly />
          <Checkbox label="Include translated SFX" checked={includeSfx} onChange={(e) => setIncludeSfx(e.target.checked)} />
          <Checkbox
            label="Include metadata"
            description="Region coordinates and typesetting in the JSON file."
            checked={includeMetadata}
            onChange={(e) => setIncludeMetadata(e.target.checked)}
          />
          <Checkbox label="Run final QA" checked={runQa} onChange={(e) => setRunQa(e.target.checked)} />
        </div>

        {progress && (
          <div aria-live="polite">
            <p className="text-[12.5px] text-ink-muted">{progress.label}</p>
            <Progress value={progress.total ? (progress.done / progress.total) * 100 : 0} className="mt-1.5" label="Export progress" />
          </div>
        )}
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-dangerSoft px-3.5 py-3 text-[13px] text-danger">
            <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}
        {done && (
          <p role="status" className="flex items-center gap-2 rounded-lg bg-okSoft px-3.5 py-3 text-[13px] text-ok">
            <Check size={14} aria-hidden />
            Downloaded {done}
          </p>
        )}
      </div>
    </Modal>
  );
}

function Line({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-[13px]">
      {ok ? <Check size={13} className="text-ok" aria-hidden /> : <TriangleAlert size={13} className="text-warn" aria-hidden />}
      {children}
    </li>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-lg border px-3.5 py-1.5 text-[13px] uppercase transition-colors disabled:opacity-40',
        active ? 'border-accent bg-accent-soft font-medium' : 'border-line hover:border-ink/25',
      )}
    >
      {children}
    </button>
  );
}
