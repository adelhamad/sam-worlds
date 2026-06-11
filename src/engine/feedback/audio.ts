// Pentatonic feedback chimes — can't sound wrong. Fully offline Web Audio.
let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean): void {
  muted = m;
}

/** Must be called from a user gesture once (tap anywhere). */
export function unlockAudio(): void {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
}

/** Shared context so the music engine plays through the same output. */
export function audioCtx(): AudioContext | null {
  return ctx;
}

// C major pentatonic
const P = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5 };

function tone(freq: number, at: number, dur: number, gain = 0.12, type: OscillatorType = "sine"): void {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

const up = [P.C5, P.D5, P.E5, P.G5, P.A5, P.C6];

/** Play an arbitrary pitch (piano keys, melodies). Respects mute. */
export function playPitch(freq: number, dur = 0.45, at = 0): void {
  tone(freq, at, dur, 0.14, "triangle");
  tone(freq * 2, at, dur * 0.6, 0.04, "sine");
}

export const sfx = {
  tap(): void {
    tone(P.G5, 0, 0.08, 0.05, "triangle");
  },
  correct(): void {
    const i = Math.floor(Math.random() * 4);
    tone(up[i], 0, 0.18);
    tone(up[i + 2], 0.09, 0.25);
  },
  wrong(): void {
    // gentle, never punishing
    tone(220, 0, 0.18, 0.06, "triangle");
  },
  earn(): void {
    tone(P.E5, 0, 0.1, 0.08);
    tone(P.A5, 0.07, 0.1, 0.08);
    tone(P.C6, 0.14, 0.2, 0.1);
  },
  stageComplete(): void {
    [P.C5, P.E5, P.G5, P.C6, P.G5, P.C6].forEach((f, i) => tone(f, i * 0.12, 0.3, 0.12));
  },
  badge(): void {
    [P.C5, P.E5, P.G5, P.A5, P.C6, P.A5, P.C6, P.C6 * 1.5].forEach((f, i) =>
      tone(f, i * 0.13, 0.35, 0.13),
    );
  },
  /** Unique Perfect Run fanfare: a fast rising gliss + sparkle. */
  perfect(): void {
    [P.C5, P.D5, P.E5, P.G5, P.A5, P.C6].forEach((f, i) => tone(f, i * 0.07, 0.16, 0.12));
    tone(P.C6, 0.5, 0.5, 0.14);
    tone(P.C6 * 2, 0.58, 0.4, 0.08, "triangle");
  },
};
