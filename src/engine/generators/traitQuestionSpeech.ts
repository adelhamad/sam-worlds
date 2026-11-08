import { traitQuestionLabel } from "./traitQuestionLabel";
import type { Question } from "./types";

export function traitQuestionSpeech(question: Question): string {
  const speech = typeof question.payload?.speechText === "string" ? question.payload.speechText : question.prompt;
  const label = traitQuestionLabel(question);
  return label ? `${label.title}. ${label.explanation} ${speech}` : speech;
}
