import { ArrowRight } from "lucide-react";
import { MkButton } from "./mk";
import { Magnetic } from "@/components/fx";

export function FinalCta() {
  return (
    <section className="mk-shell flex flex-wrap items-end justify-between gap-8 pb-16 pt-24">
      <h2 className="mk-h2">Your next chapter.</h2>
      <div className="flex flex-col items-start gap-3">
        <Magnetic strength={0.35}>
          <MkButton href="/signup" className="fx-shine px-6 py-3.5 text-[15px]">
            Translate free <ArrowRight size={16} aria-hidden />
          </MkButton>
        </Magnetic>
        <span className="text-[12px] text-ink-muted">
          10 free pages / month · No card required
        </span>
      </div>
    </section>
  );
}
