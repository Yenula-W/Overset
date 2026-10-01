'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ResType = 'Guides' | 'Documentation' | 'Templates' | 'Changelog';
type Level = 'Any' | 'Beginner' | 'Advanced';

interface Resource {
  title: string;
  type: ResType;
  level: Level;
  meta: string;
  href: string;
}

const RESOURCES: Resource[] = [
  { title: 'Your first chapter', type: 'Guides', level: 'Beginner', meta: '6 min read', href: '/docs' },
  { title: 'A consistent glossary', type: 'Guides', level: 'Advanced', meta: '9 min read', href: '/docs' },
  { title: 'Character voices', type: 'Guides', level: 'Beginner', meta: '7 min read', href: '/docs' },
  { title: 'Webtoon reading order', type: 'Documentation', level: 'Advanced', meta: '5 min read', href: '/docs' },
  { title: 'Typesetting rules for tight bubbles', type: 'Guides', level: 'Advanced', meta: '8 min read', href: '/help' },
  { title: 'Exporting at original dimensions', type: 'Documentation', level: 'Beginner', meta: '4 min read', href: '/docs' },
  { title: 'Translation memory, explained', type: 'Documentation', level: 'Beginner', meta: '6 min read', href: '/docs' },
  { title: 'Glossary template: action fantasy', type: 'Templates', level: 'Beginner', meta: 'CSV', href: '/docs' },
  { title: 'Changelog — September 2026', type: 'Changelog', level: 'Any', meta: 'Release notes', href: '/changelog' },
];

const TYPES: ResType[] = ['Guides', 'Documentation', 'Templates', 'Changelog'];
const LEVELS: Level[] = ['Any', 'Beginner', 'Advanced'];

export function ResourcesList() {
  const [types, setTypes] = React.useState<Partial<Record<ResType, boolean>>>({});
  const [level, setLevel] = React.useState<Level>('Any');

  const anyType = !Object.values(types).some(Boolean);
  const visible = RESOURCES.filter(
    (r) => (anyType || types[r.type]) && (level === 'Any' || r.level === level || r.level === 'Any'),
  );

  return (
    <div className="flex flex-wrap items-start gap-10">
      <aside className="flex min-w-[220px] flex-col gap-7" style={{ flex: '0 1 240px' }} aria-label="Filters">
        <span className="text-[14px] text-ink-faint" aria-live="polite">
          {visible.length} results
        </span>
        <fieldset className="m-0 flex flex-col gap-3.5 border-0 p-0">
          <legend className="mb-3.5 p-0 text-[15px] font-bold">Type</legend>
          {TYPES.map((t) => {
            const on = Boolean(types[t]);
            return (
              <label key={t} className="flex cursor-pointer items-center gap-2.5 text-[14px]">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={on}
                  onChange={() => setTypes((s) => ({ ...s, [t]: !s[t] }))}
                />
                <span
                  className={cn(
                    'flex h-[18px] w-[18px] items-center justify-center border-[1.5px] border-ink text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent',
                    on ? 'bg-ink' : 'bg-white',
                  )}
                  aria-hidden
                >
                  {on && <Check size={12} strokeWidth={3} />}
                </span>
                {t}
              </label>
            );
          })}
        </fieldset>
        <fieldset className="m-0 flex flex-col gap-3.5 border-0 p-0">
          <legend className="mb-3.5 p-0 text-[15px] font-bold">Level</legend>
          <div className="flex gap-1.5">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={level === l}
                onClick={() => setLevel(l)}
                className={cn(
                  'border border-mk-input px-3 py-[9px] text-[13px] transition-colors',
                  level === l ? 'bg-ink text-white' : 'bg-white text-ink hover:border-ink',
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </fieldset>
      </aside>

      <ul
        className="m-0 grid list-none gap-x-5 gap-y-8 p-0"
        style={{ flex: '1 1 600px', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))' }}
      >
        {visible.map((r) => {
          const n = String(RESOURCES.indexOf(r) + 1).padStart(2, '0');
          return (
            <li key={r.title}>
              <Link href={r.href} className="group flex flex-col gap-2.5 text-ink hover:text-ink">
                <div className="flex aspect-[4/3] flex-col justify-between bg-mk-tile p-[18px] transition-colors group-hover:bg-accent-soft">
                  <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-ink-muted">{r.type.toUpperCase()}</span>
                  <span className="text-[64px] font-extrabold leading-none tracking-[-0.04em]" aria-hidden>
                    {n}
                  </span>
                </div>
                <span className="text-[16px] font-semibold leading-[1.3] tracking-[-0.01em] group-hover:text-accent">{r.title}</span>
                <span className="text-[12.5px] text-ink-faint">
                  {r.meta} • {r.level}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
