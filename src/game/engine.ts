export interface Cell {
  x: number;
  y: number;
}

export interface Dir {
  x: number;
  y: number;
}

export type Difficulty = 'easy' | 'normal' | 'hard';
export type Phase = 'menu' | 'countdown' | 'playing' | 'paused' | 'gameover';
export type DeathCause = 'wall' | 'self' | null;

export const COLS = 21;
export const ROWS = 21;

export const POINTS_APPLE = 10;
export const POINTS_BONUS = 50;
export const BONUS_EVERY = 5;
export const BONUS_LIFETIME = 6500;
export const SPEEDUP_PER_APPLE = 0.97;
export const MIN_STEP_MS = 58;
export const START_LENGTH = 3;

export interface DifficultyInfo {
  label: string;
  step: number;
  hint: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyInfo> = {
  easy: { label: 'Легко', step: 168, hint: 'прогулка по саду' },
  normal: { label: 'Средне', step: 118, hint: 'классический темп' },
  hard: { label: 'Сложно', step: 86, hint: 'только для смелых' },
};

export const DIFF_ORDER: Difficulty[] = ['easy', 'normal', 'hard'];

export const DIRS: Record<'up' | 'down' | 'left' | 'right', Dir> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function isOpposite(a: Dir, b: Dir): boolean {
  return a.x === -b.x && a.y === -b.y && !(a.x === 0 && a.y === 0);
}

export function sameDir(a: Dir, b: Dir): boolean {
  return a.x === b.x && a.y === b.y;
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

export function makeSnake(): Cell[] {
  const cx = Math.floor(COLS / 2);
  const cy = Math.floor(ROWS / 2);
  const snake: Cell[] = [];
  for (let i = 0; i < START_LENGTH; i++) snake.push({ x: cx - i, y: cy });
  return snake;
}

export function randFreeCell(occupied: Cell[]): Cell {
  for (let tries = 0; tries < 600; tries++) {
    const c = { x: (Math.random() * COLS) | 0, y: (Math.random() * ROWS) | 0 };
    if (!occupied.some((o) => o.x === c.x && o.y === c.y)) return c;
  }
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!occupied.some((o) => o.x === x && o.y === y)) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

export function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

/* ---------- persistent storage ---------- */

const BEST_KEY = (d: Difficulty) => `zmeika:best:${d}`;

export function loadBest(d: Difficulty): number {
  try {
    return Number(localStorage.getItem(BEST_KEY(d))) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(d: Difficulty, v: number): void {
  try {
    localStorage.setItem(BEST_KEY(d), String(v));
  } catch {
    /* приватный режим — играем без сохранения */
  }
}

export function loadPref(key: string, fallback: string): string {
  try {
    return localStorage.getItem(`zmeika:${key}`) ?? fallback;
  } catch {
    return fallback;
  }
}

export function savePref(key: string, v: string): void {
  try {
    localStorage.setItem(`zmeika:${key}`, v);
  } catch {
    /* ignore */
  }
}
