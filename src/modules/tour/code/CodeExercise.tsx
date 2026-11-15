// Code Lab widgets — the dispatcher. The course dispatcher
// (exercises/TourExercise.tsx) renders these for every code-* payload.
import { codePayload } from "../../../engine/code/types";
import type { ExerciseProps } from "../exercises/contract";
import { DebugExercise } from "./DebugExercise";
import { RunExercise } from "./RunExercise";
import { TraceExercise } from "./TraceExercise";

export { CodeTeach } from "./CodeTeach";

/** Renders the right coding widget for the question's `payload.tour` kind. */
export function CodeExercise(props: ExerciseProps) {
  const payload = codePayload(props.question);
  if (!payload) return null;
  const key = props.question.id;
  switch (payload.tour) {
    case "code-run":
      return <RunExercise key={key} {...props} payload={payload} />;
    case "code-debug":
      return <DebugExercise key={key} {...props} payload={payload} />;
    default:
      return <TraceExercise key={key} {...props} payload={payload} />;
  }
}
