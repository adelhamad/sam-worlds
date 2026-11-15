// World Tour exercise widgets — the dispatcher. The lesson screen imports
// exactly `TourExercise` and `TourTeach` from this file.
import "../../../ui/tour/tour-base.css";
import "./exercises.css";
import { chessPayload } from "../../../engine/chess/types";
import { codePayload } from "../../../engine/code/types";
import { kitPayload } from "../../../engine/kit/types";
import { tickPayload } from "../../../engine/tick/types";
import { tourPayload } from "../../../engine/tour/types";
import { ChessExercise, ChessTeach } from "../chess/ChessExercise";
import { CodeExercise, CodeTeach } from "../code/CodeExercise";
import { KitExercise, KitTeach } from "../kit/KitExercise";
import { TickExercise, TickTeach } from "../tick/TickExercise";
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
  if (kitPayload(props.question)) return <KitTeach {...props} />;
  if (codePayload(props.question)) return <CodeTeach {...props} />;
  if (tickPayload(props.question)) return <TickTeach {...props} />;
  return chessPayload(props.question) ? <ChessTeach {...props} /> : <WorldTeach {...props} />;
}

/**
 * Renders the right widget for the question's `payload.tour` kind. Each widget
 * is keyed by the question id, so a fresh question always starts from scratch.
 */
export function TourExercise(props: ExerciseProps) {
  // One family per payload prefix: kit-* (Course Kit), code-*, tick-*, chess-*, else geography.
  if (kitPayload(props.question)) return <KitExercise key={props.question.id} {...props} />;
  if (codePayload(props.question)) return <CodeExercise key={props.question.id} {...props} />;
  if (tickPayload(props.question)) return <TickExercise key={props.question.id} {...props} />;
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
