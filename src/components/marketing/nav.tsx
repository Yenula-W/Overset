"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { OversetMark } from "@/components/brand";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./mk";

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function MarketingNav() {
  const pathname = usePathname();
  const track = React.useRef<HTMLDivElement>(null);
  const [hover, setHover] = React.useState<number | null>(null);
  const [marker, setMarker] = React.useState({ x: 0, width: 0 });
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => { setOpen(false); setHover(null); }, [pathname]);

  React.useLayoutEffect(() => {
    const root = track.current;
    if (!root) return;
    const measure = () => {
      const index =
        hover ?? NAV_LINKS.findIndex((l) => isActive(pathname, l.href));
      const link = root.querySelectorAll("a")[index];
      setMarker({ x: link?.offsetLeft ?? 0, width: link?.offsetWidth ?? 0 });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [pathname, hover]);

  React.useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-line bg-[#fbfbf9]">
      <nav
        className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-8"
        aria-label="Main"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 text-ink hover:text-ink"
          aria-label="Overset home"
        >
          <OversetMark size={32} className="text-ink" />
          <span className="text-[15px] font-extrabold tracking-[0.06em]">
            OVERSET
          </span>
        </Link>

        <div
          ref={track}
          className="nav-track hidden lg:flex"
          onMouseLeave={() => setHover(null)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setHover(null);
          }}
        >
          <span
            className="nav-marker"
            aria-hidden
            style={{
              transform: `translateX(${marker.x}px)`,
              width: marker.width,
              opacity: marker.width ? 1 : 0,
            }}
          />
          {NAV_LINKS.map((l, index) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                onMouseEnter={() => setHover(index)}
                onFocus={() => setHover(index)}
                className={cn("nav-link", active && "text-ink")}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-[18px] lg:flex">
          <Link
            href="/login"
            className="text-[14px] text-ink-muted hover:text-accent"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-accent hover:text-white"
          >
            Translate free
          </Link>
        </div>

        <button
          className="-mr-2 p-2 text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="about-demo-reveal border-b border-line bg-mk-page lg:hidden">
          <div className="flex flex-col px-4 pb-5 pt-2">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(pathname, l.href) ? "page" : undefined}
                className="border-b border-line py-3.5 text-[17px] font-semibold text-ink"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-5 flex gap-2">
              <Link
                href="/login"
                className="flex-1 border border-mk-input bg-white py-3 text-center text-[15px] text-ink"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="flex-1 bg-ink py-3 text-center text-[15px] font-medium text-white hover:text-white"
              >
                Translate free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
