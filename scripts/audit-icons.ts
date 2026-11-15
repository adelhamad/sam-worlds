// Audit of the drawn icons and of "no emoji in the course experience":
//   1. every name in ICON_NAMES has artwork (and no art is left without a name);
//   2. every `icon:<name>` reachable from COURSES (course, world, milestones,
//      units, souvenirs) resolves, and so does every world in WORLDS (the
//      classic planets too: world icon and every milestone/trophy icon); any
//      other icon value must be a text-style chess glyph (drawn as a ChessPiece
//      by <Glyph>);
//   3. no emoji (\p{Extended_Pictographic}) in the course strings, the course
//      and unit texts, the reminder notifications, or the SOURCE of the screens
//      converted to drawn icons. A chess glyph followed by U+FE0E (text
//      presentation) counts as text. Country flags are regional-indicator
//      pairs, not pictographic, so they pass (another pass replaces them).
// Run from scripts/audit-questions.ts (part of `bun run check`).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { COURSES } from "../src/content/courses";
import { iconNameOf } from "../src/content/iconNames";
import { WORLDS } from "../src/content/worlds";
import { allCheers } from "../src/engine/notify/schedule";
import { CHESS } from "../src/strings/chess";
import { CODE } from "../src/strings/code";
import { HOME } from "../src/strings/home";
import { TICK } from "../src/strings/tick";
import { TOUR } from "../src/strings/tour";
import { pieceOfGlyph } from "../src/ui/icons/glyphText";
import { missingIconArt, strayIconArt } from "../src/ui/icons/registry";

const ROOT = join(import.meta.dir, "..");
const PICTO = /\p{Extended_Pictographic}/u;
/** A chess glyph in text presentation is not an emoji (see header). */
const TEXT_CHESS = /[♔-♟]︎/gu;

/** Source of every screen converted to drawn icons. */
const SOURCES = [
  "src/ui/home", "src/ui/icons", "src/modules/tour/path", "src/modules/tour/lesson",
  "src/modules/tour/TourPath.tsx", "src/modules/tour/TourLesson.tsx", "src/modules/tour/path.css",
  "src/modules/tour/lesson.css", "src/ui/tour/CourseEmblem.tsx", "src/ui/tour/EmblemArt.tsx",
  "src/ui/tour/ParentTour.tsx", "src/ui/TrophyShelf.tsx", "src/ui/DailyGift.tsx", "src/ui/TreasureVault.tsx",
  "src/ui/Workshop.tsx", "src/ui/CouponWallet.tsx", "src/ui/HubWorlds.tsx", "src/modules/play/WorldMap.tsx",
  "src/strings/home.ts", "src/strings/tour.ts", "src/strings/chess.ts", "src/strings/code.ts", "src/strings/tick.ts",
];

function hasEmoji(text: string): boolean {
  return PICTO.test(text.replace(TEXT_CHESS, ""));
}

function files(path: string): string[] {
  const full = join(ROOT, path);
  try {
    if (!statSync(full).isDirectory()) return [full];
  } catch {
    return [];
  }
  return readdirSync(full).flatMap((name) => files(join(path, name)));
}

function scanSources(failures: string[]): number {
  const all = SOURCES.flatMap(files);
  for (const file of all) {
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      if (hasEmoji(line)) failures.push(`emoji in ${relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 90)}`);
    });
  }
  return all.length;
}

const SAMPLE_ARGS: unknown[][] = [[3, 4, 5, 6], ["Sam", "Sam", "Sam"], ["lessons", 2]];

/** Walks a strings object: every string, every function called with sample args. */
function walk(value: unknown, label: string, out: Array<[string, string]>, depth = 0): void {
  if (depth > 8) return;
  if (typeof value === "string") out.push([label, value]);
  else if (typeof value === "function") {
    for (const args of SAMPLE_ARGS) {
      try {
        walk((value as (...a: unknown[]) => unknown)(...args), `${label}()`, out, depth + 1);
      } catch {
        // a sample argument the function cannot take — the source scan still covers it
      }
    }
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) walk(child, `${label}.${key}`, out, depth + 1);
  }
}

function checkIcon(value: string, label: string, failures: string[]): void {
  if (value.startsWith("icon:")) {
    if (!iconNameOf(value)) failures.push(`${label}: unknown icon "${value}"`);
  } else if (!pieceOfGlyph(value)) {
    failures.push(`${label}: "${value}" is not a drawn icon (use iconRef(...))`);
  }
}

function checkCourses(failures: string[], texts: Array<[string, string]>): number {
  let icons = 0;
  for (const course of COURSES) {
    const at = `course ${course.id}`;
    const values: Array<[string, string]> = [[`${at}.icon`, course.icon], [`${at}.world.icon`, course.world.icon]];
    course.world.milestones.forEach((m, i) => values.push([`${at}.milestone[${i}].icon`, m.icon]));
    texts.push([`${at}.title`, course.title], [`${at}.tagline`, course.tagline], [`${at}.world.tagline`, course.world.tagline]);
    for (const unit of course.units) {
      values.push([`${unit.id}.icon`, unit.icon], [`${unit.id}.souvenir.icon`, unit.souvenir.icon]);
      texts.push([`${unit.id}.name`, unit.name], [`${unit.id}.blurb`, unit.blurb], [`${unit.id}.souvenir.name`, unit.souvenir.name]);
    }
    course.world.milestones.forEach((m, i) => texts.push([`${at}.milestone[${i}].name`, m.name]));
    for (const [label, value] of values) checkIcon(value, label, failures);
    icons += values.length;
  }
  return icons;
}

/** Every world (classic planets and course worlds): its icon and its trophies. */
function checkWorlds(failures: string[]): number {
  let icons = 0;
  for (const world of WORLDS) {
    checkIcon(world.icon, `world ${world.id}.icon`, failures);
    world.milestones.forEach((m, i) => checkIcon(m.icon, `world ${world.id}.milestone[${i}].icon`, failures));
    icons += 1 + world.milestones.length;
  }
  return icons;
}

export function auditIcons(): string[] {
  const failures: string[] = [];
  missingIconArt().forEach((name) => failures.push(`icon "${name}" has no artwork`));
  strayIconArt().forEach((name) => failures.push(`artwork "${name}" has no name in ICON_NAMES`));

  const texts: Array<[string, string]> = [];
  const icons = checkCourses(failures, texts);
  const worldIcons = checkWorlds(failures);
  walk({ HOME, TOUR, CHESS, CODE, TICK }, "strings", texts);
  allCheers("Lesson").forEach((cheer, i) => texts.push([`cheer[${i}].title`, cheer.title], [`cheer[${i}].body`, cheer.body]));
  for (const [label, text] of texts) if (hasEmoji(text)) failures.push(`emoji in ${label}: "${text}"`);

  const scanned = scanSources(failures);
  if (failures.length) console.error(`Icon audit: ${failures.length} failures (drawn icons, course icons, no-emoji scan)`);
  else console.log(`Icon audit passed: ${icons} course icons and ${worldIcons} world icons resolve, ${texts.length} texts and ${scanned} files emoji-free`);
  return failures;
}

// `bun scripts/audit-icons.ts` runs this audit alone.
if (import.meta.main) {
  const failures = auditIcons();
  failures.forEach((failure) => console.error(`  ${failure}`));
  if (failures.length) process.exit(1);
}
