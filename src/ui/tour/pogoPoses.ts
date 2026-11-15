// Pogo's moods as data: which eyes, mouth, brows, antenna and props each one
// draws. The drawing lives in PogoArt.tsx / PogoFace.tsx / PogoProps.tsx, the
// motion in pogo.css and pogo-moods.css.

export type PogoMood =
  | "idle" // breathing, blinking, antenna sway
  | "happy" // quick joyful hop (correct answer)
  | "cheer" // big celebration loop (lesson complete, combo)
  | "think" // curious head tilt (looking at the worked answer)
  | "wave" // greeting (hub banner, path)
  | "talk" // mouth moving while a speech bubble shows
  | "wow" // amazed (chest opens, new stamp)
  | "sleep" // dozing (locked / resting states)
  | "sad" // a miss: droopy, one tear — soft and short, then back to curious
  | "dizzy" // spiral eyes, stars circling (after a bump)
  | "zoom" // flying on the jet boots, arms forward
  | "splat" // squashed flat against the screen glass
  | "starry"; // star-struck (Perfect Run)

export type Eyes = "open" | "arc" | "shut" | "squeeze" | "dizzy" | "star";
export type MouthKind = "smile" | "open" | "o" | "hmm" | "talk" | "snooze" | "frown" | "grin" | "oof" | "wavy";
export type AntennaKind = "curve" | "straight" | "curl" | "droop";
export type BrowKind = "soft" | "ask" | "sad" | "high" | "bold";

export interface Pose {
  eyes: Eyes;
  mouth: MouthKind;
  antenna: AntennaKind;
  brows?: BrowKind;
  sparkles?: boolean;
  party?: boolean;
  zzz?: boolean;
  /** A tear on the left cheek and a watery shine in the eyes. */
  tear?: boolean;
  /** Little stars circling the head. */
  orbit?: boolean;
  /** Jet-boot flames. */
  flames?: boolean;
}

export const POSES: Record<PogoMood, Pose> = {
  idle: { eyes: "open", mouth: "smile", antenna: "curve", brows: "soft" },
  happy: { eyes: "arc", mouth: "open", antenna: "curve", sparkles: true },
  cheer: { eyes: "arc", mouth: "grin", antenna: "curve", sparkles: true, party: true },
  think: { eyes: "open", mouth: "hmm", antenna: "curl", brows: "ask" },
  wave: { eyes: "open", mouth: "open", antenna: "curve", brows: "soft" },
  talk: { eyes: "open", mouth: "talk", antenna: "curve", brows: "soft" },
  wow: { eyes: "open", mouth: "o", antenna: "straight", brows: "high" },
  sleep: { eyes: "shut", mouth: "snooze", antenna: "droop", zzz: true },
  sad: { eyes: "open", mouth: "frown", antenna: "droop", brows: "sad", tear: true },
  dizzy: { eyes: "dizzy", mouth: "wavy", antenna: "curl", orbit: true },
  zoom: { eyes: "open", mouth: "grin", antenna: "droop", brows: "bold", flames: true },
  splat: { eyes: "squeeze", mouth: "oof", antenna: "curl" },
  starry: { eyes: "star", mouth: "grin", antenna: "straight", brows: "high", sparkles: true, party: true },
};

/** Stalk path from the head (120,60) and where its bulb ends up. */
export const ANTENNAS: Record<AntennaKind, { d: string; x: number; y: number }> = {
  curve: { d: "M120 60 C119 45 124 33 135 26", x: 139, y: 23 },
  straight: { d: "M120 60 L120 32", x: 120, y: 21 },
  curl: { d: "M120 60 L120 52 C120 41 138 41 138 28 C138 15 121 10 112 19", x: 108, y: 23 },
  droop: { d: "M120 60 C120 42 99 37 85 49", x: 81, y: 53 },
};

export const INK = "#24104f";
export const MOUTH = "#3d1463";
export const TONGUE = "#ff7fa8";
export const LIMB_LINE = "#5b3fd6";
export const STAR_D = "M0 -8 Q1.2 -1.2 8 0 Q1.2 1.2 0 8 Q-1.2 1.2 -8 0 Q-1.2 -1.2 0 -8 Z";
export const EYE_Y = 110;
export const OPEN_MOUTH_D = "M102 139 Q120 135 138 139 Q138 165 120 165 Q102 165 102 139 Z";
export const GRIN_MOUTH_D = "M96 137 Q120 131 144 137 Q144 169 120 169 Q96 169 96 137 Z";
export const BODY_D = "M120 56 C162 56 188 92 192 140 C195 184 170 212 120 212 C70 212 45 184 48 140 C52 92 78 56 120 56 Z";
