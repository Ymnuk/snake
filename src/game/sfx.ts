/* Крошечный аркадный синтезатор на WebAudio — без внешних файлов. */

type OscType = OscillatorType;

class Sfx {
  muted = false;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  private ensure(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  private tone(
    freq: number,
    dur: number,
    type: OscType = 'square',
    vol = 0.16,
    delay = 0,
    slideTo?: number,
  ): void {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    try {
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    } catch {
      /* звук — не повод падать */
    }
  }

  eat(): void {
    this.tone(540, 0.07, 'square', 0.16);
    this.tone(810, 0.09, 'square', 0.13, 0.055);
  }

  bonus(): void {
    this.tone(523, 0.08, 'triangle', 0.18);
    this.tone(659, 0.08, 'triangle', 0.18, 0.07);
    this.tone(784, 0.08, 'triangle', 0.18, 0.14);
    this.tone(1046, 0.14, 'triangle', 0.2, 0.21);
  }

  record(): void {
    this.tone(880, 0.07, 'square', 0.12);
    this.tone(1174, 0.1, 'square', 0.12, 0.07);
  }

  die(): void {
    this.tone(300, 0.42, 'sawtooth', 0.2, 0, 52);
    this.tone(180, 0.5, 'square', 0.14, 0.06, 40);
  }

  click(): void {
    this.tone(720, 0.05, 'triangle', 0.12);
  }

  count(go = false): void {
    if (go) this.tone(880, 0.16, 'square', 0.18);
    else this.tone(440, 0.08, 'square', 0.14);
  }

  pause(): void {
    this.tone(500, 0.07, 'triangle', 0.12);
    this.tone(360, 0.09, 'triangle', 0.12, 0.07);
  }
}

export const sfx = new Sfx();
