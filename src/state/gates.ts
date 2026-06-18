import { WORLDS } from "../content/worlds";

/** Worlds open out of the box: the first two, plus the newest explore-worlds
 * so Sam can dive straight into them. The parent can lock any of these. */
const OPEN_BY_DEFAULT = new Set(["space", "dinos", "weather", "phonics"]);

export function withWorldDefaults(stored?: Record<string, boolean>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  WORLDS.forEach((w, i) => {
    out[w.id] = stored?.[w.id] ?? (i < 2 || OPEN_BY_DEFAULT.has(w.id));
  });
  return out;
}
