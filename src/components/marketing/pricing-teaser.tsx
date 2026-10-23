import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PLANS } from "@/lib/billing";
import { cn } from "@/lib/utils";

/** Three plans from the real pricing data, so the homepage never drifts from /pricing. */
export function PricingTeaser() {
  const plans = PLANS.filter((plan) => ["free", "creator", "pro"].includes(plan.id));
  return (
    <section className="mk-shell pt-24" aria-labelledby="pricing-teaser-title">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mk-eyebrow m-0 uppercase">Pricing</p>
          <h2 id="pricing-teaser-title" className="mk-h2 mt-3">
            Pay by the page.
          </h2>
        </div>
        <Link href="/pricing" className="editorial-link">
          Compare every plan <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const highlighted = Boolean(plan.highlighted);
          return (
            <Link
              key={plan.id}
              href={plan.href}
              className={cn(
                "fx-lift group flex flex-col rounded-2xl border p-6",
                highlighted
                  ? "border-ink bg-ink text-white shadow-lift"
                  : "border-line bg-white text-ink shadow-card",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold uppercase tracking-[0.1em]">{plan.name}</span>
                {highlighted && (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    Most popular
                  </span>
                )}
              </div>
              <p className="mt-5 flex items-baseline gap-1">
                <span className="text-[44px] font-bold leading-none tracking-[-0.03em]">${plan.priceMonthly}</span>
                <span className={cn("text-[13px]", highlighted ? "text-white/60" : "text-ink-muted")}>/month</span>
              </p>
              <p className={cn("mt-3 text-[14px] leading-snug", highlighted ? "text-white/70" : "text-ink-muted")}>
                {plan.tagline}
              </p>
              <p className="mt-5 flex items-center gap-2 text-[14px] font-medium">
                <Check size={15} aria-hidden className={highlighted ? "text-white" : "text-accent-strong"} />
                {plan.pageAllowance} pages / month
              </p>
              <span
                className={cn(
                  "mt-6 inline-flex items-center gap-2 text-[13px] font-medium",
                  highlighted ? "text-white" : "text-ink",
                )}
              >
                {plan.cta}
                <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
