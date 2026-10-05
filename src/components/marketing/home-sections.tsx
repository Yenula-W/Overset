import { ArrowRight } from "lucide-react";
import { MkButton } from "./mk";

export function FinalCta() {
  return (
    <section className="mk-shell flex flex-wrap items-end justify-between gap-8 pb-16 pt-24">
      <h2 className="mk-h2">Your next chapter.</h2>
      <div className="flex flex-col items-start gap-3">
        <MkButton href="/signup">
          Translate free <ArrowRight size={16} aria-hidden />
        </MkButton>
        <span className="text-[12px] text-ink-muted">
          10 pages free · No card required
        </span>
      </div>
    </section>
  );
}
