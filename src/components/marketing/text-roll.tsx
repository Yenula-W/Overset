import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Letters roll up and are replaced from below when the nearest `.roll-host`
 * is hovered or focused. Adapted from Skiper UI's text roll (skiper58) as
 * CSS transitions, so it costs no JavaScript and also plays on keyboard focus.
 */
export function TextRoll({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const letters = children.split("");
  const middle = (letters.length - 1) / 2;
  const row = (hidden?: boolean) => (
    <span className="roll-row" aria-hidden>
      {letters.map((letter, i) => (
        <span
          key={i}
          className="roll-letter"
          style={{ "--roll-delay": `${Math.abs(i - middle) * 22}ms` } as React.CSSProperties}
          data-under={hidden || undefined}
        >
          {letter === " " ? " " : letter}
        </span>
      ))}
    </span>
  );
  return (
    <span className={cn("roll", className)}>
      <span className="sr-only">{children}</span>
      {row()}
      {row(true)}
    </span>
  );
}
