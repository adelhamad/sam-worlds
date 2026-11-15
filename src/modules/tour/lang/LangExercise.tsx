// Language widgets — the dispatcher. The course dispatcher
// (exercises/TourExercise.tsx) renders `LangExercise` / `LangTeach` for every
// question with a `lang-*` payload. Widgets never judge: each serialises what
// the child did with engine/lang/answers.ts and the store compares.
import "../../../ui/tour/tour-base.css";
import "../exercises/exercises.css";
import "./lang.css";
import { langPayload } from "../../../engine/lang/types";
import type { ExerciseProps } from "../exercises/contract";
import { LangBuild } from "./LangBuild";
import { LangChoose } from "./LangChoose";
import { LangPairs } from "./LangPairs";
import { LangTrace } from "./LangTrace";

export { LangTeach } from "./LangTeach";

/** Renders the right widget for the question's `payload.tour` kind. */
export function LangExercise(props: ExerciseProps) {
  const payload = langPayload(props.question);
  if (!payload) return null;
  const key = props.question.id;
  switch (payload.tour) {
    case "lang-choose":
      return <LangChoose key={key} {...props} payload={payload} />;
    case "lang-pairs":
      return <LangPairs key={key} {...props} payload={payload} />;
    case "lang-build":
      return <LangBuild key={key} {...props} payload={payload} />;
    default:
      return <LangTrace key={key} {...props} payload={payload} />;
  }
}
