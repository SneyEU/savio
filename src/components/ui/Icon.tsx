/** Icônes dessinées pour Savio (trait 1,8 px, extrémités arrondies). Aucune police d'icônes, aucun emoji. */
import type { ReactNode } from 'react';
export type IconName = 'orbit' | 'cards' | 'core' | 'sliders' | 'play' | 'arrow' | 'close' | 'sound' | 'mute' | 'stop' | 'spark' | 'check' | 'replay';

const PATHS: Record<IconName, ReactNode> = {
  orbit: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <ellipse cx="12" cy="12" rx="9.5" ry="4.2" transform="rotate(-24 12 12)" />
      <circle cx="19.6" cy="7.6" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  cards: (
    <>
      <rect x="4" y="6.5" width="12" height="14" rx="2.5" />
      <path d="M8 3.5h9.5A2.5 2.5 0 0 1 20 6v12" />
    </>
  ),
  core: (
    <>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />,
  arrow: <path d="M5 12h13M13 6.5 18.5 12 13 17.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  sound: (
    <>
      <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  mute: (
    <>
      <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </>
  ),
  stop: <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />,
  spark: <path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  replay: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4 4.5v4h4" />
    </>
  ),
};

export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
