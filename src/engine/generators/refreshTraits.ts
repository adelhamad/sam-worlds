import { mulberry32 } from "../rng";
import { generateTraits, TRAITS_COPY_VERSION } from "./traits";
import type { Question } from "./types";

const REFRESH_SEED = 20261108;
const ARROW = " → ";

export function traitsCopySeed(token: string): number {
  let seed = REFRESH_SEED;
  for (const char of token) seed = Math.imul(seed, 31) ^ char.charCodeAt(0);
  return seed >>> 0;
}

function strings(value: unknown, length: number): value is string[] {
  return Array.isArray(value) && value.length === length &&
    value.every((item) => typeof item === "string" && item.trim().length > 0) &&
    new Set(value).size === length;
}

function savedToken(question: Question): string | null {
  const key = question.dedupeKey;
  if (typeof key !== "string") return null;
  const [prefix, mode, id, otherId, extra] = key.split(":");
  if (prefix !== "traits" || !id || extra !== undefined) return null;
  if (mode === "pair") return otherId && id !== otherId ? key.slice(7) : null;
  return ["spot", "origin", "concept", "job", "feature"].includes(mode) && otherId === undefined
    ? key.slice(7) : null;
}

function refreshedChoices(old: Question, fresh: Question): string[] | null {
  const count = old.choices?.length;
  if (old.inputMode !== "choices" || fresh.inputMode !== "choices" ||
      ![2, 3].includes(count) || !strings(old.choices, count) || !strings(fresh.choices, count)) return null;
  const answerIndex = old.choices.indexOf(old.answer);
  if (answerIndex < 0 || !fresh.choices.includes(fresh.answer)) return null;
  const distractors = fresh.choices.filter((choice) => choice !== fresh.answer);
  let nextDistractor = 0;
  return old.choices.map((_, index) => index === answerIndex ? fresh.answer : distractors[nextDistractor++]);
}

function refreshedItems(old: Question, fresh: Question): string[] | null {
  if (old.inputMode !== "order" || fresh.inputMode !== "order" ||
      old.choices?.length !== 0 || fresh.choices.length !== 0) return null;
  const oldRoles = old.answer.split(ARROW);
  const newRoles = fresh.answer.split(ARROW);
  const items = old.payload?.items;
  if (!strings(oldRoles, 4) || !strings(newRoles, 4) || !strings(items, 4) ||
      !items.every((item) => oldRoles.includes(item))) return null;
  return items.map((item) => newRoles[oldRoles.indexOf(item)]);
}

/** Update saved copy without redrawing its subject, answer slot, or card roles. */
export function refreshTraitsQuestion(question: Question): Question {
  if (question.payload?.traitsCopyVersion === TRAITS_COPY_VERSION) return question;
  const token = savedToken(question);
  if (!token || typeof question.answer !== "string") return question;
  try {
    const fresh = generateTraits({ items: [token] }, mulberry32(traitsCopySeed(token)), {
      difficulty: 0.5, easier: question.choices?.length === 2,
    });
    if (fresh.dedupeKey !== question.dedupeKey || fresh.inputMode !== question.inputMode) return question;
    const pair = token.startsWith("pair:");
    const cards = pair ? refreshedItems(question, fresh) : refreshedChoices(question, fresh);
    if (!cards) return question;
    const payload: Record<string, unknown> = { ...question.payload, ...fresh.payload, ...(pair ? { items: cards } : {}) };
    for (const field of ["listRows", "traitOrganisms", "items"]) {
      if (!Object.hasOwn(fresh.payload ?? {}, field)) delete payload[field];
    }
    const notes = Array.isArray(payload.listRows) ? payload.listRows : [];
    payload.speechText = [fresh.prompt, ...notes, ...cards].join(". ");
    return {
      ...question,
      prompt: fresh.prompt,
      answer: fresh.answer,
      choices: pair ? [] : cards,
      hint: fresh.hint,
      payload,
    };
  } catch {
    // An obsolete token or incomplete save must never prevent resuming a stage.
    return question;
  }
}
