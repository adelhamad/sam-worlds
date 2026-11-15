// Tick Tock widgets — the dispatcher. The course dispatcher
// (exercises/TourExercise.tsx) renders these for every tick-* payload. Both
// kinds report a draft (`timeKey`) and the lesson shell's CHECK submits it;
// the store judges with `typed === question.answer`.
import { tickPayload } from "../../../engine/tick/types";
import "../../../ui/tour/tour-base.css";
import type { ExerciseProps } from "../exercises/contract";
import { ReadExercise } from "./ReadExercise";
import { SetExercise } from "./SetExercise";
import "./tick.css";

export { TickTeach } from "./TickTeach";

/** Renders the right clock widget for the question's `payload.tour` kind. */
export function TickExercise(props: ExerciseProps) {
  const payload = tickPayload(props.question);
  if (!payload) return null;
  const key = props.question.id;
  return payload.tour === "tick-read"
    ? <ReadExercise key={key} {...props} payload={payload} />
    : <SetExercise key={key} {...props} payload={payload} />;
}
