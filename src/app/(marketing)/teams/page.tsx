import type { Metadata } from 'next';
import { ArrowRight, Check } from 'lucide-react';
import { Button, Card, Field, Input, Textarea } from '@/components/ui';
import { Section } from '@/components/marketing/section';

export const metadata: Metadata = {
  title: 'For teams and publishers',
  description: 'Shared translation memory, role-based workflows, and high-volume processing for localization teams.',
};

const FEATURES = [
  ['Central translation memory', 'Every approved line becomes searchable for everyone on the team, across every project.'],
  ['Shared terminology', 'One locked glossary per project. Nobody has to guess which spelling was agreed on in chapter four.'],
  ['Role-based workflows', 'Translator, proofreader, and typesetter each get the view and the permissions their step needs.'],
  ['Character database', 'Voice, formality, speech rules, and relationships travel with the project rather than living in a chat log.'],
  ['Quality assurance', 'A terminology, voice, and continuity pass runs across the whole chapter before anything ships.'],
  ['API access', 'Queue chapters, pull translated pages, and sync terminology from your own systems.'],
  ['High-volume processing', 'Priority queues and custom limits for teams running many chapters a week.'],
  ['Team analytics', 'Pages processed, review turnaround, and terminology drift across projects.'],
];

const WORKFLOW = ['AI translation', 'Translator review', 'Proofreader', 'Typesetter', 'Final approval'];

export default function TeamsPage() {
  return (
    <>
      <section className="pt-16 sm:pt-24">
        <div className="shell max-w-3xl">
          <p className="eyebrow">For teams</p>
          <h1 className="mt-4 text-section font-semibold text-balance">
            Localization infrastructure
            <br className="hidden sm:block" /> for entire teams.
          </h1>
          <p className="lede mt-6 text-pretty">
            Shared memory, shared terminology, and a review workflow that matches how localization teams actually
            divide the work.
          </p>
          <div className="mt-8">
            <Button href="#contact" size="lg">
              Talk to us
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      <Section eyebrow="Workflow" title="Every step has an owner.">
        <ol className="mt-10 grid gap-2 sm:grid-cols-5">
          {WORKFLOW.map((step, i) => (
            <li key={step} className="rounded-xl border border-line bg-surface p-4">
              <span className="text-[12px] font-semibold tabular-nums text-accent">{String(i + 1).padStart(2, '0')}</span>
              <p className="mt-1.5 text-[14px] font-medium">{step}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          Comments attach to individual dialogue regions, so a question about one bubble stays on that bubble. Approved
          human work is versioned and never overwritten without a record of what changed.
        </p>
      </Section>

      <Section id="api" eyebrow="What teams get" title="Built for volume and for handoffs.">
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-2">
          {FEATURES.map(([title, body]) => (
            <div key={title} className="bg-surface p-6">
              <div className="flex items-start gap-2.5">
                <Check size={15} className="mt-1 shrink-0 text-accent" aria-hidden />
                <div>
                  <h3 className="text-[15px] font-semibold">{title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">{body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="contact" eyebrow="Contact" title="Tell us about your volume.">
        <Card className="mt-10 max-w-xl p-6">
          <form className="space-y-4">
            <Field label="Name" htmlFor="c-name">
              <Input id="c-name" name="name" autoComplete="name" placeholder="Your name" />
            </Field>
            <Field label="Work email" htmlFor="c-email">
              <Input id="c-email" name="email" type="email" autoComplete="email" placeholder="you@studio.com" />
            </Field>
            <Field label="Chapters per month" htmlFor="c-volume" hint="A rough number is fine.">
              <Input id="c-volume" name="volume" placeholder="e.g. 40" />
            </Field>
            <Field label="What are you localizing?" htmlFor="c-notes">
              <Textarea id="c-notes" name="notes" placeholder="Series, languages, team size, anything else worth knowing." />
            </Field>
            <Button type="submit" size="lg" className="w-full">
              Send
            </Button>
          </form>
        </Card>
      </Section>
    </>
  );
}
