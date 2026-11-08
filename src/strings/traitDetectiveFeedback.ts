export const DETECTIVE_FEEDBACK = {
  correct: "You found the evidence!",
  look: "Let’s look at the clues",
  readClues: "Here is how the clues fit.",
  listen: "Read the clues to me",
  next: "Next case",
  finish: "See my stars",
  youPlaced: (place: string) => `You placed this in: ${place}.`,
  supported: "These clues support:",
  both: "Trait AND adaptation — the same feature!",
  traitSupported: "Trait. We need more clues for adaptation.",
} as const;
