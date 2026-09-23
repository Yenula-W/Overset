'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { Button, Checkbox, Modal } from '@/components/ui';
import type { ExportRequest } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

export function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [request, setRequest] = React.useState<ExportRequest>({
    chapterId: 'c-fh-14',
    imageFormat: 'png',
    dataFormats: ['json'],
    bundle: 'zip',
    preserveOriginalResolution: true,
    includeTranslatedSfx: true,
    includeMetadata: true,
    runFinalQa: true,
  });

  function toggleData(format: 'csv' | 'json' | 'txt') {
    setRequest((r) => ({
      ...r,
      dataFormats: r.dataFormats.includes(format) ? r.dataFormats.filter((f) => f !== format) : [...r.dataFormats, format],
    }));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export chapter"
      description="The Fallen Hero · Chapter 14"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Export chapter</Button>
        </>
      }
    >
      <div className="space-y-6">
        <ul className="space-y-2 rounded-xl border border-line bg-okSoft px-4 py-3.5">
          {['43 / 43 pages ready', '186 / 186 dialogue regions translated', '0 critical QA issues'].map((line) => (
            <li key={line} className="flex items-center gap-2 text-[13px]">
              <Check size={13} className="text-ok" aria-hidden />
              {line}
            </li>
          ))}
        </ul>

        <div>
          <p className="text-[13px] font-medium">Image format</p>
          <div className="mt-2 flex gap-2">
            {(['png', 'jpg', 'webp'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setRequest({ ...request, imageFormat: f })}
                aria-pressed={request.imageFormat === f}
                className={cn(
                  'rounded-lg border px-3.5 py-1.5 text-[13px] uppercase transition-colors',
                  request.imageFormat === f ? 'border-accent bg-accent-soft font-medium' : 'border-line hover:border-ink/25',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[13px] font-medium">Translation data</p>
          <div className="mt-2 flex gap-2">
            {(['csv', 'json', 'txt'] as const).map((f) => (
              <button
                key={f}
                onClick={() => toggleData(f)}
                aria-pressed={request.dataFormats.includes(f)}
                className={cn(
                  'rounded-lg border px-3.5 py-1.5 text-[13px] uppercase transition-colors',
                  request.dataFormats.includes(f) ? 'border-accent bg-accent-soft font-medium' : 'border-line hover:border-ink/25',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 border-t border-line pt-5">
          <Checkbox
            label="Preserve original resolution"
            description="Pages export at exactly the dimensions they came in at."
            checked={request.preserveOriginalResolution}
            onChange={(e) => setRequest({ ...request, preserveOriginalResolution: e.target.checked })}
          />
          <Checkbox
            label="Include translated SFX"
            checked={request.includeTranslatedSfx}
            onChange={(e) => setRequest({ ...request, includeTranslatedSfx: e.target.checked })}
          />
          <Checkbox
            label="Include metadata"
            description="Region coordinates, speakers, confidence, and glossary terms used."
            checked={request.includeMetadata}
            onChange={(e) => setRequest({ ...request, includeMetadata: e.target.checked })}
          />
          <Checkbox
            label="Run final QA"
            checked={request.runFinalQa}
            onChange={(e) => setRequest({ ...request, runFinalQa: e.target.checked })}
          />
        </div>
      </div>
    </Modal>
  );
}
