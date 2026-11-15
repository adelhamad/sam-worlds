// `/universe` is kept as an address (classic worlds link back to it): it lands
// on the home page, scrolled to the planet grid that now lives there.
import { Navigate } from "react-router-dom";

export function Universe() {
  return <Navigate to="/hub" state={{ worlds: true }} replace />;
}
