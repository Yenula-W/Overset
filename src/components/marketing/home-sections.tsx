import { ArrowRight } from "lucide-react";
import { MkButton, UploadBar } from "./mk";
import { Magnetic } from "@/components/fx";

/**
 * Closing call to action: a dark panel with a soft accent glow, the upload bar
 * front and center, and the free-tier line directly under it. Pages with a
 * different main action (for example Teams) can swap the wording, the button
 * and drop the upload bar.
 */
export function FinalCta({
  eyebrow = "Overset keeps the page. You keep the reader.",
  title = "Your next chapter.",
  cta = { href: "/signup", label: "Translate free" },
  note = "10 free pages / month · No card required",
  showUpload = true,
}: {
  eyebrow?: string;
  title?: string;
  cta?: { href: string; label: string };
  note?: string;
  showUpload?: boolean;
}) {
  return (
    <section className="mk-shell pb-16 pt-24">
      <div className="relative isolate overflow-hidden rounded-3xl bg-ink px-6 py-14 text-white sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-32 -z-10 size-[520px] rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(circle, rgb(108 99 232 / .55), transparent 65%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 left-1/4 -z-10 size-[420px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgb(140 133 255 / .45), transparent 65%)" }}
        />
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
          <div>
            <p className="m-0 text-[11px] font-medium uppercase tracking-[0.12em] text-white/60">
              {eyebrow}
            </p>
            <h2 className="mk-h2 mt-4 max-w-[12ch] text-white">{title}</h2>
          </div>
          <div className="flex flex-col items-start gap-4">
            {showUpload && <UploadBar className="w-full border-white/20" />}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <Magnetic strength={0.35}>
                <MkButton
                  href={cta.href}
                  variant="accent"
                  className="fx-shine px-6 py-3.5 text-[15px]"
                >
                  {cta.label} <ArrowRight size={16} aria-hidden />
                </MkButton>
              </Magnetic>
              <span className="text-[12px] text-white/60">{note}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
