// Shared music theory for the Melody Engine — one octave keyboard C4–C5.
export const NOTE_FREQ: Record<string, number> = {
  C4: 261.63, "C#4": 277.18, D4: 293.66, "D#4": 311.13, E4: 329.63,
  F4: 349.23, "F#4": 369.99, G4: 392.0, "G#4": 415.3, A4: 440.0,
  "A#4": 466.16, B4: 493.88, C5: 523.25,
};

export const KEYBOARD = Object.keys(NOTE_FREQ);
export const WHITE_KEYS = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];

/** Semitone index within the keyboard (C4 = 0). */
export function semitone(note: string): number {
  return KEYBOARD.indexOf(note);
}

export function transpose(note: string, semis: number): string | null {
  const i = semitone(note) + semis;
  return i >= 0 && i < KEYBOARD.length ? KEYBOARD[i] : null;
}

/** Interval names used in prompts, by semitone distance. */
export const INTERVALS: Record<number, string> = {
  2: "2nd", 4: "3rd", 5: "4th", 7: "5th", 9: "6th", 12: "octave",
};

/** Triads built from a root: major / minor (within keyboard range). */
export function triad(root: string, quality: "major" | "minor"): string[] | null {
  const third = transpose(root, quality === "major" ? 4 : 3);
  const fifth = transpose(root, 7);
  return third && fifth ? [root, third, fifth] : null;
}
