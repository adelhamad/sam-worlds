import type { RNG } from "../rng";

/** How the player constructs the answer (anti-guessing rule 2). */
export type InputMode =
  | "numpad" // type a number
  | "piano" // tap piano keys (Melody Engine)
  | "letters" // type letters (Cipher Bay)
  | "clock" // set analog clock hands (Time Keep)
  | "commands" // program the robot, then RUN (Robot Valley)
  | "toggle" // flip circuit switches, then POWER (Logic Circuits)
  | "launch" // aim the cannon, then FIRE (Builder's Reach)
  | "order" // tap cards into sequence (Living Planet / Atlas)
  | "choices"; // true matching questions only (rule 1 still applies)

export interface Question {
  id: string;
  prompt: string;
  answer: string;
  choices: string[]; // for "choices" mode; includes the answer, shuffled
  hint: string;
  /**
   * Identifies the question's SUBJECT for within-session dedupe. Set this when
   * the prompt text is generic ("Unscramble the word!", "Wire it…") but the
   * content varies. Falls back to the prompt when omitted.
   */
  dedupeKey?: string;
  /** Defaults to "numpad" when omitted. */
  inputMode?: InputMode;
  /** Extra JSON-serializable data the input widget needs (maze, circuit, notes…). */
  payload?: Record<string, unknown>;
}

export interface GenContext {
  /** 0..1 position within the stage's difficulty band (from skill rating). */
  difficulty: number;
  /** Set after two consecutive misses — produce a gentler variant. */
  easier: boolean;
}

export type GeneratorParams = Record<string, unknown>;
export type Generator = (params: GeneratorParams, rng: RNG, ctx: GenContext) => Question;

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Build a unique choice list around a numeric answer. */
export function numericChoices(
  rng: RNG,
  answer: number,
  spreads: number[],
  count = 4,
): string[] {
  const set = new Set<number>([answer]);
  const candidates = spreads.flatMap((s) => [answer + s, answer - s]).filter((v) => v >= 0);
  for (const c of candidates) {
    if (set.size >= count) break;
    set.add(c);
  }
  let bump = 1;
  while (set.size < count) {
    set.add(answer + 10 + bump++);
  }
  const all = [...set].slice(0, count);
  // shuffle deterministically with the same rng
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.map(String);
}
