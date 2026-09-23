/**
 * Original fictional demo artwork for PanelFlow.
 *
 * Every page here is drawn from scratch as SVG. No commercial manhwa art,
 * characters, or text is used anywhere in the product or its marketing.
 * Drawing the pages as vectors also means the demos can render the same page
 * at any size across the detection, cleaning, and typesetting states.
 */

import * as React from 'react';

export const PAGE_W = 840;
export const PAGE_H = 1180;

const INK = '#1C1C20';
const LINE = '#2A2A30';

function Hatch({ id, angle = 45, gap = 6, opacity = 0.5 }: { id: string; angle?: number; gap?: number; opacity?: number }) {
  return (
    <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
      <line x1="0" y1="0" x2="0" y2={gap} stroke={INK} strokeWidth="1" opacity={opacity} />
    </pattern>
  );
}

/** Stylized figure — silhouette and line work only, no recognizable likeness. */
function Figure({
  x,
  y,
  scale = 1,
  tone = '#3A3A44',
  hair = '#1C1C20',
  flip = false,
  cloak = false,
}: {
  x: number;
  y: number;
  scale?: number;
  tone?: string;
  hair?: string;
  flip?: boolean;
  cloak?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {cloak && (
        <path d="M-52 40 L-34 -16 L34 -16 L52 40 L38 168 L-38 168 Z" fill={tone} opacity="0.92" />
      )}
      <path d="M-30 30 L30 30 L44 150 L-44 150 Z" fill={cloak ? '#2E2E38' : tone} />
      <path d="M-30 30 L-46 96 L-34 104 L-22 48 Z" fill={cloak ? '#2E2E38' : tone} />
      <path d="M30 30 L46 96 L34 104 L22 48 Z" fill={cloak ? '#2E2E38' : tone} />
      <ellipse cx="0" cy="-2" rx="25" ry="30" fill="#E8DFD6" />
      <path d="M-25 -6 C-26 -34 -12 -44 0 -44 C13 -44 27 -34 26 -6 L20 -12 C16 -26 6 -30 -2 -28 C-12 -26 -19 -18 -20 -8 Z" fill={hair} />
      <path d="M-24 -10 L-30 26 L-22 24 Z" fill={hair} />
      <path d="M24 -10 L30 26 L22 24 Z" fill={hair} />
      <path d="M-13 -2 L-5 -2" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M5 -2 L13 -2" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M-4 12 L4 12" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
    </g>
  );
}

function Panel({
  x,
  y,
  w,
  h,
  children,
  bg = '#F2F0EC',
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  children?: React.ReactNode;
  bg?: string;
}) {
  const clip = React.useId();
  return (
    <g>
      <clipPath id={clip}>
        <rect x={x} y={y} width={w} height={h} rx="2" />
      </clipPath>
      <rect x={x} y={y} width={w} height={h} fill={bg} />
      <g clipPath={`url(#${clip})`}>{children}</g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={LINE} strokeWidth="3" />
    </g>
  );
}

/**
 * Demo page 03 of "The Fallen Hero", Chapter 14. Four panels, six text
 * regions. The bubble geometry here is the single source of truth used by the
 * detection overlays and the typesetting demo, so every state lines up.
 */
export function DemoComicPage({ showArtworkText = true }: { showArtworkText?: boolean }) {
  return (
    <>
      <defs>
        <Hatch id="hatch-a" angle={38} gap={7} opacity={0.35} />
        <Hatch id="hatch-b" angle={-32} gap={5} opacity={0.22} />
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D9D6E8" />
          <stop offset="100%" stopColor="#F2F0EC" />
        </linearGradient>
        <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B3A4E" />
          <stop offset="100%" stopColor="#6A6480" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={PAGE_W} height={PAGE_H} fill="#FFFFFF" />

      {/* Panel 1 — wide establishing shot */}
      <Panel x={40} y={40} w={760} h={300} bg="url(#sky)">
        <rect x={40} y={40} width={760} height={300} fill="url(#sky)" />
        <path d="M40 250 L180 150 L280 210 L390 120 L520 220 L640 140 L800 230 L800 340 L40 340 Z" fill="#B9B5CC" />
        <path d="M40 285 L160 215 L300 275 L440 200 L580 280 L700 220 L800 275 L800 340 L40 340 Z" fill="#8F8AA8" />
        <rect x={430} y={95} width={26} height={185} fill="#6E698A" />
        <rect x={420} y={80} width={46} height={22} fill="#5B5675" />
        <path d="M40 300 L800 300 L800 340 L40 340 Z" fill="#5E5A74" />
        <circle cx={640} cy={110} r={34} fill="#FBF7EA" />
        <circle cx={640} cy={110} r={70} fill="url(#glow)" />
        <rect x={40} y={40} width={760} height={300} fill="url(#hatch-b)" />
        <Figure x={210} y={200} scale={0.62} tone="#3A3A44" hair="#1C1C20" />
        <Figure x={290} y={206} scale={0.58} tone="#4A4152" hair="#2B1F2E" flip />
      </Panel>

      {/* Panel 2 — close-up left */}
      <Panel x={40} y={356} w={366} h={330}>
        <rect x={40} y={356} width={366} height={330} fill="#EDEAE4" />
        <g opacity="0.5">
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={i} x1={40 + i * 28} y1={356} x2={-40 + i * 28} y2={686} stroke={INK} strokeWidth="1" opacity="0.18" />
          ))}
        </g>
        <Figure x={230} y={520} scale={1.35} tone="#39394A" hair="#17171B" />
        <path d="M40 620 L406 620 L406 686 L40 686 Z" fill="#DCD8D0" opacity="0.7" />
      </Panel>

      {/* Panel 3 — close-up right, dusk */}
      <Panel x={422} y={356} w={378} h={330} bg="url(#dusk)">
        <rect x={422} y={356} width={378} height={330} fill="url(#dusk)" />
        <circle cx={611} cy={470} r={120} fill="url(#glow)" opacity="0.35" />
        <Figure x={615} y={530} scale={1.3} tone="#2A2636" hair="#141220" flip cloak />
        <rect x={422} y={356} width={378} height={330} fill="url(#hatch-a)" opacity="0.35" />
      </Panel>

      {/* Panel 4 — tall dramatic panel */}
      <Panel x={40} y={702} w={760} h={438}>
        <rect x={40} y={702} width={760} height={438} fill="#E6E3DC" />
        <path d="M40 1010 L300 880 L520 970 L800 860 L800 1140 L40 1140 Z" fill="#9A96AE" />
        <path d="M40 1060 L260 980 L480 1050 L700 970 L800 1010 L800 1140 L40 1140 Z" fill="#6D6986" />
        <g opacity="0.55">
          {Array.from({ length: 22 }).map((_, i) => (
            <line key={i} x1={420} y1={900} x2={40 + i * 36} y2={702} stroke={INK} strokeWidth="1.2" opacity="0.14" />
          ))}
        </g>
        <Figure x={300} y={960} scale={1.1} tone="#383848" hair="#16161C" />
        <Figure x={540} y={975} scale={1.05} tone="#2C2838" hair="#141222" flip cloak />
        {showArtworkText && (
          <text
            x={660}
            y={790}
            fontSize="62"
            fontWeight="900"
            fill="#1C1C20"
            opacity="0.82"
            transform="rotate(-9 660 790)"
            style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.06em' }}
          >
            쾅!
          </text>
        )}
      </Panel>
    </>
  );
}
