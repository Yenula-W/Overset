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

/**
 * Stylized figure — original silhouette and line work, no likeness of any real
 * person or existing character. Kept deliberately simple: the demo pages exist
 * to show text handling, so the art stays readable at thumbnail size.
 */
function Figure({
  x,
  y,
  scale = 1,
  tone = '#3A3A44',
  hair = '#1C1C20',
  flip = false,
  cloak = false,
  hairStyle = 'long',
  expression = 'neutral',
}: {
  x: number;
  y: number;
  scale?: number;
  tone?: string;
  hair?: string;
  flip?: boolean;
  cloak?: boolean;
  hairStyle?: 'long' | 'short' | 'tied';
  expression?: 'neutral' | 'tense' | 'smug';
}) {
  const skin = '#EDE0D4';
  const shade = '#D9C7B7';

  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {cloak && (
        <>
          <path d="M-58 44 L-36 -6 L36 -6 L58 44 L46 170 L-46 170 Z" fill="#221F2E" />
          <path d="M-36 -6 L-18 34 L18 34 L36 -6 Z" fill="#191725" />
        </>
      )}

      {/* Torso */}
      <path d="M-26 34 Q0 26 26 34 L36 96 L32 152 L-32 152 L-36 96 Z" fill={cloak ? '#2B2839' : tone} />
      {/* Collar */}
      <path d="M-26 34 Q0 48 26 34 L20 26 Q0 36 -20 26 Z" fill="#F4EEE6" opacity={cloak ? 0.15 : 0.55} />
      {/* Arms */}
      <path d="M-26 36 Q-44 62 -40 104 L-28 106 Q-30 66 -16 44 Z" fill={cloak ? '#241F31' : tone} />
      <path d="M26 36 Q44 62 40 104 L28 106 Q30 66 16 44 Z" fill={cloak ? '#241F31' : tone} />
      <circle cx={-34} cy={110} r={7} fill={skin} />
      <circle cx={34} cy={110} r={7} fill={skin} />
      {/* Neck */}
      <path d="M-9 14 L9 14 L9 32 Q0 38 -9 32 Z" fill={shade} />

      {/* Head */}
      <path d="M0 -34 C17 -34 27 -21 27 -4 C27 14 16 28 0 28 C-16 28 -27 14 -27 -4 C-27 -21 -17 -34 0 -34 Z" fill={skin} />
      <path d="M13 -22 C24 -18 27 -8 27 -4 C27 12 17 26 3 28 C16 20 22 6 20 -8 Z" fill={shade} opacity="0.55" />

      {/* Hair */}
      {hairStyle === 'long' && (
        <>
          <path d="M-28 -2 C-30 -30 -16 -42 0 -42 C16 -42 30 -30 28 -2 L22 -10 C18 -24 9 -28 0 -27 C-11 -26 -19 -18 -22 -8 Z" fill={hair} />
          <path d="M-27 -8 L-33 40 L-22 38 L-20 -4 Z" fill={hair} />
          <path d="M27 -8 L33 40 L22 38 L20 -4 Z" fill={hair} />
        </>
      )}
      {hairStyle === 'short' && (
        <path d="M-28 -4 C-30 -32 -15 -43 0 -43 C15 -43 30 -32 28 -4 L21 -12 C14 -26 -12 -28 -21 -12 Z" fill={hair} />
      )}
      {hairStyle === 'tied' && (
        <>
          <path d="M-28 -4 C-30 -32 -15 -43 0 -43 C15 -43 30 -32 28 -4 L21 -12 C14 -26 -12 -28 -21 -12 Z" fill={hair} />
          <path d="M22 -14 Q42 -6 38 22 Q32 6 20 0 Z" fill={hair} />
        </>
      )}

      {/* Face */}
      {expression === 'tense' ? (
        <>
          <path d="M-16 -8 L-6 -4" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M16 -8 L6 -4" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M-16 -7 L-6 -7" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M16 -7 L6 -7" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        </>
      )}
      <path d="M-14 1 Q-11 6 -7 1" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M14 1 Q11 6 7 1" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M1 4 L-2 11 L2 12" stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
      {expression === 'smug' ? (
        <path d="M-6 18 Q0 22 7 16" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : expression === 'tense' ? (
        <path d="M-6 19 Q0 16 6 19" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M-5 18 L5 18" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      )}
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
        <Figure x={208} y={198} scale={0.58} tone="#3A3A44" hair="#1C1C20" hairStyle="short" />
        <Figure x={292} y={204} scale={0.55} tone="#4A4152" hair="#2B1F2E" hairStyle="tied" flip />
      </Panel>

      {/* Panel 2 — close-up left */}
      <Panel x={40} y={356} w={366} h={330}>
        <rect x={40} y={356} width={366} height={330} fill="#EDEAE4" />
        <g opacity="0.5">
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={i} x1={40 + i * 28} y1={356} x2={-40 + i * 28} y2={686} stroke={INK} strokeWidth="1" opacity="0.18" />
          ))}
        </g>
        <Figure x={230} y={532} scale={1.25} tone="#39394A" hair="#17171B" hairStyle="short" expression="smug" />
        <path d="M40 620 L406 620 L406 686 L40 686 Z" fill="#DCD8D0" opacity="0.7" />
      </Panel>

      {/* Panel 3 — close-up right, dusk */}
      <Panel x={422} y={356} w={378} h={330} bg="url(#dusk)">
        <rect x={422} y={356} width={378} height={330} fill="url(#dusk)" />
        <circle cx={611} cy={470} r={120} fill="url(#glow)" opacity="0.35" />
        <Figure x={615} y={542} scale={1.2} tone="#2A2636" hair="#141220" hairStyle="long" expression="neutral" flip cloak />
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
        <Figure x={296} y={972} scale={1.0} tone="#383848" hair="#16161C" hairStyle="short" expression="tense" />
        <Figure x={548} y={984} scale={0.96} tone="#2C2838" hair="#141222" hairStyle="tied" expression="smug" flip cloak />
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
