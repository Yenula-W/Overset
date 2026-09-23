import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { WorkspacePreview } from '@/components/demo/workspace-preview';
import { Reveal } from './section';

const METRICS = [
  { value: '43', label: 'pages' },
  { value: '186', label: 'dialogue regions' },
  { value: '4', label: 'characters' },
  { value: '97%', label: 'OCR confidence' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-4 pt-14 sm:pt-20">
      <div className="shell">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            AI localization for comics
          </span>
          <h1 className="mt-7 text-hero font-semibold text-balance">
            Stop translating
            <br />
            bubble by bubble.
          </h1>
          <p className="lede mx-auto mt-7 max-w-2xl text-pretty">
            Upload your chapter. Overset detects, translates, cleans, and typesets every panel while preserving
            context, terminology, character voice, and the original artwork.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/signup" size="lg">
              Translate a chapter free
              <ArrowRight size={16} />
            </Button>
            <Button href="/how-it-works" variant="secondary" size="lg">
              See how it works
            </Button>
          </div>
          <p className="mt-4 text-[13px] text-ink-faint">30 pages free · No credit card required</p>
        </Reveal>

        <Reveal delay={120} className="mt-16">
          <WorkspacePreview />
        </Reveal>

        <Reveal delay={200}>
          <dl className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
            {METRICS.map((m) => (
              <div key={m.label} className="text-center">
                <dt className="sr-only">{m.label}</dt>
                <dd>
                  <span className="block text-[28px] font-semibold tracking-[-0.03em]">{m.value}</span>
                  <span className="mt-0.5 block text-[13px] text-ink-muted">{m.label}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-center text-[12px] text-ink-faint">
            Demo project metrics from a fictional chapter created for Overset.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
