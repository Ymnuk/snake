import { useCallback, useEffect, useRef, useState } from 'react';
import type { Cell, DeathCause, Difficulty, Dir, Phase } from './engine';
import {
  BONUS_EVERY,
  BONUS_LIFETIME,
  COLS,
  ROWS,
  DIFFICULTIES,
  DIFF_ORDER,
  DIRS,
  MIN_STEP_MS,
  POINTS_APPLE,
  POINTS_BONUS,
  SPEEDUP_PER_APPLE,
  isOpposite,
  loadBest,
  loadPref,
  makeSnake,
  randFreeCell,
  sameCell,
  sameDir,
  saveBest,
  savePref,
} from './engine';
import { sfx } from './sfx';

const PI2 = Math.PI * 2;
const COUNT_STEP = 650;

/* ------------------------------------------------------------------ */
/* types                                                               */
/* ------------------------------------------------------------------ */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: 'spark' | 'ring';
}

interface Floater {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
}

interface GState {
  phase: Phase;
  difficulty: Difficulty;
  muted: boolean;
  snake: Cell[];
  prev: Cell[];
  dir: Dir;
  queue: Dir[];
  food: Cell;
  bonus: { cell: Cell; born: number } | null;
  score: number;
  apples: number;
  stepMs: number;
  baseStep: number;
  acc: number;
  gameTime: number;
  countdown: number;
  countdownT: number;
  shake: number;
  deathT: number;
  particles: Particle[];
  floaters: Floater[];
  isNewBest: boolean;
  best: number;
  cause: DeathCause;
  dirty: boolean;
}

export interface UiSnapshot {
  phase: Phase;
  score: number;
  best: number;
  isNewBest: boolean;
  length: number;
  apples: number;
  speedMul: number;
  countdown: number;
  difficulty: Difficulty;
  timeMs: number;
  muted: boolean;
  cause: DeathCause;
}

/* ------------------------------------------------------------------ */
/* geometry helpers                                                    */
/* ------------------------------------------------------------------ */

const padOf = (size: number) => Math.max(8, size * 0.028);
const cellOf = (size: number) => (size - padOf(size) * 2) / COLS;
const pxOf = (size: number, c: { x: number; y: number }) => ({
  x: padOf(size) + (c.x + 0.5) * cellOf(size),
  y: padOf(size) + (c.y + 0.5) * cellOf(size),
});

/* ------------------------------------------------------------------ */
/* state factory                                                       */
/* ------------------------------------------------------------------ */

function validDiff(v: string): Difficulty {
  return (DIFF_ORDER as string[]).includes(v) ? (v as Difficulty) : 'normal';
}

function makeState(): GState {
  const difficulty = validDiff(loadPref('diff', 'normal'));
  const snake = makeSnake();
  const cy = Math.floor(ROWS / 2);
  const cx = Math.floor(COLS / 2);
  return {
    phase: 'menu',
    difficulty,
    muted: loadPref('muted', '0') === '1',
    snake,
    prev: snake.map((c) => ({ ...c })),
    dir: DIRS.right,
    queue: [],
    food: { x: Math.min(COLS - 2, cx + 5), y: cy },
    bonus: null,
    score: 0,
    apples: 0,
    stepMs: DIFFICULTIES[difficulty].step,
    baseStep: DIFFICULTIES[difficulty].step,
    acc: 0,
    gameTime: 0,
    countdown: 3,
    countdownT: 0,
    shake: 0,
    deathT: 0,
    particles: [],
    floaters: [],
    isNewBest: false,
    best: loadBest(difficulty),
    cause: null,
    dirty: false,
  };
}

function resetBoard(s: GState, diff: Difficulty): void {
  const snake = makeSnake();
  const cy = Math.floor(ROWS / 2);
  const cx = Math.floor(COLS / 2);
  s.difficulty = diff;
  s.snake = snake;
  s.prev = snake.map((c) => ({ ...c }));
  s.dir = DIRS.right;
  s.queue = [];
  s.food = { x: Math.min(COLS - 2, cx + 5), y: cy };
  s.bonus = null;
  s.score = 0;
  s.apples = 0;
  s.stepMs = DIFFICULTIES[diff].step;
  s.baseStep = DIFFICULTIES[diff].step;
  s.acc = 0;
  s.gameTime = 0;
  s.countdown = 3;
  s.countdownT = 0;
  s.shake = 0;
  s.deathT = 0;
  s.particles = [];
  s.floaters = [];
  s.isNewBest = false;
  s.best = loadBest(diff);
  s.cause = null;
  savePref('diff', diff);
}

const snapshot = (s: GState): UiSnapshot => ({
  phase: s.phase,
  score: s.score,
  best: s.best,
  isNewBest: s.isNewBest,
  length: s.snake.length,
  apples: s.apples,
  speedMul: s.baseStep / s.stepMs,
  countdown: s.countdown,
  difficulty: s.difficulty,
  timeMs: s.gameTime,
  muted: s.muted,
  cause: s.cause,
});

/* ------------------------------------------------------------------ */
/* effects (juice)                                                     */
/* ------------------------------------------------------------------ */

function spawnBurst(s: GState, size: number, c: Cell, colors: string[], n: number, power = 1): void {
  const { x, y } = pxOf(size, c);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * PI2;
    const v = (50 + Math.random() * 140) * power;
    s.particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 40,
      life: 420 + Math.random() * 380,
      maxLife: 800,
      size: 2.5 + Math.random() * 3.5,
      color: colors[(Math.random() * colors.length) | 0],
      kind: 'spark',
    });
  }
  s.particles.push({ x, y, vx: 0, vy: 0, life: 380, maxLife: 380, size: cellOf(size) * 0.5, color: colors[0], kind: 'ring' });
}

function addFloater(s: GState, size: number, c: Cell, text: string, color: string): void {
  const { x, y } = pxOf(size, c);
  s.floaters.push({ x, y: y - cellOf(size) * 0.4, life: 900, maxLife: 900, text, color });
}

/* ------------------------------------------------------------------ */
/* game tick                                                           */
/* ------------------------------------------------------------------ */

function checkBest(s: GState): void {
  if (s.score > s.best) {
    if (!s.isNewBest) {
      s.isNewBest = true;
      sfx.record();
    }
    s.best = s.score;
    saveBest(s.difficulty, s.score);
  }
}

function die(s: GState, size: number, cause: DeathCause): void {
  s.phase = 'gameover';
  s.cause = cause;
  s.shake = 1;
  s.deathT = 0;
  s.prev = s.snake.map((c) => ({ ...c }));
  spawnBurst(s, size, s.snake[0], ['#b8ff5e', '#6ee86e', '#ff6b5e', '#ffc24b'], 26, 1.3);
  sfx.die();
  s.dirty = true;
}

function tick(s: GState, size: number): void {
  s.prev = s.snake.map((c) => ({ ...c }));

  while (s.queue.length) {
    const nd = s.queue.shift()!;
    if (!sameDir(nd, s.dir) && !isOpposite(nd, s.dir)) {
      s.dir = nd;
      break;
    }
  }

  const head = s.snake[0];
  const nx = head.x + s.dir.x;
  const ny = head.y + s.dir.y;

  if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
    die(s, size, 'wall');
    return;
  }

  const ateApple = sameCell({ x: nx, y: ny }, s.food);
  const ateBonus = s.bonus !== null && sameCell({ x: nx, y: ny }, s.bonus.cell);
  const body = ateApple ? s.snake : s.snake.slice(0, -1);

  if (body.some((c) => c.x === nx && c.y === ny)) {
    die(s, size, 'self');
    return;
  }

  s.snake = [{ x: nx, y: ny }, ...body];

  if (ateApple) {
    s.score += POINTS_APPLE;
    s.apples += 1;
    s.stepMs = Math.max(MIN_STEP_MS, s.stepMs * SPEEDUP_PER_APPLE);
    spawnBurst(s, size, { x: nx, y: ny }, ['#ff8a70', '#ff6b5e', '#ffc24b'], 14);
    addFloater(s, size, { x: nx, y: ny }, `+${POINTS_APPLE}`, '#ffd9a0');
    sfx.eat();
    s.food = randFreeCell([...s.snake, ...(s.bonus ? [s.bonus.cell] : [])]);
    if (s.apples % BONUS_EVERY === 0 && !s.bonus) {
      const cell = randFreeCell([...s.snake, s.food]);
      s.bonus = { cell, born: s.gameTime };
      spawnBurst(s, size, cell, ['#ffd166', '#ffe49a'], 10, 0.7);
    }
    checkBest(s);
  }

  if (ateBonus && s.bonus) {
    s.score += POINTS_BONUS;
    spawnBurst(s, size, { x: nx, y: ny }, ['#ffd166', '#ffe49a', '#ffffff'], 24, 1.25);
    addFloater(s, size, { x: nx, y: ny }, `+${POINTS_BONUS}`, '#ffe08a');
    sfx.bonus();
    s.bonus = null;
    checkBest(s);
  } else if (s.bonus && s.gameTime - s.bonus.born > BONUS_LIFETIME) {
    spawnBurst(s, size, s.bonus.cell, ['rgba(255,209,102,0.8)'], 6, 0.5);
    s.bonus = null;
  }

  s.dirty = true;
}

/* ------------------------------------------------------------------ */
/* rendering                                                           */
/* ------------------------------------------------------------------ */

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const HEAD_RGB: [number, number, number] = [184, 255, 94];
const TAIL_RGB: [number, number, number] = [26, 96, 54];

function bodyColor(i: number, n: number): string {
  const t = n <= 1 ? 0 : i / (n - 1);
  const r = Math.round(HEAD_RGB[0] + (TAIL_RGB[0] - HEAD_RGB[0]) * t);
  const g = Math.round(HEAD_RGB[1] + (TAIL_RGB[1] - HEAD_RGB[1]) * t);
  const b = Math.round(HEAD_RGB[2] + (TAIL_RGB[2] - HEAD_RGB[2]) * t);
  return `rgb(${r},${g},${b})`;
}

function drawApple(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, now: number): void {
  const pulse = 1 + Math.sin(now / 260) * 0.07;
  const r = cell * 0.33 * pulse;
  ctx.save();
  ctx.shadowColor = 'rgba(255,107,94,0.6)';
  ctx.shadowBlur = cell * 0.5;
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.12, x, y, r);
  g.addColorStop(0, '#ffa38a');
  g.addColorStop(0.55, '#ff6b5e');
  g.addColorStop(1, '#d63f33');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y + r * 0.08, r, 0, PI2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = Math.max(1.5, cell * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.85);
  ctx.quadraticCurveTo(x + r * 0.12, y - r * 1.25, x + r * 0.32, y - r * 1.32);
  ctx.stroke();
  ctx.fillStyle = '#4ade80';
  ctx.save();
  ctx.translate(x + r * 0.6, y - r * 1.02);
  ctx.rotate(-0.55);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.42, r * 0.19, 0, 0, PI2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.36, y - r * 0.28, r * 0.16, r * 0.09, -0.6, 0, PI2);
  ctx.fill();
  ctx.restore();
}

function drawBonus(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, now: number, remain: number): void {
  const r = cell * 0.32;
  ctx.save();
  if (remain < 0.28 && Math.floor(now / 140) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(2, cell * 0.07);
  ctx.strokeStyle = 'rgba(255,209,102,0.28)';
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.6, 0, PI2);
  ctx.stroke();
  ctx.strokeStyle = '#ffd166';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.6, -Math.PI / 2, -Math.PI / 2 + PI2 * Math.max(0.02, remain));
  ctx.stroke();
  const pop = 1 + Math.sin(now / 170) * 0.09;
  ctx.rotate(now / 480);
  ctx.shadowColor = 'rgba(255,193,77,0.75)';
  ctx.shadowBlur = cell * 0.55;
  const g = ctx.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, '#ffe49a');
  g.addColorStop(1, '#f5a623');
  ctx.fillStyle = g;
  const rr = r * pop;
  ctx.beginPath();
  ctx.moveTo(0, -rr);
  ctx.lineTo(rr, 0);
  ctx.lineTo(0, rr);
  ctx.lineTo(-rr, 0);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  const ir = rr * 0.42;
  ctx.beginPath();
  ctx.moveTo(0, -ir);
  ctx.lineTo(ir, 0);
  ctx.lineTo(0, ir);
  ctx.lineTo(-ir, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, s: GState, size: number, now: number, dt: number): void {
  ctx.clearRect(0, 0, size, size);

  if (s.shake > 0.01) {
    s.shake *= Math.pow(0.002, dt / 1000);
  } else {
    s.shake = 0;
  }
  const amp = s.shake * 8;
  const ox = (Math.random() - 0.5) * amp;
  const oy = (Math.random() - 0.5) * amp;
  if (s.phase === 'gameover') s.deathT += dt;

  ctx.save();
  ctx.translate(ox, oy);

  const pad = padOf(size);
  const cell = cellOf(size);

  /* board */
  roundRect(ctx, 1, 1, size - 2, size - 2, 16);
  ctx.fillStyle = '#0a1f15';
  ctx.fill();

  ctx.fillStyle = 'rgba(148,255,180,0.028)';
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if ((x + y) % 2 === 0) continue;
      ctx.fillRect(pad + x * cell, pad + y * cell, cell, cell);
    }
  }

  const vg = ctx.createRadialGradient(size / 2, size / 2, size * 0.25, size / 2, size / 2, size * 0.74);
  vg.addColorStop(0, 'rgba(3,10,7,0)');
  vg.addColorStop(1, 'rgba(3,10,7,0.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, size, size);

  /* frame */
  ctx.save();
  ctx.shadowColor = 'rgba(61,255,136,0.55)';
  ctx.shadowBlur = 16;
  ctx.strokeStyle = 'rgba(110,232,140,0.55)';
  ctx.lineWidth = 2;
  roundRect(ctx, pad * 0.42, pad * 0.42, size - pad * 0.84, size - pad * 0.84, 12);
  ctx.stroke();
  ctx.restore();
  if (s.phase === 'gameover' && s.deathT < 650) {
    ctx.save();
    ctx.globalAlpha = (1 - s.deathT / 650) * 0.85;
    ctx.shadowColor = 'rgba(255,90,70,0.9)';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#ff6b5e';
    ctx.lineWidth = 3;
    roundRect(ctx, pad * 0.42, pad * 0.42, size - pad * 0.84, size - pad * 0.84, 12);
    ctx.stroke();
    ctx.restore();
  }

  const cpx = (c: { x: number; y: number }) => pad + (c.x + 0.5) * cell;
  const cpy = (c: { x: number; y: number }) => pad + (c.y + 0.5) * cell;

  /* food & bonus */
  drawApple(ctx, cpx(s.food), cpy(s.food), cell, now);
  if (s.bonus) {
    const remain = 1 - (s.gameTime - s.bonus.born) / BONUS_LIFETIME;
    drawBonus(ctx, cpx(s.bonus.cell), cpy(s.bonus.cell), cell, now, remain);
  }

  /* snake (interpolated) */
  const u = s.phase === 'playing' || s.phase === 'paused' ? Math.min(1, s.acc / s.stepMs) : 1;
  const pts = s.snake.map((c, i) => {
    const p = s.prev[Math.min(i, s.prev.length - 1)];
    return {
      x: pad + (p.x + (c.x - p.x) * u + 0.5) * cell,
      y: pad + (p.y + (c.y - p.y) * u + 0.5) * cell,
    };
  });
  const n = pts.length;

  const blinking = s.phase === 'gameover' && s.deathT < 720 && Math.floor(s.deathT / 110) % 2 === 0;
  ctx.save();
  if (blinking) ctx.globalAlpha = 0.3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.strokeStyle = '#0b2f1d';
  ctx.lineWidth = cell * 0.94;
  ctx.beginPath();
  ctx.moveTo(pts[n - 1].x, pts[n - 1].y);
  for (let i = n - 2; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  for (let i = n - 1; i > 0; i--) {
    ctx.strokeStyle = bodyColor(i, n);
    ctx.lineWidth = cell * 0.76;
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i - 1].x, pts[i - 1].y);
    ctx.stroke();
  }

  /* head */
  const h = pts[0];
  const hr = cell * 0.47;
  ctx.save();
  ctx.shadowColor = 'rgba(139,224,76,0.65)';
  ctx.shadowBlur = cell * 0.6;
  roundRect(ctx, h.x - hr, h.y - hr, hr * 2, hr * 2, hr * 0.72);
  ctx.fillStyle = '#c4ff6b';
  ctx.fill();
  ctx.restore();

  const d = s.dir;
  const px = -d.y;
  const py = d.x;
  for (const side of [-1, 1]) {
    const ex = h.x + d.x * cell * 0.16 + px * side * cell * 0.19;
    const ey = h.y + d.y * cell * 0.16 + py * side * cell * 0.19;
    ctx.fillStyle = '#f2fff0';
    ctx.beginPath();
    ctx.arc(ex, ey, cell * 0.135, 0, PI2);
    ctx.fill();
    ctx.fillStyle = '#10231a';
    ctx.beginPath();
    ctx.arc(ex + d.x * cell * 0.05, ey + d.y * cell * 0.05, cell * 0.068, 0, PI2);
    ctx.fill();
  }
  ctx.restore();

  /* particles */
  for (let i = s.particles.length - 1; i >= 0; i--) {
    const p = s.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      s.particles.splice(i, 1);
      continue;
    }
    const k = p.life / p.maxLife;
    if (p.kind === 'spark') {
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;
      p.vy += (240 * dt) / 1000;
      ctx.globalAlpha = Math.min(1, k * 1.4);
      ctx.fillStyle = p.color;
      const sz = p.size * (0.4 + k * 0.6);
      ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
    } else {
      ctx.globalAlpha = k * 0.85;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1.5, cell * 0.06 * k);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + (1 - k) * 1.7), 0, PI2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  /* floaters */
  for (let i = s.floaters.length - 1; i >= 0; i--) {
    const f = s.floaters[i];
    f.life -= dt;
    if (f.life <= 0) {
      s.floaters.splice(i, 1);
      continue;
    }
    const k = f.life / f.maxLife;
    f.y -= (36 * dt) / 1000;
    ctx.globalAlpha = Math.min(1, k * 1.6);
    ctx.font = `800 ${Math.max(12, Math.round(cell * 0.46))}px Rubik, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(6,17,12,0.7)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* the hook                                                            */
/* ------------------------------------------------------------------ */

export function useSnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stRef = useRef<GState | null>(null);
  if (stRef.current === null) stRef.current = makeState();
  const sizeRef = useRef(320);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const [ui, setUi] = useState<UiSnapshot>(() => snapshot(stRef.current!));
  const sync = useCallback(() => setUi(snapshot(stRef.current!)), []);

  /* ------------------------------ actions ------------------------------ */

  const start = useCallback(
    (diff?: Difficulty) => {
      const s = stRef.current!;
      resetBoard(s, diff ?? s.difficulty);
      s.phase = 'countdown';
      s.countdown = 3;
      s.countdownT = 0;
      sfx.muted = s.muted;
      sfx.count();
      sync();
    },
    [sync],
  );

  const togglePause = useCallback(() => {
    const s = stRef.current!;
    if (s.phase === 'playing') {
      s.phase = 'paused';
      sfx.pause();
    } else if (s.phase === 'paused') {
      s.phase = 'playing';
      sfx.click();
    }
    sync();
  }, [sync]);

  const toMenu = useCallback(() => {
    const s = stRef.current!;
    resetBoard(s, s.difficulty);
    s.phase = 'menu';
    sfx.click();
    sync();
  }, [sync]);

  const setDifficulty = useCallback(
    (d: Difficulty) => {
      const s = stRef.current!;
      s.difficulty = d;
      s.best = loadBest(d);
      savePref('diff', d);
      sfx.click();
      sync();
    },
    [sync],
  );

  const toggleMute = useCallback(() => {
    const s = stRef.current!;
    s.muted = !s.muted;
    sfx.muted = s.muted;
    savePref('muted', s.muted ? '1' : '0');
    if (!s.muted) sfx.click();
    sync();
  }, [sync]);

  const queueDir = useCallback((dir: Dir) => {
    const s = stRef.current!;
    if (s.phase !== 'playing' && s.phase !== 'countdown') return;
    const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
    if (sameDir(dir, last) || isOpposite(dir, last)) return;
    if (s.queue.length < 3) s.queue.push(dir);
  }, []);

  /* --------------------------- main loop & input ------------------------ */

  useEffect(() => {
    sfx.muted = stRef.current!.muted;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fit = () => {
      const rect = wrap.getBoundingClientRect();
      const size = Math.max(200, Math.floor(Math.min(rect.width, rect.height)));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      sizeRef.current = size;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      const s = stRef.current!;
      const size = sizeRef.current;

      if (s.phase === 'playing') {
        s.gameTime += dt;
        s.acc += dt;
        let needSync = false;
        while (s.acc >= s.stepMs && s.phase === 'playing') {
          s.acc -= s.stepMs;
          tick(s, size);
          if (s.dirty) {
            s.dirty = false;
            needSync = true;
          }
        }
        if (needSync) sync();
      } else if (s.phase === 'countdown') {
        s.countdownT += dt;
        const n = 3 - Math.floor(s.countdownT / COUNT_STEP);
        if (n <= 0) {
          s.phase = 'playing';
          s.countdown = 0;
          sfx.count(true);
          sync();
        } else if (n !== s.countdown) {
          s.countdown = n;
          sfx.count();
          sync();
        }
      }

      render(ctx, s, size, now, dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    /* swipe */
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchRef.current = { x: t.clientX, y: t.clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
      const from = touchRef.current;
      touchRef.current = null;
      if (!from) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - from.x;
      const dy = t.clientY - from.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) queueDir(dx > 0 ? DIRS.right : DIRS.left);
      else queueDir(dy > 0 ? DIRS.down : DIRS.up);
    };
    const onCtx = (e: Event) => e.preventDefault();
    wrap.addEventListener('touchstart', onTouchStart, { passive: true });
    wrap.addEventListener('touchend', onTouchEnd, { passive: true });
    wrap.addEventListener('contextmenu', onCtx);

    /* auto-pause */
    const onHide = () => {
      const s = stRef.current!;
      if (document.hidden && s.phase === 'playing') {
        s.phase = 'paused';
        sync();
      }
    };
    const onBlur = () => {
      const s = stRef.current!;
      if (s.phase === 'playing') {
        s.phase = 'paused';
        sfx.pause();
        sync();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('blur', onBlur);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener('touchstart', onTouchStart);
      wrap.removeEventListener('touchend', onTouchEnd);
      wrap.removeEventListener('contextmenu', onCtx);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('blur', onBlur);
    };
  }, [queueDir, sync]);

  /* keyboard */
  useEffect(() => {
    const dirMap: Record<string, Dir> = {
      ArrowUp: DIRS.up,
      KeyW: DIRS.up,
      ArrowDown: DIRS.down,
      KeyS: DIRS.down,
      ArrowLeft: DIRS.left,
      KeyA: DIRS.left,
      ArrowRight: DIRS.right,
      KeyD: DIRS.right,
    };
    const onKey = (e: KeyboardEvent) => {
      const s = stRef.current!;
      const dir = dirMap[e.code];
      if (dir) {
        e.preventDefault();
        queueDir(dir);
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (s.phase === 'menu' || s.phase === 'gameover') start();
        else togglePause();
        return;
      }
      if (e.code === 'KeyR') {
        if (s.phase !== 'menu') start();
        return;
      }
      if (e.code === 'Escape') {
        if (s.phase === 'playing' || s.phase === 'paused') togglePause();
        else if (s.phase === 'gameover') toMenu();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [queueDir, start, togglePause, toMenu]);

  return { canvasRef, wrapRef, ui, start, togglePause, toMenu, setDifficulty, toggleMute, queueDir };
}

export type SnakeGameApi = ReturnType<typeof useSnakeGame>;
