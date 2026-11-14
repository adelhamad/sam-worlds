// Course lessons (World Tour, Chess Camp) are ordinary stages of their world,
// but they use the path and lesson screens. These wrappers keep every existing
// link working (/world/tour, /play/chess-…) by forwarding to the course routes.
import { Navigate, useParams } from "react-router-dom";
import { courseOfStage, courseOfWorld, stageRoute, worldRoute } from "../../content/courses";
import { PlayStage } from "../play/PlayStage";
import { WorldMap } from "../play/WorldMap";

export function WorldRoute() {
  const { worldId = "" } = useParams();
  return courseOfWorld(worldId) ? <Navigate to={worldRoute(worldId)} replace /> : <WorldMap />;
}

export function PlayRoute() {
  const { stageId = "" } = useParams();
  return courseOfStage(stageId) ? <Navigate to={stageRoute(stageId)} replace /> : <PlayStage />;
}
