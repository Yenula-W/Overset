import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared primitives for the 2026 marketing redesign: square corners, flat
 * black buttons, purple as the only accent.
 */

export const NAV_LINKS = [
  { href: "/", label: "Product" },
  { href: "/about", label: "About" },
  { href: "/resources", label: "Resources" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export function MkButton({
  href,
  children,
  variant = "solid",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline" | "accent";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-medium transition-colors",
        variant === "solid" &&
          "bg-ink px-4 py-2.5 text-white hover:bg-accent hover:text-white",
        variant === "accent" &&
          "bg-accent px-4 py-3 text-white hover:bg-accent-strong hover:text-white",
        variant === "outline" &&
          "border border-mk-input bg-white px-[18px] py-3 text-ink hover:border-ink hover:text-ink",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** The fake upload bar used in the hero and final CTA — a big, obvious way in. */
export function UploadBar({
  href = "/signup",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Upload a chapter — start translating free"
      className={cn(
        "group flex h-14 border border-mk-input bg-white hover:text-ink",
        className,
      )}
    >
      <span className="flex flex-1 items-center truncate px-[18px] text-[14px] text-ink-faint">
        Drop a chapter — PNG, JPG, WEBP, PDF, ZIP
      </span>
      <span className="flex w-14 shrink-0 items-center justify-center bg-ink text-white transition-colors group-hover:bg-accent">
        <ArrowRight size={18} aria-hidden />
      </span>
    </Link>
  );
}

/** Segmented control: white track, black active item, square corners. */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
  size = "sm",
}: {
  items: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex gap-[2px] self-start rounded-full border border-mk-input bg-white p-[3px]"
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "min-h-10 rounded-full transition-colors",
              size === "sm"
                ? "px-[14px] py-[7px] text-[13px] font-semibold"
                : "px-5 py-2.5 text-[14px] font-medium",
              active ? "bg-ink text-white" : "text-ink hover:text-accent",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function MkSection({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("mk-shell pb-10 pt-[100px]", className)}>
      {children}
    </section>
  );
}
