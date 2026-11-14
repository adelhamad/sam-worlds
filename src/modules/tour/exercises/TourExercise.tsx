// World Tour exercise widgets — the dispatcher. The lesson screen imports
// exactly `TourExercise` and `TourTeach` from this file.
import "../../../ui/tour/tour-base.css";
import "./exercises.css";
import { tourPayload } from "../../../engine/tour/types";
import { BuildExercise } from "./BuildExercise";
import type { ExerciseProps } from "./contract";
import { MapExercise } from "./MapExercise";
import { PairsExercise } from "./PairsExercise";
import { PaintExercise } from "./PaintExercise";
import { PickExercise } from "./PickExercise";
import { SortExercise } from "./SortExercise";

export { TourTeach } from "./TourTeach";

/**
 * Renders the right widget for the question's `payload.tour` kind. Each widget
 * is keyed by the question id, so a fresh question always starts from scratch.
 */
export function TourExercise(props: ExerciseProps) {
  const payload = tourPayload(props.question);
  if (!payload) return null;
  const key = props.question.id;
  switch (payload.tour) {
    case "pick":
      return <PickExercise key={key} {...props} payload={payload} />;
    case "pairs":
      return <PairsExercise key={key} {...props} payload={payload} />;
    case "build":
      return <BuildExercise key={key} {...props} payload={payload} />;
    case "map":
      return <MapExercise key={key} {...props} payload={payload} />;
    case "sort":
      return <SortExercise key={key} {...props} payload={payload} />;
    default:
      return <PaintExercise key={key} {...props} payload={payload} />;
  }
}
