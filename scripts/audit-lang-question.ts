// Checks one planned language question against the contract in
// src/engine/lang/types.ts. Used by audit-lang.ts.
import { buildAnswer, pairsAnswer, spotAnswer } from "../src/engine/lang/answers";
import { clashes } from "../src/engine/lang/cards";
import type { Question } from "../src/engine/generators/types";
import {
  FOUND, SAID, TRACED, type BuildPayload, type ChatPayload, type ChoosePayload, type GivePayload, type LangParams, type LangPayload,
  type MemoryPayload, type PairsPayload, type Phrase, type SpotPayload,
} from "../src/engine/lang/types";
import { chatVerdict, memoryPairs } from "../src/engine/lang/verdicts";

const PROMPT_WORDS = 9;

function phraseOf(params: LangParams, id: string): Phrase | undefined {
  return [...params.teach, ...params.review].find((phrase) => phrase.id === id);
}

function checkChoose(where: string, question: Question, payload: ChoosePayload, params: LangParams): string[] {
  const out: string[] = [];
  const ids = payload.options.map((card) => card.id);
  if (ids.length < 3 || ids.length > 4) out.push(`${where}: ${ids.length} options`);
  if (new Set(ids).size !== ids.length) out.push(`${where}: an option appears twice`);
  if (!ids.includes(question.answer)) out.push(`${where}: the answer is not among the options`);
  const faces = payload.options.map((card) => (payload.show === "meaning" ? card.en : card.text).trim().toLowerCase());
  if (new Set(faces).size !== faces.length) out.push(`${where}: two options look the same`);
  if (payload.task === "sound" || payload.task === "find") return out;
  const right = phraseOf(params, question.answer);
  if (!right) return [...out, `${where}: the answer "${question.answer}" is not a phrase of the lesson`];
  const scene = payload.task === "scene" ? params.scenes.find((item) => item.id === payload.target) : undefined;
  const alsoRight = [...(scene?.reply ?? []), ...(scene?.alsoOk ?? []), ...(scene?.line ? [scene.line] : [])];
  for (const id of ids) {
    if (id === question.answer) continue;
    const other = phraseOf(params, id);
    if (!other) out.push(`${where}: option "${id}" is not a phrase the child has met`);
    else if (clashes(right, other)) out.push(`${where}: option "${id}" could also be right (clashes with "${right.id}")`);
    if (alsoRight.includes(id)) out.push(`${where}: option "${id}" is also a fine reply in scene "${scene?.id}"`);
  }
  return out;
}

function checkPairs(where: string, question: Question, payload: PairsPayload, params: LangParams): string[] {
  const out: string[] = [];
  const left = payload.left.map((card) => card.id);
  if (left.length < 3 || left.length > 4) out.push(`${where}: ${left.length} pairs`);
  if ([...left].sort().join() !== payload.right.map((card) => card.id).sort().join()) out.push(`${where}: sides do not match`);
  if (question.answer !== pairsAnswer(left)) out.push(`${where}: answer is not pairsAnswer`);
  const phrases = left.map((id) => phraseOf(params, id));
  phrases.forEach((a, i) => phrases.slice(i + 1).forEach((b) => {
    if (a && b && clashes(a, b)) out.push(`${where}: "${a.id}" and "${b.id}" could be matched either way`);
  }));
  return out;
}

function checkBuild(where: string, question: Question, payload: BuildPayload): string[] {
  const out: string[] = [];
  const texts = payload.tiles.map((tile) => tile.text);
  const answer = payload.unit === "word" ? question.answer.split(" ") : Array.from(question.answer);
  const left = [...texts];
  for (const part of answer) {
    const at = left.indexOf(part);
    if (at < 0) { out.push(`${where}: tile "${part}" is missing`); break; }
    left.splice(at, 1);
  }
  if (answer.length < 2) out.push(`${where}: nothing to build`);
  if (left.length > 2) out.push(`${where}: ${left.length} decoy tiles`);
  if (buildAnswer(answer, payload.unit) !== question.answer) out.push(`${where}: answer does not round-trip`);
  if (payload.tiles.length > 9) out.push(`${where}: ${payload.tiles.length} tiles is too many for a phone`);
  return out;
}

/** Every tile of `reply` can be taken from the bank (each used once). */
function spellable(reply: string[], tiles: string[]): boolean {
  const left = [...tiles];
  return reply.every((part) => {
    const at = left.indexOf(part);
    if (at < 0) return false;
    left.splice(at, 1);
    return true;
  });
}

function checkChat(where: string, question: Question, payload: ChatPayload, params: LangParams): string[] {
  const out: string[] = [];
  const tiles = payload.tiles.map((tile) => tile.text);
  const scene = params.scenes.find((item) => item.id === payload.target);
  if (question.answer !== SAID) out.push(`${where}: answer is not SAID`);
  if (!scene) return [...out, `${where}: scene "${payload.target}" is not in the lesson`];
  if (tiles.length < 3 || tiles.length > 8) out.push(`${where}: ${tiles.length} tiles in the word bank`);
  if (!payload.accept.length) out.push(`${where}: nothing is accepted`);
  for (const reply of payload.accept) if (!spellable(reply, tiles)) out.push(`${where}: accepted reply "${reply.join(" ")}" cannot be built from the bank`);
  if (chatVerdict(payload, payload.accept[0] ?? []) !== SAID) out.push(`${where}: the model reply is not accepted`);
  // Every accepted reply must be a phrase the scene really allows (or a like-twin of one).
  const fine = [...scene.reply, ...(scene.alsoOk ?? [])].map((id) => phraseOf(params, id)).filter((phrase): phrase is Phrase => Boolean(phrase));
  const pool = [...params.teach, ...params.review];
  const norm = (text: string) => text.toLowerCase().replace(/[.!?؟,،]/g, "").trim();
  for (const reply of payload.accept) {
    const built = reply.join(" ");
    const phrase = pool.find((item) => norm((item.words ?? [{ text: item.text }]).map((word) => word.text).join(" ")) === norm(built));
    if (!phrase) out.push(`${where}: accepted reply "${built}" is not a phrase the child has met`);
    else if (!fine.some((item) => item.id === phrase.id || clashes(item, phrase))) out.push(`${where}: accepted reply "${phrase.id}" is not allowed by the scene`);
  }
  return out;
}

function checkGive(where: string, question: Question, payload: GivePayload, params: LangParams): string[] {
  const out: string[] = [];
  const ids = payload.items.map((card) => card.id);
  const arts = payload.items.map((card) => card.art);
  if (ids.length < 3 || ids.length > 4) out.push(`${where}: ${ids.length} things on the table`);
  if (new Set(ids).size !== ids.length || new Set(arts).size !== arts.length) out.push(`${where}: two things look the same`);
  if (arts.some((art) => !art)) out.push(`${where}: a thing has no picture`);
  if (!ids.includes(question.answer) || payload.ask.id !== question.answer) out.push(`${where}: Pogo does not ask for one of the things`);
  const right = phraseOf(params, question.answer);
  for (const id of ids) {
    const other = phraseOf(params, id);
    if (id !== question.answer && right && other && clashes(right, other)) out.push(`${where}: "${id}" could also be what Pogo asks for`);
  }
  return out;
}

function checkSpot(where: string, question: Question, payload: SpotPayload): string[] {
  const out: string[] = [];
  const texts = payload.words.map((word) => word.text.toLowerCase());
  if (texts.length < 3) out.push(`${where}: a sentence of ${texts.length} words`);
  if (new Set(texts).size !== texts.length) out.push(`${where}: a word appears twice`);
  if (!payload.words[payload.heard] || question.answer !== spotAnswer(payload.heard)) out.push(`${where}: the heard word is not in the sentence`);
  return out;
}

function checkMemory(where: string, question: Question, payload: MemoryPayload, params: LangParams): string[] {
  const out: string[] = [];
  const pairs = memoryPairs(payload);
  if (question.answer !== FOUND) out.push(`${where}: answer is not FOUND`);
  if (pairs < 3 || pairs > 4 || payload.cards.length !== pairs * 2) out.push(`${where}: ${payload.cards.length} cards for ${pairs} pairs`);
  if (payload.turns < pairs * 2) out.push(`${where}: only ${payload.turns} turns for ${pairs} pairs`);
  const phrases = [...new Set(payload.cards.map((card) => card.pair))].map((id) => phraseOf(params, id));
  phrases.forEach((a, i) => phrases.slice(i + 1).forEach((b) => {
    if (a && b && clashes(a, b)) out.push(`${where}: "${a.id}" and "${b.id}" could be paired either way`);
  }));
  return out;
}

function checkKind(where: string, question: Question, payload: LangPayload, params: LangParams): string[] {
  switch (payload.tour) {
    case "lang-choose": return checkChoose(where, question, payload, params);
    case "lang-pairs": return checkPairs(where, question, payload, params);
    case "lang-build": return checkBuild(where, question, payload);
    case "lang-chat": return checkChat(where, question, payload, params);
    case "lang-give": return checkGive(where, question, payload, params);
    case "lang-spot": return checkSpot(where, question, payload);
    case "lang-memory": return checkMemory(where, question, payload, params);
    default:
      return question.answer !== TRACED || !params.alphabet.some((letter) => letter.id === payload.letter.id) ? [`${where}: bad trace question`] : [];
  }
}

export function checkQuestion(where: string, question: Question, payload: LangPayload, params: LangParams): string[] {
  const out: string[] = [];
  if (!question.repeatable || question.inputMode !== "tour") out.push(`${where}: must be a repeatable tour question`);
  if (!question.prompt || question.prompt.trim().split(/\s+/).length > PROMPT_WORDS) out.push(`${where}: prompt "${question.prompt}" is missing or too long`);
  if (!payload.explain || !payload.model?.id) out.push(`${where}: no teach line or model answer`);
  if (payload.lang !== params.lang) out.push(`${where}: wrong language`);
  out.push(...checkKind(where, question, payload, params));
  return out;
}
