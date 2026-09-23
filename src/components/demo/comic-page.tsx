'use client';

import * as React from 'react';
import { DemoComicPage, PAGE_H, PAGE_W } from './artwork';
import type { DialogueRegion, Rect } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

export type PageView = 'original' | 'detected' | 'cleaned' | 'translated' | 'typeset';

/** Percentage bounds → page pixels. One conversion, used everywhere. */
export function toPixels(bounds: Rect) {
  return {
    x: (bounds.x / 100) * PAGE_W,
    y: (bounds.y / 100) * PAGE_H,
    width: (bounds.width / 100) * PAGE_W,
    height: (bounds.height / 100) * PAGE_H,
  };
}

/**
 * Greedy wrap against a measured character budget.
 *
 * Line breaks are chosen before font size is touched: shrinking text is the
 * last resort, never the first, because unreadable lettering fails the reader
 * more than a slightly loose bubble does.
 */
export function wrapText(text: string, charsPerLine: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > charsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const REGION_TONE: Record<string, { stroke: string; fill: string; label: string }> = {
  dialogue: { stroke: '#6C63E8', fill: 'rgba(108,99,232,0.10)', label: 'Dialogue' },
  thought: { stroke: '#6C63E8', fill: 'rgba(108,99,232,0.08)', label: 'Thought' },
  narration: { stroke: '#4F8A5B', fill: 'rgba(79,138,91,0.10)', label: 'Narration' },
  sfx: { stroke: '#B4833A', fill: 'rgba(180,131,58,0.12)', label: 'SFX' },
  sign: { stroke: '#B4544A', fill: 'rgba(180,84,74,0.10)', label: 'Sign' },
  label: { stroke: '#686868', fill: 'rgba(104,104,104,0.10)', label: 'Label' },
  title: { stroke: '#686868', fill: 'rgba(104,104,104,0.10)', label: 'Title' },
  background: { stroke: '#686868', fill: 'rgba(104,104,104,0.08)', label: 'Background' },
};

/** Bubble shell — drawn separately from the artwork so cleaning can strip the
 *  text while leaving the bubble itself completely untouched. */
function BubbleShell({ region }: { region: DialogueRegion }) {
  const b = toPixels(region.bounds);
  if (region.type === 'sfx') return null;

  if (region.type === 'narration') {
    return (
      <g>
        <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#FFFFFF" stroke="#1C1C20" strokeWidth="2.5" />
      </g>
    );
  }

  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  const tailDir = cx > PAGE_W / 2 ? -1 : 1;
  return (
    <g>
      <path
        d={`M ${cx + tailDir * b.width * 0.06} ${b.y + b.height * 0.92}
            L ${cx + tailDir * b.width * 0.2} ${b.y + b.height * 1.26}
            L ${cx + tailDir * b.width * 0.26} ${b.y + b.height * 0.86} Z`}
        fill="#FFFFFF"
        stroke="#1C1C20"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <ellipse cx={cx} cy={cy} rx={b.width / 2} ry={b.height / 2} fill="#FFFFFF" stroke="#1C1C20" strokeWidth="2.5" />
    </g>
  );
}

function BubbleText({ region, view }: { region: DialogueRegion; view: PageView }) {
  const b = toPixels(region.bounds);
  const t = region.typesetting;
  const translated = view === 'translated' || view === 'typeset';
  const text = translated ? region.finalTranslation : region.sourceText;

  if (view === 'cleaned') return null;
  if (region.type === 'sfx') {
    // SFX sits on artwork; the original is painted by the artwork layer.
    if (!translated) return null;
    return (
      <text
        x={b.x + b.width / 2}
        y={b.y + b.height * 0.75}
        textAnchor="middle"
        fontSize={t.fontSize * 1.9}
        fontWeight={900}
        fill="#1C1C20"
        stroke="#FFFFFF"
        strokeWidth={t.outline ? 5 : 0}
        paintOrder="stroke"
        transform={`rotate(${t.rotation} ${b.x + b.width / 2} ${b.y + b.height * 0.75})`}
        style={{ letterSpacing: '0.04em' }}
      >
        {text}
      </text>
    );
  }

  const fontSize = t.fontSize * 1.25;
  const charWidth = fontSize * 0.5;
  const charsPerLine = Math.max(8, Math.floor((b.width * 0.82) / charWidth));
  const lines = translated ? wrapText(text, charsPerLine) : wrapText(text, Math.max(8, Math.floor(charsPerLine * 0.62)));
  const lineHeight = fontSize * t.lineHeight * 1.25;
  const startY = b.y + b.height / 2 - ((lines.length - 1) * lineHeight) / 2 + fontSize * 0.34;
  const anchor = t.align === 'left' ? 'start' : t.align === 'right' ? 'end' : 'middle';
  const x = t.align === 'left' ? b.x + b.width * 0.07 : t.align === 'right' ? b.x + b.width * 0.93 : b.x + b.width / 2;

  return (
    <text
      textAnchor={anchor}
      fontSize={fontSize}
      fontWeight={t.fontWeight}
      fill="#141418"
      style={{ letterSpacing: `${t.letterSpacing}em` }}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} y={startY + i * lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function RegionOverlay({
  region,
  index,
  selected,
  onSelect,
  showLabel,
  subtle = false,
}: {
  region: DialogueRegion;
  index: number;
  selected: boolean;
  onSelect?: (id: string) => void;
  showLabel: boolean;
  /** Editor views other than "detected" keep overlays quiet so the art leads. */
  subtle?: boolean;
}) {
  const b = toPixels(region.bounds);
  const tone = REGION_TONE[region.type] ?? REGION_TONE.dialogue;
  const stroke = selected ? '#6C63E8' : tone.stroke;

  return (
    <g
      className="animate-region-in cursor-pointer"
      style={{ animationDelay: `${index * 55}ms`, opacity: subtle && !selected ? 0.42 : 1 }}
      onClick={onSelect ? () => onSelect(region.id) : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={`${tone.label} region ${String(index + 1).padStart(2, '0')}`}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(region.id);
              }
            }
          : undefined
      }
    >
      <rect
        x={b.x - 6}
        y={b.y - 6}
        width={b.width + 12}
        height={b.height + 12}
        rx="6"
        fill={selected ? 'rgba(108,99,232,0.16)' : tone.fill}
        stroke={stroke}
        strokeWidth={selected ? 3.5 : 2}
        strokeDasharray={selected ? undefined : '7 5'}
      />
      {(!subtle || selected) && (
      <g>
        <rect x={b.x - 6} y={b.y - 28} width={showLabel ? 26 + tone.label.length * 7.2 : 26} height="22" rx="5" fill={stroke} />
        <text x={b.x + 7} y={b.y - 12.5} fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
          {String(index + 1).padStart(2, '0')}
        </text>
        {showLabel && (
          <text x={b.x + 22} y={b.y - 12.5} fontSize="11" fontWeight="600" fill="#FFFFFF">
            {tone.label}
          </text>
        )}
      </g>
      )}
    </g>
  );
}

export function ComicPage({
  view = 'original',
  regions,
  selectedRegionId,
  onSelectRegion,
  showLabels = false,
  className,
  interactive = false,
}: {
  view?: PageView;
  regions: DialogueRegion[];
  selectedRegionId?: string;
  onSelectRegion?: (id: string) => void;
  showLabels?: boolean;
  className?: string;
  interactive?: boolean;
}) {
  const ordered = React.useMemo(() => [...regions].sort((a, b) => a.readingOrder - b.readingOrder), [regions]);
  // The baked-in SFX lettering disappears only once the page has been cleaned.
  const artworkTextVisible = view === 'original' || view === 'detected';

  return (
    <svg
      viewBox={`0 0 ${PAGE_W} ${PAGE_H}`}
      className={cn('block h-auto w-full', className)}
      role="img"
      aria-label={`Demo comic page, ${view} view`}
      preserveAspectRatio="xMidYMid meet"
    >
      <DemoComicPage showArtworkText={artworkTextVisible} />
      {ordered.map((r) => (
        <BubbleShell key={`shell-${r.id}`} region={r} />
      ))}
      {ordered.map((r) => (
        <BubbleText key={`text-${r.id}`} region={r} view={view} />
      ))}
      {view === 'detected' &&
        ordered.map((r, i) => (
          <RegionOverlay
            key={`ov-${r.id}`}
            region={r}
            index={i}
            selected={r.id === selectedRegionId}
            onSelect={interactive ? onSelectRegion : undefined}
            showLabel={showLabels}
          />
        ))}
      {view !== 'detected' &&
        interactive &&
        ordered.map((r, i) => (
          <RegionOverlay
            key={`hit-${r.id}`}
            region={r}
            index={i}
            selected={r.id === selectedRegionId}
            onSelect={onSelectRegion}
            showLabel={false}
            subtle
          />
        ))}
    </svg>
  );
}
