// World Tour sound set — tiny Web Audio synth voices in the same pentatonic,
// never-harsh family as `sfx` in audio.ts. Shares its AudioContext and mute
// flag; nothing plays until `unlockAudio()` has run from a user gesture.
import { audioCtx, isMuted, tone } from "./audio";

// C major pentatonic, three octaves.
const N = {
  E4: 329.63, G4: 392, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880,
  C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760, C7: 2093,
};
const LADDER = [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6, N.D6, N.E6, N.G6, N.A6, N.C7];

function live(): AudioContext | null {
  const ctx = audioCtx();
  return ctx && !isMuted() ? ctx : null;
}

interface GlideOpts {
  gain?: number;
  type?: OscillatorType;
  attack?: number;
}

/** A single voice sliding from `f0` to `f1` — blips, boings, thunks, soft hums. */
function glide(f0: number, f1: number, at: number, dur: number, { gain = 0.08, type = "sine", attack = 0.012 }: GlideOpts = {}): void {
  const ctx = live();
  if (!ctx) return;
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(f1, t0 + dur * 0.85);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

let noiseBuf: AudioBuffer | null = null;
function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noiseBuf || noiseBuf.sampleRate !== ctx.sampleRate) {
    noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.6), ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1; // cosmetic noise
  }
  return noiseBuf;
}

/** Band-passed noise sweeping from `f0` to `f1` — air, paper, a soft thud. */
function swish(at: number, dur: number, gain: number, f0: number, f1: number, q = 0.9): void {
  const ctx = live();
  if (!ctx) return;
  const t0 = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = q;
  band.frequency.setValueAtTime(f0, t0);
  band.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(band).connect(g).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

export const tourSfx = {
  /** Tile picked up / selected. */
  pop(): void {
    glide(540, 920, 0, 0.07, { gain: 0.07 });
  },
  /** Tile lands in a slot. */
  place(): void {
    glide(270, 150, 0, 0.11, { gain: 0.11, type: "triangle" });
    tone(N.E6, 0, 0.04, 0.015);
  },
  /** A pair matched. */
  match(): void {
    tone(N.E5, 0, 0.14, 0.1);
    tone(N.A5, 0.08, 0.24, 0.11);
    tone(N.E6, 0.08, 0.2, 0.035, "triangle");
  },
  /** "Almost" — a soft, curious two-note hum. Never a buzzer. */
  nudge(): void {
    glide(N.E4, N.E4, 0, 0.17, { gain: 0.06, attack: 0.04 });
    glide(N.G4, N.G4 * 1.02, 0.15, 0.28, { gain: 0.06, attack: 0.04 });
    glide(N.G4 * 2, N.G4 * 2, 0.15, 0.2, { gain: 0.012, type: "triangle", attack: 0.04 });
  },
  /** Rising sparkle for a streak — starts higher as `level` grows. */
  combo(level: number): void {
    const start = Math.min(7, Math.max(0, Math.round(level) - 1));
    for (let i = 0; i < 3; i++) tone(LADDER[start + i], i * 0.055, 0.16, 0.09);
    tone(LADDER[start + 3], 0.165, 0.32, 0.07, "triangle");
  },
  /** Sheet slides / screen transition. */
  whoosh(): void {
    swish(0, 0.32, 0.07, 350, 2600);
  },
  /** Passport stamp: a soft thunk, then a sparkle. */
  stamp(): void {
    glide(170, 55, 0, 0.16, { gain: 0.24 });
    swish(0, 0.07, 0.09, 900, 300, 0.6);
    tone(N.E6, 0.11, 0.14, 0.05);
    tone(N.A6, 0.17, 0.16, 0.045);
    tone(N.C7, 0.23, 0.3, 0.04, "triangle");
  },
  /** Chest opens: a quick run up into a shimmering chord. */
  chest(): void {
    swish(0, 0.22, 0.04, 500, 1800);
    [N.C5, N.E5, N.G5, N.C6, N.E6].forEach((f, i) => tone(f, 0.06 + i * 0.06, 0.2, 0.09));
    tone(N.C6, 0.42, 0.7, 0.08);
    tone(N.E6, 0.42, 0.7, 0.06);
    tone(N.G6, 0.42, 0.7, 0.05);
    tone(N.C7, 0.5, 0.5, 0.03, "triangle");
  },
  /** Pogo's hop — a little boing. */
  hop(): void {
    glide(310, 650, 0, 0.14, { gain: 0.07 });
  },
  /** Lesson complete: a proud "ta-da-daa, da-da-DAA". */
  lessonDone(): void {
    const tune: [number, number, number][] = [
      [N.C5, 0, 0.14], [N.E5, 0.12, 0.14], [N.G5, 0.24, 0.26],
      [N.A5, 0.5, 0.12], [N.G5, 0.62, 0.12], [N.C6, 0.76, 0.8],
    ];
    for (const [f, at, dur] of tune) {
      tone(f, at, dur, 0.1, "triangle");
      tone(f, at, dur, 0.06);
    }
    tone(N.E5, 0.76, 0.7, 0.06);
    tone(N.G5, 0.76, 0.7, 0.06);
    tone(N.E6, 0.84, 0.6, 0.04);
    tone(N.C7, 0.96, 0.45, 0.03, "triangle");
  },
};
