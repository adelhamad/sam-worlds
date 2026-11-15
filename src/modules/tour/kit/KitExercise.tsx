// Course Kit widgets — the dispatcher. The course dispatcher
// (exercises/TourExercise.tsx) renders `KitExercise` / `KitTeach` for every
// question with a `kit-*` payload. Widgets never judge: each serialises what
// the child built with engine/kit/answers.ts and the store compares.
import "../../../ui/tour/tour-base.css";
import "../exercises/exercises.css";
import "./kit.css";
import { kitPayload } from "../../../engine/kit/types";
import type { ExerciseProps } from "../exercises/contract";
import { KitBuild } from "./KitBuild";
import { KitNumber } from "./KitNumber";
import { KitOrder } from "./KitOrder";
import { KitPairs } from "./KitPairs";
import { KitPick } from "./KitPick";
import { KitSort } from "./KitSort";

export { KitTeach } from "./KitTeach";

/** Renders the right kit widget for the question's `payload.tour` kind. */
export function KitExercise(props: ExerciseProps) {
  const payload = kitPayload(props.question);
  if (!payload) return null;
  const key = props.question.id;
  switch (payload.tour) {
    case "kit-pick":
      return <KitPick key={key} {...props} payload={payload} />;
    case "kit-pairs":
      return <KitPairs key={key} {...props} payload={payload} />;
    case "kit-order":
      return <KitOrder key={key} {...props} payload={payload} />;
    case "kit-sort":
      return <KitSort key={key} {...props} payload={payload} />;
    case "kit-build":
      return <KitBuild key={key} {...props} payload={payload} />;
    case "kit-number":
      return <KitNumber key={key} {...props} payload={payload} />;
    default:
      return null;
  }
}
