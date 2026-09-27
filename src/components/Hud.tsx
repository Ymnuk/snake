import type { SnakeGameApi } from '../game/useSnakeGame';
import { DIFFICULTIES, fmtTime } from '../game/engine';
import { IconBolt, IconClock, IconHome, IconPause, IconPlay, IconRestart, IconRuler, IconTrophy } from './Icons';

export function Hud({ game }: { game: SnakeGameApi }) {
  const { ui, togglePause, start, toMenu } = game;
  const playing = ui.phase === 'playing' || ui.phase === 'countdown';

  return (
    <div className="w-full max-w-[620px] mx-auto">
      <div className="flex items-stretch gap-2">
        {/* Счёт — главный */}
        <div className="stat-tile flex-1 min-w-0 px-3 py-2 flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-moss-400/70">Счёт</span>
          <span
            key={ui.score}
            className="score-pop font-display text-amber-glow text-lg sm:text-2xl leading-tight tabular-nums inline-block origin-left"
            style={{ textShadow: '0 0 18px rgba(255,194,75,0.4)' }}
          >
            {ui.score}
          </span>
        </div>

        <div className="stat-tile px-3 py-2 flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-moss-400/70 flex items-center gap-1">
            <IconTrophy className="w-3 h-3 text-amber-glow/80" /> Рекорд
          </span>
          <span className={`font-display text-sm sm:text-lg leading-tight tabular-nums ${ui.isNewBest ? 'text-lime-glow blink-record' : 'text-fog/90'}`}>
            {ui.best}
          </span>
        </div>

        <div className="stat-tile px-3 py-2 hidden sm:flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-moss-400/70 flex items-center gap-1">
            <IconBolt className="w-3 h-3 text-mint/80" /> Темп
          </span>
          <span className="font-display text-sm sm:text-lg leading-tight text-mint tabular-nums">
            ×{ui.speedMul.toFixed(1)}
          </span>
        </div>

        <div className="stat-tile px-3 py-2 hidden sm:flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-moss-400/70 flex items-center gap-1">
            <IconRuler className="w-3 h-3 text-moss-300/80" /> Длина
          </span>
          <span className="font-display text-sm sm:text-lg leading-tight text-moss-300 tabular-nums">{ui.length}</span>
        </div>

        <div className="stat-tile px-3 py-2 hidden md:flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-moss-400/70 flex items-center gap-1">
            <IconClock className="w-3 h-3 text-fog/60" /> Время
          </span>
          <span className="font-display text-sm sm:text-lg leading-tight text-fog/85 tabular-nums">{fmtTime(ui.timeMs)}</span>
        </div>

        {/* действия */}
        <div className="flex items-center gap-1.5 pl-0.5">
          <button
            type="button"
            className="icon-btn w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center"
            onClick={togglePause}
            disabled={ui.phase !== 'playing' && ui.phase !== 'paused'}
            style={{ opacity: ui.phase === 'playing' || ui.phase === 'paused' ? 1 : 0.4 }}
            title={ui.phase === 'paused' ? 'Продолжить (Пробел)' : 'Пауза (Пробел)'}
            aria-label="Пауза"
          >
            {ui.phase === 'paused' ? <IconPlay className="w-4.5 h-4.5" /> : <IconPause className="w-4.5 h-4.5" />}
          </button>
          <button
            type="button"
            className="icon-btn w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center"
            onClick={() => start()}
            disabled={!playing && ui.phase !== 'paused' && ui.phase !== 'gameover'}
            style={{ opacity: ui.phase === 'menu' ? 0.4 : 1 }}
            title="Заново (R)"
            aria-label="Заново"
          >
            <IconRestart className="w-4.5 h-4.5" />
          </button>
          <button
            type="button"
            className="icon-btn w-10 h-10 sm:w-11 sm:h-11 hidden sm:flex items-center justify-center"
            onClick={toMenu}
            disabled={ui.phase === 'menu'}
            style={{ opacity: ui.phase === 'menu' ? 0.4 : 1 }}
            title="В меню (Esc)"
            aria-label="В меню"
          >
            <IconHome className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {ui.isNewBest && playing && (
        <div className="mt-1.5 flex justify-center">
          <span className="font-display text-[9px] text-lime-glow bg-lime-glow/10 border border-lime-glow/40 rounded-full px-3 py-1.5 blink-record">
            НОВЫЙ РЕКОРД!
          </span>
        </div>
      )}
    </div>
  );
}

export function DiffBadge({ difficulty }: { difficulty: keyof typeof DIFFICULTIES }) {
  const colors: Record<string, string> = {
    easy: 'text-mint border-mint/40 bg-mint/10',
    normal: 'text-lime-glow border-lime-glow/40 bg-lime-glow/10',
    hard: 'text-coral border-coral/40 bg-coral/10',
  };
  return (
    <span className={`font-display text-[8px] px-2.5 py-1.5 rounded-full border ${colors[difficulty]}`}>
      {DIFFICULTIES[difficulty].label}
    </span>
  );
}
