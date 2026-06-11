import type { Question } from "../../engine/generators/types";

interface Props {
  question: Question;
  disabled: boolean;
  onSubmit: (value: string) => void;
}

/** True matching questions only (anti-guessing rule 2) — one tap submits,
 * and a wrong tap regenerates the whole question (rule 1). */
export function ChoiceButtons({ question, disabled, onSubmit }: Props) {
  const big = Boolean(question.payload?.bigChoices);
  return (
    <div className="choices">
      {question.choices.map((c) => (
        <button key={c} className={`btn choice ${big ? "choice-big" : ""}`} disabled={disabled} onClick={() => onSubmit(c)}>
          {c}
        </button>
      ))}
    </div>
  );
}
