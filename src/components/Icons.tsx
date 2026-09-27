interface IconProps {
  className?: string;
}

export function IconPlay({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8 5.5v13a1 1 0 0 0 1.52.86l10.2-6.5a1 1 0 0 0 0-1.7L9.52 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

export function IconPause({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <rect x="6" y="4.5" width="4" height="15" rx="1.2" />
      <rect x="14" y="4.5" width="4" height="15" rx="1.2" />
    </svg>
  );
}

export function IconRestart({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

export function IconHome({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </svg>
  );
}

export function IconTrophy({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
    </svg>
  );
}

export function IconBolt({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
    </svg>
  );
}

export function IconClock({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function IconRuler({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className} aria-hidden>
      <path d="M4 17c4-1.5 5-6.5 8-8s6 .5 8-2" />
      <circle cx="19" cy="6" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSoundOn({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" fill="currentColor" stroke="none" />
      <path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a8 8 0 0 1 0 10" />
    </svg>
  );
}

export function IconSoundOff({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" fill="currentColor" stroke="none" />
      <path d="m15.5 9.5 5 5M20.5 9.5l-5 5" />
    </svg>
  );
}

export function IconChevron({ className = 'w-6 h-6', dir = 'up' }: IconProps & { dir?: 'up' | 'down' | 'left' | 'right' }) {
  const rot = { up: 0, right: 90, down: 180, left: 270 }[dir];
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ transform: `rotate(${rot}deg)` }} aria-hidden>
      <path d="m5 15 7-7 7 7" />
    </svg>
  );
}

export function IconApple({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 6.5c-3.5-2-7 .5-7 4.6 0 4.4 3.2 9.4 5.6 9.4 1 0 1-.5 1.4-.5s.4.5 1.4.5c2.4 0 5.6-5 5.6-9.4 0-4.1-3.5-6.6-7-4.6Z" />
      <path d="M12 6.5c0-2 1-3.5 3-4-.2 2.2-1.2 3.6-3 4Z" opacity="0.7" />
    </svg>
  );
}

/* Пиксельная змейка для логотипа */
export function SnakeLogo({ className = 'w-9 h-9' }: IconProps) {
  const lime = '#b8ff5e';
  const green = '#5fdd6a';
  const dark = '#1e7a46';
  const px: Array<[number, number, string]> = [
    [2, 1, green], [3, 1, green], [4, 1, green], [5, 1, lime],
    [1, 2, green], [6, 2, lime],
    [1, 3, dark], [2, 3, dark], [3, 3, dark], [4, 3, dark], [5, 3, green], [6, 3, lime],
    [5, 4, green], [6, 4, lime],
    [3, 5, green], [4, 5, green], [5, 5, green], [6, 5, lime],
  ];
  return (
    <svg viewBox="0 0 8 7" className={className} shapeRendering="crispEdges" aria-hidden>
      {px.map(([x, y, c], i) => (
        <rect key={i} x={x} y={y} width="1.02" height="1.02" fill={c} />
      ))}
      <rect x="6.55" y="1.25" width="0.3" height="0.3" fill="#10231a" />
    </svg>
  );
}
