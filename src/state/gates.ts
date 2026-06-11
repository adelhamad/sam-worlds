import { WORLDS } from "../content/worlds";
import { MINIGAMES } from "../content/minigames";

/** Default: only the first two worlds are open until the parent enables more. */
export function withWorldDefaults(stored?: Record<string, boolean>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  WORLDS.forEach((w, i) => {
    out[w.id] = stored?.[w.id] ?? i < 2;
  });
  return out;
}

/** Default: all minigames locked until the parent enables them. */
export function withGameDefaults(stored?: Record<string, boolean>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const g of MINIGAMES) out[g.id] = stored?.[g.id] ?? false;
  return out;
}
