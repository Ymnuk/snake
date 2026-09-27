import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Dir } from '../game/engine';
import { DIRS } from '../game/engine';
import type { SnakeGameApi } from '../game/useSnakeGame';
import { IconChevron, IconPause, IconPlay } from './Icons';

export function TouchPad({ game }: { game: SnakeGameApi }) {
  const { ui, queueDir, togglePause } = game;

  const press = (dir: Dir) => (e: ReactPointerEvent) => {
    e.preventDefault();
    queueDir(dir);
  };

  return (
    <div className="md:hidden w-full max-w-[280px] mx-auto select-none" aria-label="Экранные кнопки управления">
      <div className="grid grid-cols-3 grid-rows-3 gap-1.5" style={{ height: 'min(46vw, 210px)' }}>
        <div />
        <button type="button" className="dpad-btn" onPointerDown={press(DIRS.up)} aria-label="Вверх">
          <IconChevron dir="up" className="w-7 h-7" />
        </button>
        <div />
        <button type="button" className="dpad-btn" onPointerDown={press(DIRS.left)} aria-label="Влево">
          <IconChevron dir="left" className="w-7 h-7" />
        </button>
        <button
          type="button"
          className="dpad-btn"
          onPointerDown={(e) => {
            e.preventDefault();
            togglePause();
          }}
          aria-label="Пауза"
          style={{
            color: ui.phase === 'paused' ? '#c9ff7d' : undefined,
            borderColor: ui.phase === 'paused' ? 'rgba(184,255,94,0.5)' : undefined,
          }}
        >
          {ui.phase === 'paused' ? <IconPlay className="w-6 h-6" /> : <IconPause className="w-6 h-6" />}
        </button>
        <button type="button" className="dpad-btn" onPointerDown={press(DIRS.right)} aria-label="Вправо">
          <IconChevron dir="right" className="w-7 h-7" />
        </button>
        <div />
        <button type="button" className="dpad-btn" onPointerDown={press(DIRS.down)} aria-label="Вниз">
          <IconChevron dir="down" className="w-7 h-7" />
        </button>
        <div />
      </div>
    </div>
  );
}
