import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { MkButton } from "@/components/marketing/mk";

export const metadata: Metadata = {
  title: "For teams",
  description:
    "Shared terminology and review workflows for comic localization teams.",
};
const WORKFLOW = ["Translate", "Proofread", "Typeset", "Approve"];
const FEATURES = [
  ["Shared memory", "Approved dialogue and terminology, in one place."],
  ["Character voices", "Keep every speaker consistent across chapters."],
  ["Review together", "Comments and handoffs attached to the work."],
  [
    "Publisher workflows",
    "Discuss API access, processing volume, and custom limits.",
  ],
];
export default function TeamsPage() {
  return (
    <>
      <section className="mk-shell pt-14">
        <span className="mk-eyebrow">For teams</span>
        <h1 className="mk-display mt-4">
          One team.
          <br />
          One workspace.
        </h1>
        <p className="mt-6 max-w-lg text-[16px] text-ink-muted">
          Shared terminology. Clear handoffs. A consistent story.
        </p>
        <div className="mt-8">
          <MkButton href="/contact">
            Talk to us <ArrowRight size={15} aria-hidden />
          </MkButton>
        </div>
      </section>
      <section className="mk-shell pt-20">
        <h2 className="mk-h2">From first draft to final page.</h2>
        <ol className="mt-8 grid gap-3 sm:grid-cols-4">
          {WORKFLOW.map((step, i) => (
            <li
              key={step}
              className="flex min-h-36 flex-col justify-between rounded-xl border border-line bg-white p-6"
            >
              <span className="font-mono text-[11px] text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex items-center justify-between text-[19px] font-semibold">
                {step}
                {i === 3 ? (
                  <Check size={18} className="text-ok" aria-hidden />
                ) : (
                  <ArrowRight
                    size={18}
                    className="text-ink-muted"
                    aria-hidden
                  />
                )}
              </span>
            </li>
          ))}
        </ol>
      </section>
      <section className="mk-shell grid gap-x-12 pb-16 pt-16 sm:grid-cols-2">
        {FEATURES.map(([title, copy]) => (
          <div key={title} className="border-t border-line py-7">
            <h2 className="text-[20px] font-semibold">{title}</h2>
            <p className="mt-2 text-[14px] text-ink-muted">{copy}</p>
          </div>
        ))}
      </section>
    </>
  );
}
