// Pogo's voice — a tiny formant synth (sawtooth through two band-pass
// "vowel" filters) plus a few cartoon effects. Same conventions as tourSfx.ts:
// shares the AudioContext and mute flag from audio.ts, silent until
// `unlockAudio()` has run, every envelope ramps (no clicks).
import { audioCtx, isMuted } from "./audio";

function live(): AudioContext | null {
  const ctx = audioCtx();
  return ctx && !isMuted() ? ctx : null;
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

type Vowel = "a" | "o" | "e" | "u";
// [first formant, second formant] in Hz.
const FORMANTS: Record<Vowel, [number, number]> = {
  a: [1050, 2000],
  o: [780, 1800],
  e: [900, 2500],
  u: [720, 2100],
};

interface SyllableOpts {
  vowel?: Vowel;
  peak?: number;
  /** Vibrato rate (Hz) and depth (Hz of pitch swing). */
  vibRate?: number;
  vibDepth?: number;
  wave?: "sawtooth" | "triangle";
}

/** One vowel-like chirp: pitch glide f0 -> f1 through two formant filters. */
function syllable(at: number, dur: number, f0: number, f1: number, opts: SyllableOpts = {}): void {
  const ctx = live();
  if (!ctx) return;
  const { vowel = "a", peak = 0.07, vibRate = 0, vibDepth = 0, wave = "sawtooth" } = opts;
  const t0 = ctx.currentTime + at;
  const end = t0 + dur;
  const osc = ctx.createOscillator();
  osc.type = wave;
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(f1, t0 + dur * 0.85);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
  env.gain.exponentialRampToValueAtTime(peak * 0.85, t0 + dur * 0.7);
  env.gain.exponentialRampToValueAtTime(0.0001, end);
  FORMANTS[vowel].forEach((freq, i) => {
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = freq;
    band.Q.value = i === 0 ? 5 : 7;
    const trim = ctx.createGain();
    trim.gain.value = i === 0 ? 1.8 : 2.4; // second formant is naturally quieter
    osc.connect(band).connect(trim).connect(env);
  });
  env.connect(ctx.destination);
  const stops: OscillatorNode[] = [osc];
  if (vibRate > 0 && vibDepth > 0) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = vibRate;
    depth.gain.value = vibDepth;
    lfo.connect(depth).connect(osc.frequency);
    stops.push(lfo);
  }
  stops.forEach((o) => {
    o.start(t0);
    o.stop(end + 0.05);
  });
}

interface GlideOpts {
  gain?: number;
  type?: OscillatorType;
  attack?: number;
  vibRate?: number;
  vibDepth?: number;
}

/** Plain single-oscillator glide for effects (thud, tink, squeak, whistle). */
function glide(f0: number, f1: number, at: number, dur: number, o: GlideOpts = {}): void {
  const ctx = live();
  if (!ctx) return;
  const { gain = 0.06, type = "sine", attack = 0.012, vibRate = 0, vibDepth = 0 } = o;
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(f1, t0 + dur * 0.9);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(gain * 0.8, t0 + Math.max(attack, dur * 0.7));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
  if (vibRate > 0 && vibDepth > 0) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = vibRate;
    depth.gain.value = vibDepth;
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + dur + 0.05);
  }
}

/** Band-passed noise sweeping f0 -> f1 (air, rush). */
function swish(at: number, dur: number, gain: number, f0: number, f1: number, q = 1.2): void {
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
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(band).connect(g).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

// Four slightly different happy chirps: [start, peak, vowel].
const HAPPY: Array<[number, number, Vowel]> = [
  [620, 900, "e"],
  [560, 1000, "a"],
  [680, 860, "e"],
  [600, 960, "o"],
];

export const pogoVoice = {
  /** Correct answer: a short, bright, pleased chirp. */
  happy(variant = 0): void {
    const [a, b, vowel] = HAPPY[Math.abs(Math.trunc(variant)) % HAPPY.length];
    syllable(0, 0.1, a, b, { vowel, peak: 0.075 });
    syllable(0.09, 0.14, b, b * 0.92, { vowel: "e", peak: 0.07 });
  },
  /** A miss: a soft, sympathetic falling "aww". */
  aww(): void {
    syllable(0, 0.6, 640, 400, { vowel: "o", peak: 0.075, vibRate: 5.5, vibDepth: 8, wave: "triangle" });
  },
  /** Greeting: two quick upward syllables. */
  hey(): void {
    syllable(0, 0.11, 520, 760, { vowel: "e", peak: 0.075 });
    syllable(0.13, 0.17, 640, 960, { vowel: "a", peak: 0.08 });
  },
  /** Big cheer: "ya-hoo-oo!" rising then settling. */
  yay(): void {
    syllable(0, 0.14, 520, 720, { vowel: "a", peak: 0.075 });
    syllable(0.17, 0.26, 760, 1050, { vowel: "o", peak: 0.085 });
    syllable(0.45, 0.45, 1000, 700, { vowel: "u", peak: 0.075, vibRate: 6, vibDepth: 14 });
  },
  /** Amazed "oooh!": one long rising, held vowel. */
  wow(): void {
    syllable(0, 0.6, 430, 780, { vowel: "o", peak: 0.08, vibRate: 5, vibDepth: 6, wave: "triangle" });
  },
  /** Jet whoosh toward the viewer: rising filtered noise plus a rising whine. */
  zoom(dur = 0.55): void {
    swish(0, dur, 0.12, 250, 3200, 1.4);
    glide(260, 1500, 0, dur, { gain: 0.035, type: "triangle", attack: dur * 0.3 });
  },
  /** Soft rubbery thud, glassy tink, and a tiny "oof". */
  bonk(): void {
    glide(190, 55, 0, 0.18, { gain: 0.085 });
    glide(2300, 2250, 0, 0.1, { gain: 0.03 });
    glide(3400, 3300, 0.005, 0.07, { gain: 0.015 });
    syllable(0.14, 0.14, 520, 380, { vowel: "o", peak: 0.07 });
  },
  /** Rubber squeaking down glass: a wobbling, slowly falling squeak. */
  squeak(dur = 0.8): void {
    glide(1250, 620, 0, dur, { gain: 0.045, type: "triangle", attack: 0.04, vibRate: 22, vibDepth: 70 });
  },
  /** Dizzy: wobbly cuckoo-like warble with heavy vibrato. */
  dizzy(): void {
    const wob = { vowel: "u", peak: 0.07, vibRate: 9, vibDepth: 45, wave: "triangle" } as const;
    syllable(0, 0.17, 760, 740, wob);
    syllable(0.18, 0.17, 580, 560, wob);
    syllable(0.36, 0.17, 760, 740, wob);
    syllable(0.54, 0.2, 580, 480, wob);
  },
  /** Spring boing; each successive `step` is lower and quieter. */
  boing(step = 0): void {
    const s = Math.max(0, step);
    const k = Math.pow(0.82, s);
    glide(210 * k, 520 * k, 0, 0.28, { gain: 0.1 * Math.pow(0.8, s), vibRate: 28, vibDepth: 50 * k });
  },
  /** Descending whistle for falling from above. */
  whistle(dur = 0.5): void {
    glide(1500, 480, 0, dur, { gain: 0.04, attack: 0.05, vibRate: 7, vibDepth: 15 });
  },
  /** The moment of a miss: a soft two-note "uh-oh" (falling, never a buzzer). */
  uhoh(): void {
    syllable(0, 0.13, 600, 580, { vowel: "u", peak: 0.065, wave: "triangle" });
    syllable(0.16, 0.28, 480, 400, { vowel: "o", peak: 0.07, vibRate: 5, vibDepth: 6, wave: "triangle" });
  },
  /** Pulling himself together: a short, firm, rising "hm!". */
  hm(): void {
    syllable(0, 0.17, 380, 450, { vowel: "u", peak: 0.065, wave: "triangle" });
  },
  /** Fixed it: a breathy exhale with a soft falling "phew". */
  phew(): void {
    swish(0, 0.5, 0.045, 2200, 700, 0.9);
    syllable(0.04, 0.34, 660, 470, { vowel: "u", peak: 0.055, wave: "triangle" });
  },
  /** A tiny pleased giggle: five very short blips. */
  giggle(): void {
    [760, 640, 800, 660, 840].forEach((f, i) => {
      syllable(i * 0.075, 0.06, f, f * 0.82, { vowel: i % 2 ? "o" : "e", peak: 0.06 });
    });
  },
};
