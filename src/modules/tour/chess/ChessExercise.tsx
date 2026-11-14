// Chess Camp widgets — the dispatcher. The course dispatcher
// (exercises/TourExercise.tsx) imports exactly `ChessExercise` and `ChessTeach`
// from this file.
import "../../../ui/tour/tour-base.css";
import "./chess.css";
import { chessPayload } from "../../../engine/chess/types";
import type { ExerciseProps } from "../exercises/contract";
import { CountExercise } from "./CountExercise";
import { MissionExercise } from "./MissionExercise";
import { PlaceExercise } from "./PlaceExercise";
import { SpotExercise } from "./SpotExercise";

export { ChessTeach } from "./ChessTeach";

/**
 * Renders the right chess widget for the question's `payload.tour` kind. Each
 * widget is keyed by the question id, so a fresh puzzle always starts clean.
 */
export function ChessExercise(props: ExerciseProps) {
  const payload = chessPayload(props.question);
  if (!payload) return null;
  const key = props.question.id;
  switch (payload.tour) {
    case "chess-spot":
      return <SpotExercise key={key} {...props} payload={payload} />;
    case "chess-mission":
      return <MissionExercise key={key} {...props} payload={payload} />;
    case "chess-count":
      return <CountExercise key={key} {...props} payload={payload} />;
    default:
      return <PlaceExercise key={key} {...props} payload={payload} />;
  }
}
