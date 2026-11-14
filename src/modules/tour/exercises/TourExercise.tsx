// World Tour exercise widgets — the dispatcher. The lesson screen imports
// exactly `TourExercise` and `TourTeach` from this file.
import "../../../ui/tour/tour-base.css";
import "./exercises.css";
import { chessPayload } from "../../../engine/chess/types";
import { tourPayload } from "../../../engine/tour/types";
import { ChessExercise, ChessTeach } from "../chess/ChessExercise";
import { BuildExercise } from "./BuildExercise";
import type { ExerciseProps, TeachProps } from "./contract";
import { MapExercise } from "./MapExercise";
import { PairsExercise } from "./PairsExercise";
import { PaintExercise } from "./PaintExercise";
import { PickExercise } from "./PickExercise";
import { SortExercise } from "./SortExercise";

import { TourTeach as WorldTeach } from "./TourTeach";

/** The solved view for the "Almost — look at this." sheet, for any course. */
export function TourTeach(props: TeachProps) {
  return chessPayload(props.question) ? <ChessTeach {...props} /> : <WorldTeach {...props} />;
}

/**
 * Renders the right widget for the question's `payload.tour` kind. Each widget
 * is keyed by the question id, so a fresh question always starts from scratch.
 */
export function TourExercise(props: ExerciseProps) {
  if (chessPayload(props.question)) return <ChessExercise key={props.question.id} {...props} />;
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
