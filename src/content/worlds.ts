import { WORLDS as BASE_WORLDS, type WorldDef } from "./worldList";
import { EXTRA_WORLDS } from "./worldListExtra";
import { EXTRA_WORLDS2 } from "./worldListExtra2";
import type { StageDef } from "./types";

export const WORLDS: WorldDef[] = [...BASE_WORLDS, ...EXTRA_WORLDS, ...EXTRA_WORLDS2];
export type { WorldDef };

export interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  stageId: string;
}

export const BADGES: BadgeDef[] = WORLDS.flatMap((w) =>
  w.milestones.map((m) => ({
    // keep the original NF badge ids stable for existing saves
    id: w.id === "numberforge" ? m.name.toLowerCase().replace(/ /g, "-") : `${w.id}-${m.stage}`,
    name: m.name,
    icon: m.icon,
    stageId: w.stages[m.stage - 1]?.id ?? "",
  })),
);

const stageMap = new Map<string, { stage: StageDef; world: WorldDef; index: number }>();
for (const w of WORLDS) {
  w.stages.forEach((stage, index) => stageMap.set(stage.id, { stage, world: w, index }));
}

export function stageById(id: string): StageDef | undefined {
  return stageMap.get(id)?.stage;
}

export function worldOfStage(id: string): WorldDef | undefined {
  return stageMap.get(id)?.world;
}

export function stageIndexInWorld(id: string): number {
  return stageMap.get(id)?.index ?? -1;
}

export function worldById(id: string): WorldDef | undefined {
  return WORLDS.find((w) => w.id === id);
}

export function completedInWorld(world: WorldDef, progress: Record<string, { completed: boolean }>): number {
  return world.stages.filter((s) => progress[s.id]?.completed).length;
}

/** The world the Mission Board points at: first ENABLED one with stages left. */
export function focusWorldIn(worlds: WorldDef[], progress: Record<string, { completed: boolean }>): WorldDef | undefined {
  return worlds.find((w) => completedInWorld(w, progress) < w.stages.length) ?? worlds[0];
}

export function nextStageIn(world: WorldDef, progress: Record<string, { completed: boolean }>): StageDef {
  return world.stages.find((s) => !progress[s.id]?.completed) ?? world.stages[world.stages.length - 1];
}
