import { OBSERVATIONS } from "../../content/traits/examples";
import { ADAPTATION_PICTURES, CONCEPT_PICTURES, OBSERVATION_PICTURES } from "../../content/traits/pictureMap";
import type { Question } from "./types";

const observations = new Map(OBSERVATIONS.map((item) => [item.example, item.id]));

/** Origins show ALL option subjects, not just the correct answer's animal. */
export function withTraitPictures(question: Question): Question {
  const [prefix, mode, id, otherId] = question.dedupeKey?.split(":") ?? [];
  if (prefix !== "traits") return question;
  let ids: string[];
  if (mode === "origin") {
    ids = question.choices.map((choice) => OBSERVATION_PICTURES[observations.get(choice) ?? ""]);
  } else if (mode === "concept") {
    ids = CONCEPT_PICTURES[id] ?? [];
  } else {
    ids = [ADAPTATION_PICTURES[id]];
    if (mode === "pair") ids.push(ADAPTATION_PICTURES[otherId]);
  }
  if (!ids.length || ids.some((key) => !key)) throw new Error(`Missing subject picture: ${question.dedupeKey}`);
  return { ...question, payload: { ...question.payload, traitPictureIds: [...new Set(ids)] } };
}
