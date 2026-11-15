// Checks one planned language question against the contract in
// src/engine/lang/types.ts. Used by audit-lang.ts.
import { buildAnswer, pairsAnswer } from "../src/engine/lang/answers";
import { clashes } from "../src/engine/lang/cards";
import type { Question } from "../src/engine/generators/types";
import { TRACED, type BuildPayload, type ChoosePayload, type LangParams, type LangPayload, type PairsPayload, type Phrase } from "../src/engine/lang/types";

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

export function checkQuestion(where: string, question: Question, payload: LangPayload, params: LangParams): string[] {
  const out: string[] = [];
  if (!question.repeatable || question.inputMode !== "tour") out.push(`${where}: must be a repeatable tour question`);
  if (!question.prompt || question.prompt.trim().split(/\s+/).length > PROMPT_WORDS) out.push(`${where}: prompt "${question.prompt}" is missing or too long`);
  if (!payload.explain || !payload.model?.id) out.push(`${where}: no teach line or model answer`);
  if (payload.lang !== params.lang) out.push(`${where}: wrong language`);
  if (payload.tour === "lang-choose") out.push(...checkChoose(where, question, payload, params));
  else if (payload.tour === "lang-pairs") out.push(...checkPairs(where, question, payload, params));
  else if (payload.tour === "lang-build") out.push(...checkBuild(where, question, payload));
  else if (question.answer !== TRACED || !params.alphabet.some((letter) => letter.id === payload.letter.id)) out.push(`${where}: bad trace question`);
  return out;
}
