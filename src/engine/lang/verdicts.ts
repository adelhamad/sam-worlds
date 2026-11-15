// Verdicts of the language widgets that are judged on more than one string:
// a chat reply (several replies can be right) and a memory game (all pairs
// within the turns). Pure: the widget passes what the child did and submits
// what comes back; the store compares it with `question.answer`.
import { FOUND, SAID, type ChatPayload, type MemoryPayload } from "./types";

/** SAID when the tiles the child placed spell a reply the scene accepts. */
export function chatVerdict(payload: Pick<ChatPayload, "accept">, placed: string[]): string {
  const same = (reply: string[]) => reply.length === placed.length && reply.every((text, i) => text === placed[i]);
  return payload.accept.some(same) ? SAID : `miss:${placed.join(" ")}`;
}

/** Pairs in a memory game. */
export function memoryPairs(payload: Pick<MemoryPayload, "cards">): number {
  return new Set(payload.cards.map((card) => card.pair)).size;
}

/** FOUND when every pair was found within the turns the game allows. */
export function memoryVerdict(payload: Pick<MemoryPayload, "cards" | "turns">, found: number, turnsUsed: number): string {
  return found >= memoryPairs(payload) && turnsUsed <= payload.turns ? FOUND : `miss:${found}/${turnsUsed}`;
}
