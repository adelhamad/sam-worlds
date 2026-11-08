export type DetectiveMode = "notice" | "sort" | "origins" | "compare" | "connect";
export type Collection = "adaptation" | "unknown" | "changed" | "outside";
export interface DetectiveCard {
  id: string;
  title: string;
  photo: string;
  clue: string;
  collection: Collection;
  origin?: "parents" | "practice" | "change";
  explanation: string;
  source: string;
}
export interface HabitatCase {
  id: string;
  subject: string;
  photo: string;
  trait: string;
  scenes: { id: string; place: string; observation: string; helps: boolean }[];
  explanation: string;
  source: string;
}
export interface DetectiveTile {
  id: string;
  title: string;
  photo?: string;
  clue: string;
  explanation?: string;
}
export interface DetectiveZone {
  id: string;
  title: string;
  description: string;
  group?: "traits";
}
export interface DetectiveBoard {
  mode: DetectiveMode;
  title: string;
  instruction: string;
  reminder: string;
  cards: DetectiveTile[];
  zones: DetectiveZone[];
  habitats?: HabitatCase[];
  claim?: { title: string; photo: string; clue: string };
  solution: Record<string, string>;
  explanation: string;
  takeaway?: string;
}
export function detectiveAnswer(placements: Record<string, string>): string {
  return Object.keys(placements).sort().map((id) => `${id}=${placements[id]}`).join("|");
}
