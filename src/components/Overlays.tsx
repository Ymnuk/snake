import type { ReactNode } from 'react';
import type { Difficulty } from '../game/engine';
import { DIFFICULTIES, DIFF_ORDER, fmtTime, loadBest } from '../game/engine';
import type { SnakeGameApi } from '../game/useSnakeGame';
import { IconApple, IconHome, IconPause, IconPlay, IconRestart, IconRuler, IconTrophy, SnakeLogo } from './Icons';

function DiffPicker({ game, compact = false }: { game: SnakeGameApi; compact?: boolean }) {
  const { ui, setDifficulty } = game;
  return (
    <div className={`grid grid-cols-3 gap-2 ${compact ? 'w-56' : 'w-full max-w-xs'}`}>
      {DIFF_ORDER.map((d: Difficulty) => (
        <button
          key={d}
          type="button"
          className={`diff-pill ${ui.difficulty === d ? `active-${d}` : ''}`}
          onClick={() => setDifficulty(d)}
          aria-pressed={ui.difficulty === d}
        >
          {DIFFICULTIES[d].label}
        </button>
      ))}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl overflow-hidden bg-pine-950/85 backdrop-blur-[3px]">
      <div className="overlay-enter w-full max-h-full overflow-y-auto px-5 py-6 flex flex-col items-center text-center">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------ МЕНЮ ------------------------------ */

function MenuOverlay({ game }: { game: SnakeGameApi }) {
  const { ui, start } = game;
  const best = loadBest(ui.difficulty);
  return (
    <Shell>
      <div className="flex items-center gap-3 mb-3">
        <SnakeLogo className="w-10 h-10 drop-shadow-[0_0_12px_rgba(184,255,94,0.5)]" />
        <h1 className="font-display title-shimmer text-2xl sm:text-3xl leading-none">ЗМЕЙКА</h1>
      </div>
      <p className="text-fog/70 text-sm mb-5 max-w-[240px]">
        Собирай яблоки, расти и не врезайся — ни в стены, ни в собственный хвост.
      </p>

      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-moss-400/70 mb-2">Сложность</span>
      <DiffPicker game={game} />
      <p className="text-[11px] text-fog/50 mt-1.5 mb-5">{DIFFICULTIES[ui.difficulty].hint}</p>

      <button type="button" className="btn btn-primary text-[13px] sm:text-sm px-8 py-4 mb-5" onClick={() => start()}>
        <IconPlay className="w-4 h-4" /> ИГРАТЬ
      </button>

      <div className="flex items-center gap-2 text-amber-glow/90 mb-5">
        <IconTrophy className="w-4 h-4" />
        <span className="text-xs font-semibold">
          Рекорд ({DIFFICULTIES[ui.difficulty].label.toLowerCase()}): <span className="font-display text-[11px]">{best}</span>
        </span>
      </div>

      <div className="hidden md:flex flex-col gap-2 text-[11px] text-fog/55">
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <span className="keycap">W</span>
          <span className="keycap">A</span>
          <span className="keycap">S</span>
          <span className="keycap">D</span>
          <span className="opacity-60">или</span>
          <span className="keycap">←↑↓→</span>
          <span className="ml-1">— движение</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="keycap">Пробел</span> — пауза
          <span className="keycap ml-2">R</span> — заново
        </div>
      </div>
      <p className="md:hidden text-[11px] text-fog/55">Свайпай по полю или жми кнопки под ним</p>
    </Shell>
  );
}

/* --------------------------- ОТСЧЁТ --------------------------- */

function CountdownOverlay({ n }: { n: number }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div
        key={n}
        className="count-num font-display text-6xl sm:text-7xl text-lime-glow"
        style={{ textShadow: '0 0 34px rgba(184,255,94,0.65)' }}
      >
        {n}
      </div>
    </div>
  );
}

/* --------------------------- ПАУЗА --------------------------- */

function PauseOverlay({ game }: { game: SnakeGameApi }) {
  const { ui, togglePause, start, toMenu } = game;
  return (
    <Shell>
      <div className="w-11 h-11 rounded-xl bg-pine-800 border border-pine-line flex items-center justify-center text-mint mb-4">
        <IconPause className="w-5 h-5" />
      </div>
      <h2 className="font-display text-xl text-fog mb-1">ПАУЗА</h2>
      <p className="text-xs text-fog/55 mb-5">
        Счёт: <span className="text-amber-glow font-bold">{ui.score}</span> · сложность «{DIFFICULTIES[ui.difficulty].label.toLowerCase()}»
      </p>
      <div className="flex flex-col gap-2.5 w-full max-w-[230px]">
        <button type="button" className="btn btn-primary text-[11px] px-6 py-3.5" onClick={togglePause}>
          <IconPlay className="w-3.5 h-3.5" /> ПРОДОЛЖИТЬ
        </button>
        <button type="button" className="btn btn-ghost text-[11px] px-6 py-3.5" onClick={() => start()}>
          <IconRestart className="w-3.5 h-3.5" /> ЗАНОВО
        </button>
        <button type="button" className="btn btn-ghost text-[11px] px-6 py-3.5" onClick={toMenu}>
          <IconHome className="w-3.5 h-3.5" /> В МЕНЮ
        </button>
      </div>
      <p className="hidden md:block text-[11px] text-fog/45 mt-5">
        <span className="keycap">Пробел</span> — продолжить
      </p>
    </Shell>
  );
}

/* ------------------------ КОНЕЦ ИГРЫ ------------------------ */

function GameOverOverlay({ game }: { game: SnakeGameApi }) {
  const { ui, start, toMenu } = game;
  const causeText =
    ui.cause === 'wall' ? 'Змейка врезалась в стену' : 'Змейка укусила себя за хвост';
  return (
    <Shell>
      {ui.isNewBest ? (
        <div className="font-display text-[10px] text-pine-950 bg-gradient-to-b from-amber-glow to-[#f5a623] rounded-full px-4 py-2 mb-3 shadow-[0_0_26px_rgba(255,194,75,0.5)] blink-record">
          НОВЫЙ РЕКОРД!
        </div>
      ) : (
        <div className="w-11 h-11 rounded-xl bg-coral/15 border border-coral/40 flex items-center justify-center text-coral mb-3">
          <IconApple className="w-5 h-5" />
        </div>
      )}
      <h2 className="font-display text-lg sm:text-xl text-coral mb-1.5" style={{ textShadow: '0 0 24px rgba(255,107,94,0.4)' }}>
        ИГРА ОКОНЧЕНА
      </h2>
      <p className="text-xs text-fog/55 mb-4">{causeText}</p>

      <div className="font-display text-4xl sm:text-5xl text-amber-glow mb-1 tabular-nums" style={{ textShadow: '0 0 30px rgba(255,194,75,0.45)' }}>
        {ui.score}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-fog/60 mb-5">
        <IconTrophy className="w-3.5 h-3.5 text-amber-glow/80" />
        рекорд: <span className="font-display text-[10px] text-fog/85">{ui.best}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 w-full max-w-xs mb-5">
        <div className="stat-tile px-2 py-2.5">
          <IconApple className="w-3.5 h-3.5 mx-auto text-coral/80 mb-1" />
          <div className="font-display text-[11px] text-fog">{ui.apples}</div>
          <div className="text-[9px] uppercase tracking-widest text-fog/45 font-bold">яблок</div>
        </div>
        <div className="stat-tile px-2 py-2.5">
          <IconRuler className="w-3.5 h-3.5 mx-auto text-moss-300/80 mb-1" />
          <div className="font-display text-[11px] text-fog">{ui.length}</div>
          <div className="text-[9px] uppercase tracking-widest text-fog/45 font-bold">длина</div>
        </div>
        <div className="stat-tile px-2 py-2.5">
          <div className="font-display text-[11px] text-fog mt-4.5 mb-1">{fmtTime(ui.timeMs)}</div>
          <div className="text-[9px] uppercase tracking-widest text-fog/45 font-bold">время</div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 w-full max-w-[230px]">
        <button type="button" className="btn btn-primary text-[11px] px-6 py-3.5" onClick={() => start()}>
          <IconRestart className="w-3.5 h-3.5" /> ЕЩЁ РАЗ
        </button>
        <button type="button" className="btn btn-ghost text-[11px] px-6 py-3.5" onClick={toMenu}>
          <IconHome className="w-3.5 h-3.5" /> В МЕНЮ
        </button>
      </div>
      <p className="hidden md:block text-[11px] text-fog/45 mt-5">
        <span className="keycap">Пробел</span> — сыграть ещё раз
      </p>
    </Shell>
  );
}

/* ------------------------- ЭКСПОРТ ------------------------- */

export function Overlays({ game }: { game: SnakeGameApi }) {
  switch (game.ui.phase) {
    case 'menu':
      return <MenuOverlay game={game} />;
    case 'countdown':
      return <CountdownOverlay n={game.ui.countdown} />;
    case 'paused':
      return <PauseOverlay game={game} />;
    case 'gameover':
      return <GameOverOverlay game={game} />;
    default:
      return null;
  }
}
