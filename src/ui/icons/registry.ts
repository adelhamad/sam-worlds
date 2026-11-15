// The name → artwork map behind <Icon>, plus the check the audit and the lab
// use. Art lives in data files (art-*.ts) so the audit can load it without React.
import { ICON_NAMES, type IconName } from "../../content/iconNames";
import { CHROME_ART } from "./art-chrome";
import { IDEA_ART } from "./art-ideas";
import { PLACE_ART } from "./art-places";
import { REWARD_ART } from "./art-rewards";
import { SHAPE_ART } from "./art-shapes";
import { THING_ART } from "./art-things";
import { WORLD_LIFE_ART } from "./art-worlds-life";
import { WORLD_MATH_ART } from "./art-worlds-math";
import { WORLD_NATURE_ART } from "./art-worlds-nature";
import type { IconArt } from "./geom";

const ALL: Record<string, IconArt> = {
  ...REWARD_ART,
  ...CHROME_ART,
  ...IDEA_ART,
  ...THING_ART,
  ...PLACE_ART,
  ...SHAPE_ART,
  ...WORLD_MATH_ART,
  ...WORLD_NATURE_ART,
  ...WORLD_LIFE_ART,
};

export function iconArt(name: IconName): IconArt | undefined {
  return ALL[name];
}

/** Names in ICON_NAMES that have no drawing yet (must be empty). */
export function missingIconArt(): string[] {
  return ICON_NAMES.filter((name) => !ALL[name]?.length);
}

/** Drawings with no name in ICON_NAMES (dead art — should be empty too). */
export function strayIconArt(): string[] {
  const names = new Set<string>(ICON_NAMES);
  return Object.keys(ALL).filter((name) => !names.has(name));
}
