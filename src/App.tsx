import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useSnakeGame } from './game/useSnakeGame';
import { Hud, DiffBadge } from './components/Hud';
import { Overlays } from './components/Overlays';
import { TouchPad } from './components/TouchPad';
import { IconSoundOff, IconSoundOn, SnakeLogo } from './components/Icons';

const FIREFLY_COLORS = ['rgba(184,255,94,0.9)', 'rgba(100,227,193,0.85)', 'rgba(255,194,75,0.8)', 'rgba(110,232,110,0.85)'];

function Background() {
  const flies = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: `${(i * 61) % 100}%`,
        top: `${18 + ((i * 37) % 78)}%`,
        size: 2 + ((i * 13) % 3),
        color: FIREFLY_COLORS[i % FIREFLY_COLORS.length],
        dur: 7 + ((i * 17) % 9),
        delay: -((i * 23) % 12),
        o: 0.35 + ((i * 7) % 5) / 10,
        x: ((i % 2 === 0 ? 1 : -1) * (14 + ((i * 11) % 30))),
      })),
    [],
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0 bg-grid" />
      <div className="glow-a absolute -top-[20%] -left-[15%] w-[70vmax] h-[70vmax] rounded-full" />
      <div className="glow-b absolute -bottom-[25%] -right-[15%] w-[75vmax] h-[75vmax] rounded-full" />
      {flies.map((f, i) => (
        <span
          key={i}
          className="firefly"
          style={
            {
              left: f.left,
              top: f.top,
              width: f.size,
              height: f.size,
              background: f.color,
              boxShadow: `0 0 ${f.size * 3}px ${f.color}`,
              animationDuration: `${f.dur}s`,
              animationDelay: `${f.delay}s`,
              '--ff-o': f.o,
              '--ff-x': `${f.x}px`,
            } as CSSProperties
          }
        />
      ))}
      <div className="scanlines absolute inset-0 opacity-60" />
    </div>
  );
}

export default function App() {
  const game = useSnakeGame();
  const { ui, wrapRef, canvasRef, toggleMute } = game;

  return (
    <div className="relative min-h-dvh flex flex-col">
      <Background />

      <div className="relative z-10 flex-1 flex flex-col items-center px-3 pt-3 pb-4 sm:px-4 sm:pt-4 gap-2.5 sm:gap-3 w-full max-w-[900px] mx-auto">
        {/* шапка */}
        <header className="w-full max-w-[620px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <SnakeLogo className="w-8 h-8 drop-shadow-[0_0_10px_rgba(184,255,94,0.45)]" />
            <div className="leading-none">
              <span className="font-display text-[13px] text-lime-glow tracking-wide" style={{ textShadow: '0 0 16px rgba(184,255,94,0.35)' }}>
                ЗМЕЙКА
              </span>
              <span className="block text-[10px] text-fog/45 font-semibold mt-1">неоновая аркада</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DiffBadge difficulty={ui.difficulty} />
            <button
              type="button"
              className="icon-btn w-10 h-10 flex items-center justify-center"
              onClick={toggleMute}
              title={ui.muted ? 'Включить звук' : 'Выключить звук'}
              aria-label={ui.muted ? 'Включить звук' : 'Выключить звук'}
            >
              {ui.muted ? <IconSoundOff className="w-4.5 h-4.5" /> : <IconSoundOn className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* HUD */}
        <Hud game={game} />

        {/* игровое поле */}
        <div
          ref={wrapRef}
          className="board-wrap aspect-square relative rounded-2xl"
          style={{ touchAction: 'none' }}
        >
          <canvas
            ref={canvasRef}
            className="block w-full h-full rounded-2xl shadow-[0_24px_70px_-18px_rgba(0,0,0,0.85),0_0_50px_-12px_rgba(62,207,94,0.28)]"
          />
          <Overlays game={game} />
        </div>

        {/* сенсорное управление */}
        <TouchPad game={game} />

        {/* подсказки */}
        <footer className="w-full max-w-[620px] flex items-center justify-center">
          <p className="hidden md:flex items-center gap-1.5 text-[11px] text-fog/45 flex-wrap justify-center">
            <span className="keycap">←↑↓→</span>
            <span className="opacity-70">/</span>
            <span className="keycap">WASD</span>
            <span className="ml-1">движение</span>
            <span className="mx-2 text-pine-line">•</span>
            <span className="keycap">Пробел</span>
            <span className="ml-1">пауза</span>
            <span className="mx-2 text-pine-line">•</span>
            <span className="keycap">R</span>
            <span className="ml-1">заново</span>
          </p>
          <p className="md:hidden text-[11px] text-fog/45 text-center">
            Свайп по полю — движение · золотой кристалл даёт +50, но тает на глазах
          </p>
        </footer>
      </div>
    </div>
  );
}
