// Tour lessons are ordinary stages of the "tour" world, but they use their own
// path and lesson screens. These wrappers keep every existing link working
// (/world/tour, /play/tour-…) by forwarding to the tour routes.
import { Navigate, useParams } from "react-router-dom";
import { TOUR_WORLD_ID, isTourStage, stageRoute, worldRoute } from "../../content/tour/units";
import { PlayStage } from "../play/PlayStage";
import { WorldMap } from "../play/WorldMap";

export function WorldRoute() {
  const { worldId = "" } = useParams();
  return worldId === TOUR_WORLD_ID ? <Navigate to={worldRoute(worldId)} replace /> : <WorldMap />;
}

export function PlayRoute() {
  const { stageId = "" } = useParams();
  return isTourStage(stageId) ? <Navigate to={stageRoute(stageId)} replace /> : <PlayStage />;
}
