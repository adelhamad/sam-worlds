import { traitQuestionLabel } from "../engine/generators/traitQuestionLabel";
import type { Question } from "../engine/generators/types";
import "./traits.css";

export function TraitQuestionLabel({ question }: { question: Question }) {
  const label = traitQuestionLabel(question);
  if (!label) return null;
  return <div className="trait-question-label">
    <strong>{label.title}</strong>
    <p>{label.explanation}</p>
  </div>;
}
