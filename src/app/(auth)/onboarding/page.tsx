'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { readSession, writeSession } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface Step {
  key: 'medium' | 'role' | 'language';
  title: string;
  question: string;
  options: Array<{ value: string; label: string; detail: string }>;
}

const STEPS: Step[] = [
  {
    key: 'medium',
    title: 'Welcome to PanelFlow.',
    question: 'What do you primarily translate?',
    options: [
      { value: 'manhwa', label: 'Manhwa', detail: 'Korean, usually vertical scroll' },
      { value: 'manga', label: 'Manga', detail: 'Japanese, right-to-left pages' },
      { value: 'webtoon', label: 'Webtoons', detail: 'Long vertical episodes' },
      { value: 'other', label: 'Other comics', detail: 'Anything else with panels and bubbles' },
    ],
  },
  {
    key: 'role',
    title: 'A little about you.',
    question: 'What best describes you?',
    options: [
      { value: 'individual', label: 'Individual translator', detail: 'Working on your own' },
      { value: 'creator', label: 'Creator', detail: 'Localizing your own work' },
      { value: 'group', label: 'Translation group', detail: 'A few people sharing the work' },
      { value: 'publisher', label: 'Publisher', detail: 'Running localization at volume' },
    ],
  },
  {
    key: 'language',
    title: 'Last one.',
    question: 'What language do you primarily translate from?',
    options: [
      { value: 'ko', label: 'Korean', detail: 'Honorifics preserved by default' },
      { value: 'ja', label: 'Japanese', detail: 'Vertical text supported' },
      { value: 'zh', label: 'Chinese', detail: 'Simplified and traditional' },
      { value: 'other', label: 'Other', detail: 'You can set this per project' },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const step = STEPS[index];
  const answered = answers[step.key];
  const last = index === STEPS.length - 1;

  function next() {
    if (!last) {
      setIndex((i) => i + 1);
      return;
    }
    const session = readSession();
    if (session) writeSession({ ...session, onboardingComplete: true });
    router.push('/translate');
  }

  return (
    <div className="w-full max-w-[560px]">
      <div className="mb-8 flex items-center gap-1.5" role="group" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <span
            key={s.key}
            className={cn('h-1 flex-1 rounded-full transition-colors duration-300', i <= index ? 'bg-accent' : 'bg-line')}
          />
        ))}
      </div>

      <h1 className="text-[30px] font-semibold tracking-[-0.03em]">{step.title}</h1>
      <p className="mt-2 text-[15.5px] text-ink-muted">{step.question}</p>

      <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
        {step.options.map((opt) => {
          const selected = answered === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setAnswers((a) => ({ ...a, [step.key]: opt.value }))}
              aria-pressed={selected}
              className={cn(
                'rounded-xl border p-4 text-left transition-colors',
                selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-ink/25',
              )}
            >
              <span className="block text-[15px] font-medium">{opt.label}</span>
              <span className="mt-0.5 block text-[12.5px] text-ink-muted">{opt.detail}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="text-[13.5px] text-ink-muted transition-colors hover:text-ink disabled:opacity-0"
        >
          Back
        </button>
        <Button size="lg" onClick={next} disabled={!answered}>
          {last ? 'Start your first translation' : 'Continue'}
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
