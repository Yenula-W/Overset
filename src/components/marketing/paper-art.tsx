import * as React from 'react';
import { Figure } from '@/components/demo/artwork';

/**
 * Original panel art for the hero's manhwa page. Each panel is composed around
 * the fixed bubble positions from the design so no speech bubble sits on a
 * face. Sizes are the panels' inner boxes (outer size minus the 2px border).
 */

function useIds(...names: string[]) {
  const uid = React.useId().replace(/:/g, '');
  return Object.fromEntries(names.map((n) => [n, `${n}-${uid}`])) as Record<string, string>;
}

function Lines({ x, y, count, spread, length, opacity = 0.14 }: { x: number; y: number; count: number; spread: number; length: number; opacity?: number }) {
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (-spread / 2 + (spread / (count - 1)) * i) * (Math.PI / 180) - Math.PI / 2;
        return <line key={i} x1={x} y1={y} x2={x + Math.cos(a) * length} y2={y + Math.sin(a) * length} stroke="#1C1C20" strokeWidth="1" />;
      })}
    </g>
  );
}

/** Panel 1 — 388×192. Establishing shot; figures right of bubble 01. */
export function PanelArtOne() {
  const id = useIds('sky');
  return (
    <svg viewBox="0 0 388 192" className="block h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id.sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D9D6E8" />
          <stop offset="100%" stopColor="#F2F0EC" />
        </linearGradient>
      </defs>
      <rect width="388" height="192" fill={`url(#${id.sky})`} />
      <path d="M0 128 L70 84 L130 112 L200 64 L270 116 L330 76 L388 110 L388 192 L0 192 Z" fill="#B9B5CC" />
      <path d="M0 150 L90 116 L170 146 L250 108 L320 144 L388 124 L388 192 L0 192 Z" fill="#8F8AA8" />
      <rect x="0" y="166" width="388" height="26" fill="#5E5A74" />
      <rect x="226" y="54" width="12" height="100" fill="#6E698A" />
      <rect x="220" y="46" width="24" height="11" fill="#5B5675" />
      <circle cx="350" cy="36" r="16" fill="#FBF7EA" />
      <Figure x={290} y={118} scale={0.34} hairStyle="short" />
      <Figure x={336} y={121} scale={0.32} tone="#4A4152" hair="#2B1F2E" hairStyle="tied" flip />
    </svg>
  );
}

/** Panel 2 — 185×168. Close-up below bubble 02. */
export function PanelArtTwo() {
  return (
    <svg viewBox="0 0 185 168" className="block h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="185" height="168" fill="#EDEAE4" />
      <Lines x={92} y={40} count={14} spread={160} length={220} />
      <Figure x={100} y={138} scale={0.72} hairStyle="short" expression="tense" />
    </svg>
  );
}

/** Panel 3 — 189×168. Dusk; the cloaked figure sits left of bubble 03. */
export function PanelArtThree() {
  const id = useIds('dusk', 'glow');
  return (
    <svg viewBox="0 0 189 168" className="block h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id.dusk} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B3A4E" />
          <stop offset="100%" stopColor="#6A6480" />
        </linearGradient>
        <radialGradient id={id.glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="189" height="168" fill={`url(#${id.dusk})`} />
      <circle cx="62" cy="108" r="60" fill={`url(#${id.glow})`} />
      <Figure x={62} y={112} scale={0.62} tone="#2A2636" hair="#141220" hairStyle="long" cloak />
    </svg>
  );
}

/** Panel 4 — 388×156. Wide action beat; figures left of bubble 04. */
export function PanelArtFour() {
  return (
    <svg viewBox="0 0 388 156" className="block h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="388" height="156" fill="#E6E3DC" />
      <Lines x={120} y={150} count={20} spread={150} length={320} opacity={0.12} />
      <path d="M0 118 L110 86 L210 112 L300 80 L388 104 L388 156 L0 156 Z" fill="#9A96AE" />
      <path d="M0 138 L120 116 L240 138 L388 120 L388 156 L0 156 Z" fill="#6D6986" />
      <Figure x={58} y={92} scale={0.5} hairStyle="short" expression="tense" />
      <Figure x={128} y={96} scale={0.46} tone="#4A4152" hair="#2B1F2E" hairStyle="tied" flip />
    </svg>
  );
}
