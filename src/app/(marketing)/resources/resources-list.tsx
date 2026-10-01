"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  PanelArtOne,
  PanelArtTwo,
  PanelArtThree,
} from "@/components/marketing/paper-art";
import { cn } from "@/lib/utils";

type ResType = "Guides" | "Documentation" | "Templates" | "Changelog";
type Level = "Any" | "Beginner" | "Advanced";

interface Resource {
  title: string;
  type: ResType;
  level: Level;
  meta: string;
  href: string;
}

const RESOURCES: Resource[] = [
  {
    title: "Your first chapter",
    type: "Guides",
    level: "Beginner",
    meta: "6 min read",
    href: "/docs",
  },
  {
    title: "A consistent glossary",
    type: "Guides",
    level: "Advanced",
    meta: "9 min read",
    href: "/docs",
  },
  {
    title: "Character voices",
    type: "Guides",
    level: "Beginner",
    meta: "7 min read",
    href: "/docs",
  },
  {
    title: "Webtoon reading order",
    type: "Documentation",
    level: "Advanced",
    meta: "5 min read",
    href: "/docs",
  },
  {
    title: "Typesetting rules for tight bubbles",
    type: "Guides",
    level: "Advanced",
    meta: "8 min read",
    href: "/help",
  },
  {
    title: "Exporting at original dimensions",
    type: "Documentation",
    level: "Beginner",
    meta: "4 min read",
    href: "/docs",
  },
  {
    title: "Translation memory, explained",
    type: "Documentation",
    level: "Beginner",
    meta: "6 min read",
    href: "/docs",
  },
  {
    title: "Glossary template: action fantasy",
    type: "Templates",
    level: "Beginner",
    meta: "CSV",
    href: "/docs",
  },
  {
    title: "Changelog — September 2026",
    type: "Changelog",
    level: "Any",
    meta: "Release notes",
    href: "/changelog",
  },
];

const TYPES: ResType[] = ["Guides", "Documentation", "Templates", "Changelog"];
const LEVELS: Level[] = ["Any", "Beginner", "Advanced"];

const ARTS = [PanelArtOne, PanelArtTwo, PanelArtThree];

export function ResourcesList() {
  const [type, setType] = React.useState<ResType | "All">("All");
  const [level, setLevel] = React.useState<Level>("Any");
  const visible = RESOURCES.filter(
    (r) =>
      (type === "All" || r.type === type) &&
      (level === "Any" || r.level === level || r.level === "Any"),
  );
  const lead = visible[0];
  const LeadArt = lead
    ? ARTS[RESOURCES.indexOf(lead) % ARTS.length]
    : PanelArtOne;
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-5 border-b border-line pb-5">
        <div className="flex flex-wrap gap-1" aria-label="Resource categories">
          {(["All", ...TYPES] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={cn(
                "min-h-11 rounded-full px-4 text-[13px] transition-colors",
                type === t ? "bg-ink text-white" : "hover:bg-[#eeede8]",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-ink-muted" aria-live="polite">
            {visible.length} resources
          </span>
          <label className="sr-only" htmlFor="resource-level">
            Experience level
          </label>
          <select
            id="resource-level"
            value={level}
            onChange={(e) => setLevel(e.target.value as Level)}
            className="min-h-11 rounded-full border border-line bg-transparent px-4 text-[12px]"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l === "Any" ? "All levels" : l}
              </option>
            ))}
          </select>
        </div>
      </div>
      {lead ? (
        <div className="grid items-start gap-9 lg:grid-cols-[1.1fr_1fr]">
          <Link href={lead.href} className="resource-feature group">
            <div className="relative h-[300px] overflow-hidden rounded-xl bg-[#ddddd2] sm:h-[400px]">
              <div className="resource-cover">
                <LeadArt />
              </div>
              <span className="absolute bottom-5 right-5 grid h-12 w-12 place-items-center rounded-full bg-white text-ink">
                <ArrowUpRight size={20} aria-hidden />
              </span>
            </div>
            <div className="mt-5 flex items-center justify-between text-[11px] text-ink-muted">
              <span>{lead.type}</span>
              <span>{lead.level === "Any" ? "Updates" : lead.level}</span>
            </div>
            <h2 className="mt-2 text-[32px] font-medium tracking-[-.035em]">
              {lead.title}
            </h2>
          </Link>
          <ul className="m-0 list-none border-t border-ink p-0">
            {visible.slice(1).map((r) => {
              const Art = ARTS[RESOURCES.indexOf(r) % ARTS.length];
              return (
                <li key={r.title}>
                  <Link href={r.href} className="resource-row group">
                    <div className="resource-thumb" aria-hidden>
                      <Art />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-ink-muted">
                        {r.type}
                      </span>
                      <h2 className="mt-1 text-[17px] font-medium tracking-[-.015em]">
                        {r.title}
                      </h2>
                    </div>
                    <ArrowUpRight
                      size={17}
                      className="shrink-0 text-ink-muted transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="mb-5 text-ink-muted">
            No resources match these filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setType("All");
              setLevel("Any");
            }}
            className="min-h-11 rounded-full border border-line px-5 text-[13px]"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
