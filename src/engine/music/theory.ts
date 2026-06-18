// Music theory for the Melody Engine v2 — REAL theory for a reader of both
// clefs (plan §6 World 2): intervals, key signatures, scales, chord quality,
// enharmonics, rhythm, ear-training. Pure data + helpers, no React.

const PITCH_CLASS: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5,
  "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};

/** Equal-temperament frequency for ANY note name (A4 = 440). Used so the
 * keyboard's one octave isn't a limit on what ear puzzles can sound. */
export function freq(note: string): number {
  const m = /^([A-G][#b]?)(-?\d+)$/.exec(note);
  if (!m) return 440;
  const midi = (parseInt(m[2], 10) + 1) * 12 + PITCH_CLASS[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Sharp-spelled chromatic name for a pitch class (display fallback). */
const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export function pcName(pc: number): string {
  return SHARP_NAMES[((pc % 12) + 12) % 12];
}

// ---------- intervals ----------
export interface IntervalDef {
  semis: number;
  name: string;
}
export const INTERVAL_NAMES: IntervalDef[] = [
  { semis: 1, name: "minor 2nd" },
  { semis: 2, name: "major 2nd" },
  { semis: 3, name: "minor 3rd" },
  { semis: 4, name: "major 3rd" },
  { semis: 5, name: "perfect 4th" },
  { semis: 7, name: "perfect 5th" },
  { semis: 8, name: "minor 6th" },
  { semis: 9, name: "major 6th" },
  { semis: 12, name: "octave" },
];
/** Simple number-only names (for younger framing of an interval). */
export const SIMPLE_INTERVALS: Record<number, string> = {
  1: "2nd", 2: "2nd", 3: "3rd", 4: "3rd", 5: "4th", 7: "5th", 8: "6th", 9: "6th", 11: "7th", 12: "octave",
};

// ---------- major keys & signatures ----------
export interface KeyDef {
  name: string;
  sharps: number;
  flats: number;
  /** The accidental note names in this key's signature. */
  marks: string[];
  /** The seven scale notes (correct spelling), starting on the tonic. */
  notes: string[];
}
export const MAJOR_KEYS: KeyDef[] = [
  { name: "C", sharps: 0, flats: 0, marks: [], notes: ["C", "D", "E", "F", "G", "A", "B"] },
  { name: "G", sharps: 1, flats: 0, marks: ["F#"], notes: ["G", "A", "B", "C", "D", "E", "F#"] },
  { name: "D", sharps: 2, flats: 0, marks: ["F#", "C#"], notes: ["D", "E", "F#", "G", "A", "B", "C#"] },
  { name: "A", sharps: 3, flats: 0, marks: ["F#", "C#", "G#"], notes: ["A", "B", "C#", "D", "E", "F#", "G#"] },
  { name: "E", sharps: 4, flats: 0, marks: ["F#", "C#", "G#", "D#"], notes: ["E", "F#", "G#", "A", "B", "C#", "D#"] },
  { name: "F", sharps: 0, flats: 1, marks: ["Bb"], notes: ["F", "G", "A", "Bb", "C", "D", "E"] },
  { name: "Bb", sharps: 0, flats: 2, marks: ["Bb", "Eb"], notes: ["Bb", "C", "D", "Eb", "F", "G", "A"] },
  { name: "Eb", sharps: 0, flats: 3, marks: ["Bb", "Eb", "Ab"], notes: ["Eb", "F", "G", "Ab", "Bb", "C", "D"] },
];

// ---------- enharmonics ----------
export const ENHARMONICS: Array<[string, string]> = [
  ["C#", "Db"], ["D#", "Eb"], ["F#", "Gb"], ["G#", "Ab"], ["A#", "Bb"],
];

// ---------- chord quality (by interval pattern above the root) ----------
export interface ChordQuality {
  name: string;
  thirds: [number, number]; // semitones: root→3rd, 3rd→5th
}
export const CHORD_QUALITIES: ChordQuality[] = [
  { name: "major", thirds: [4, 3] },
  { name: "minor", thirds: [3, 4] },
  { name: "diminished", thirds: [3, 3] },
  { name: "augmented", thirds: [4, 4] },
];

/** Build a chord's note names (sharp spelling) from a root note + quality. */
export function chordNotes(root: string, q: ChordQuality): string[] {
  const m = /^([A-G][#b]?)(\d+)$/.exec(root);
  if (!m) return [root];
  let pc = PITCH_CLASS[m[1]];
  let oct = parseInt(m[2], 10);
  const out = [`${SHARP_NAMES[pc]}${oct}`];
  for (const step of q.thirds) {
    pc += step;
    if (pc >= 12) {
      pc -= 12;
      oct += 1;
    }
    out.push(`${SHARP_NAMES[pc]}${oct}`);
  }
  return out;
}

// ---------- rhythm / durations (4/4) ----------
export interface DurationQ {
  q: string;
  a: string;
  options: string[];
}
export const RHYTHM_FACTS: DurationQ[] = [
  { q: "How many beats is a whole note? (4/4)", a: "4", options: ["1", "2", "3", "4"] },
  { q: "How many beats is a half note?", a: "2", options: ["1", "2", "3", "4"] },
  { q: "How many beats is a quarter note?", a: "1", options: ["½", "1", "2", "4"] },
  { q: "How many beats is a dotted half note?", a: "3", options: ["2", "2½", "3", "4"] },
  { q: "How many eighth notes fill one beat?", a: "2", options: ["1", "2", "3", "4"] },
  { q: "How many quarter notes fill a 4/4 bar?", a: "4", options: ["2", "3", "4", "8"] },
  { q: "How many beats is an eighth note?", a: "½", options: ["¼", "½", "1", "2"] },
  { q: "Two half notes last how many beats?", a: "4", options: ["2", "3", "4", "6"] },
  { q: "A dotted quarter note lasts?", a: "1½", options: ["1", "1½", "2", "3"] },
  { q: "How many beats is a half rest?", a: "2", options: ["1", "2", "3", "4"] },
  { q: "Four eighth notes last how many beats?", a: "2", options: ["1", "2", "3", "4"] },
  { q: "How many sixteenth notes fill one beat?", a: "4", options: ["2", "3", "4", "8"] },
];

// ---------- familiar tunes (for ear training; all within C4–C5) ----------
export interface Tune {
  name: string;
  notes: string[];
}
export const TUNES: Tune[] = [
  { name: "Twinkle Twinkle", notes: ["C4", "C4", "G4", "G4", "A4", "A4", "G4", "F4", "F4", "E4", "E4", "D4", "D4", "C4"] },
  { name: "Mary Had a Little Lamb", notes: ["E4", "D4", "C4", "D4", "E4", "E4", "E4", "D4", "D4", "D4", "E4", "G4", "G4"] },
  { name: "Hot Cross Buns", notes: ["E4", "D4", "C4", "E4", "D4", "C4", "C4", "C4", "D4", "D4", "E4", "D4", "C4"] },
  { name: "Ode to Joy", notes: ["E4", "E4", "F4", "G4", "G4", "F4", "E4", "D4", "C4", "C4", "D4", "E4", "E4", "D4", "D4"] },
  { name: "Jingle Bells", notes: ["E4", "E4", "E4", "E4", "E4", "E4", "E4", "G4", "C4", "D4", "E4"] },
  { name: "Frère Jacques", notes: ["C4", "D4", "E4", "C4", "C4", "D4", "E4", "C4", "E4", "F4", "G4"] },
];
