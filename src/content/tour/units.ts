// World Tour curriculum — units and lessons are DATA. Each unit teaches twelve
// countries: three "meet" lessons of four new countries, a mix-up lesson and a
// champion lesson, then a treasure chest. Earlier countries keep coming back
// as review (spaced repetition). Stage ids are permanent — saves reference
// them — so only ever APPEND units or lessons.
import type { CourseUnit } from "../courseTypes";
import type { StageDef } from "../types";
import type { WorldDef } from "../worldList";
import type { TourKind, TourParams } from "../../engine/tour/types";

export const TOUR_WORLD_ID = "tour";

export interface TourUnit extends CourseUnit {
  /** Twelve country codes in teaching order (4 + 4 + 4). */
  countries: string[];
}

interface UnitSeed {
  name: string;
  icon: string;
  hue: string;
  blurb: string;
  groups: [string[], string[], string[]];
  souvenir: { icon: string; name: string };
}

const SEEDS: UnitSeed[] = [
  {
    name: "World Stars", icon: "🌟", hue: "#ffd166", blurb: "Famous flags everyone knows!",
    groups: [["JPN", "USA", "BRA", "FRA"], ["EGY", "SAU", "CAN", "AUS"], ["CHN", "IND", "GBR", "ITA"]],
    souvenir: { icon: "🌐", name: "Crystal Globe" },
  },
  {
    name: "Europe Hop", icon: "🏰", hue: "#6ea8ff", blurb: "Castles, mountains and stripes!",
    groups: [["DEU", "ESP", "PRT", "IRL"], ["GRC", "SWE", "NOR", "CHE"], ["POL", "UKR", "AUT", "BEL"]],
    souvenir: { icon: "🗝️", name: "Castle Key" },
  },
  {
    name: "Desert Lands", icon: "🐪", hue: "#ff8f6b", blurb: "Golden sand and green stars!",
    groups: [["ARE", "QAT", "KWT", "JOR"], ["IRQ", "SYR", "LBN", "OMN"], ["MAR", "DZA", "TUN", "LBY"]],
    souvenir: { icon: "🪔", name: "Desert Lamp" },
  },
  {
    name: "Americas Trip", icon: "🦙", hue: "#5fd68b", blurb: "From jungles to snowy peaks!",
    groups: [["MEX", "ARG", "CHL", "COL"], ["PER", "CUB", "VEN", "JAM"], ["PAN", "CRI", "ECU", "URY"]],
    souvenir: { icon: "🦜", name: "Jungle Parrot" },
  },
  {
    name: "Asia Adventure", icon: "🐉", hue: "#ff7eb6", blurb: "Dragons, temples and tall peaks!",
    groups: [["KOR", "THA", "VNM", "PHL"], ["PAK", "BGD", "NPL", "MNG"], ["KAZ", "IRN", "YEM", "AFG"]],
    souvenir: { icon: "🏮", name: "Red Lantern" },
  },
  {
    name: "Africa Safari", icon: "🦁", hue: "#ff9f43", blurb: "Lions, rivers and bright colors!",
    groups: [["NGA", "KEN", "ETH", "GHA"], ["SEN", "CMR", "MDG", "SDN"], ["UGA", "ZWE", "MLI", "SOM"]],
    souvenir: { icon: "🥁", name: "Safari Drum" },
  },
  {
    name: "North Lights", icon: "❄️", hue: "#8fd3ff", blurb: "Snowy lands and crossed flags!",
    groups: [["DNK", "FIN", "ISL", "EST"], ["HUN", "CZE", "ROU", "BGR"], ["HRV", "SRB", "LTU", "LVA"]],
    souvenir: { icon: "🔮", name: "Snow Crystal" },
  },
  {
    name: "Far Corners", icon: "🧭", hue: "#b794ff", blurb: "Islands and faraway friends!",
    groups: [["NZL", "PNG", "FJI", "KHM"], ["GTM", "HND", "DOM", "PRY"], ["GEO", "ARM", "UZB", "LAO"]],
    souvenir: { icon: "🐚", name: "Sea Shell" },
  },
];

const ALL_KINDS: TourKind[] = ["pick", "pairs", "build", "map", "sort", "paint"];
/** The very first lessons add one new exercise at a time. */
const STARTER_KINDS: TourKind[][] = [
  ["pick", "pairs", "build", "map"],
  ["pick", "pairs", "build", "map", "sort"],
];

const pad = (n: number) => String(n).padStart(2, "0");

function lesson(
  unitIndex: number, slot: number, name: string, params: TourParams, questions: number, bonus: number,
): StageDef {
  return {
    id: `tour-u${pad(unitIndex + 1)}-l${slot}`,
    name,
    generator: "tour",
    params: params as unknown as StageDef["params"],
    questions,
    mechanic: "tour",
    payout: 20 + unitIndex * 2 + bonus,
    skill: "tour",
  };
}

function buildUnit(seed: UnitSeed, unitIndex: number, earlier: string[]): TourUnit {
  const countries = seed.groups.flat();
  const meet = seed.groups.map((focus, groupIndex) => {
    const lessonNumber = unitIndex * 5 + groupIndex;
    const kinds = STARTER_KINDS[lessonNumber] ?? ALL_KINDS;
    const review = [...seed.groups.slice(0, groupIndex).flat(), ...earlier];
    return lesson(unitIndex, groupIndex + 1, `${seed.name} ${groupIndex + 1}`, { focus, review, kinds }, 10, 0);
  });
  const mix = lesson(unitIndex, 4, `${seed.name} Mix-Up`, { focus: countries, review: earlier, kinds: ALL_KINDS }, 12, 6);
  const champion = lesson(
    unitIndex, 5, `${seed.name} Champion`, { focus: countries, review: earlier, kinds: ALL_KINDS }, 12, 10,
  );
  return {
    id: `tour-u${pad(unitIndex + 1)}`,
    name: seed.name,
    icon: seed.icon,
    hue: seed.hue,
    blurb: seed.blurb,
    countries,
    lessons: [...meet, mix, champion],
    chestDust: 40 + unitIndex * 10,
    souvenir: seed.souvenir,
  };
}

export const TOUR_UNITS: TourUnit[] = SEEDS.reduce<TourUnit[]>((units, seed, index) => {
  const earlier = units.flatMap((unit) => unit.countries);
  return [...units, buildUnit(seed, index, earlier)];
}, []);

/** Every country the tour teaches, in teaching order. */
export const TOUR_COUNTRIES: string[] = TOUR_UNITS.flatMap((unit) => unit.countries);

export const TOUR_WORLD: WorldDef = {
  id: TOUR_WORLD_ID,
  name: "World Tour",
  icon: "🛸",
  tagline: "Show Pogo around planet Earth!",
  stages: TOUR_UNITS.flatMap((unit) => unit.lessons),
  // One trophy per finished unit (its Champion lesson).
  milestones: TOUR_UNITS.map((unit, index) => ({
    stage: (index + 1) * 5,
    name: `${unit.name} Guide`,
    icon: unit.icon,
  })),
};

export function tourUnitById(unitId: string): TourUnit | undefined {
  return TOUR_UNITS.find((unit) => unit.id === unitId);
}

export function unitOfStage(stageId: string): TourUnit | undefined {
  return TOUR_UNITS.find((unit) => unit.lessons.some((stage) => stage.id === stageId));
}

export function isTourStage(stageId: string): boolean {
  return stageId.startsWith("tour-u");
}

export function tourParams(stage: StageDef): TourParams {
  return stage.params as unknown as TourParams;
}

export function unitComplete(unit: TourUnit, progress: Record<string, { completed: boolean }>): boolean {
  return unit.lessons.every((stage) => progress[stage.id]?.completed);
}
