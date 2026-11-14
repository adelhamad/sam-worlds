// Per-question invariants for World Tour exercises (used by audit-tour.ts).
import { COUNTRY_BY_CODE } from "../src/engine/generators/geography";
import type { Question } from "../src/engine/generators/types";
import { lettersOf, pairsAnswer, paintAnswer, sortAnswer } from "../src/engine/tour/answers";
import { PAINT_COLOR_BY_ID, PAINT_FLAGS, paintWeights } from "../src/engine/tour/paintFlags";
import { TOUR_ANCHORS, TOUR_KINDS } from "../src/engine/tour/pool";
import type {
  BuildPayload, MapPayload, PairsPayload, PaintPayload, PickPayload, SortPayload, TourParams, TourPayload,
} from "../src/engine/tour/types";
import { tourPayload } from "../src/engine/tour/types";

type Report = (message: string) => void;

const unique = (list: string[]) => new Set(list).size === list.length;
const nameOf = (code: string) => COUNTRY_BY_CODE.get(code)?.name ?? "";
const continentOf = (code: string) => COUNTRY_BY_CODE.get(code)?.continent ?? "";
const sorted = (list: string[]) => [...list].sort().join("+");

function checkPick(q: Question, p: PickPayload, report: Report): void {
  if (!unique(p.options) || !p.options.includes(p.code)) report("pick options must be unique and hold the answer");
  if (p.options.length < 3 || p.options.length > 4) report(`pick has ${p.options.length} options`);
  if (q.answer !== p.code || p.guessable !== true) report("pick answer / guessable");
  if (p.ask === p.show) report("pick asks and shows the same thing");
  if (p.ask !== "name" && q.hint.includes(nameOf(p.code))) report("pick hint gives the country away");
}

function checkPairs(q: Question, p: PairsPayload, report: Report): void {
  if (!unique(p.left) || !unique(p.right)) report("pairs cards repeat");
  if (p.left.some((code) => !p.right.includes(code))) report("pairs right column misses a left card");
  if (p.left.length < 3 || p.left.length > 5) report(`pairs has ${p.left.length} left cards`);
  if (p.right.length - p.left.length > 1) report("pairs has more than one decoy");
  if (q.answer !== pairsAnswer(p.left) || sorted(p.codes) !== sorted(p.left)) report("pairs answer / codes");
}

/** Can some ordering of a subset of `tiles` spell `target`? */
function spells(target: string, tiles: string[]): boolean {
  if (!target) return true;
  return tiles.some((tile, index) => target.startsWith(tile) &&
    spells(target.slice(tile.length), [...tiles.slice(0, index), ...tiles.slice(index + 1)]));
}

function checkBuild(q: Question, p: BuildPayload, report: Report): void {
  const name = nameOf(p.code);
  if (q.answer !== lettersOf(name)) report("build answer is not the country's letters");
  if (!spells(q.answer, p.tiles)) report(`build tiles cannot spell ${q.answer}`);
  if (p.words.reduce((sum, letters) => sum + letters, 0) !== q.answer.length) report("build words do not add up");
  if (p.words.length > 2 || q.answer.length > 13) report("build name too long");
  if (p.tiles.some((tile) => tile.length < 2 || tile.length > 3 || tile !== tile.toUpperCase())) report("build tile size");
  if (p.tiles.length > 9) report(`build has ${p.tiles.length} tiles`);
  if (p.tiles.join("").length <= q.answer.length) report("build has no decoy tile");
  if (q.hint.includes(name)) report("build hint gives the name away");
}

type Box = [number, number, number, number];
const EPS = 1e-6;
const boxOf = (code: string) => (COUNTRY_BY_CODE.get(code)?.viewBox ?? [0, 0, 0, 0]) as Box;

function checkMapView(p: MapPayload, report: Report): void {
  const [x, y, w, h] = p.view;
  const [bx, by, bw, bh] = boxOf(p.code);
  if (x < -EPS || y < -EPS || x + w > 360 + EPS || y + h > 180 + EPS) report("map view leaves the world");
  if (w < 28 - EPS || w > 100 + EPS || Math.abs(h - w * 0.75) > 0.02) report("map view size");
  if (bx < x - EPS || by < y - EPS || bx + bw > x + w + EPS || by + bh > y + h + EPS) {
    report("map target box is not fully inside the view");
  }
  if (Math.max(bw, bh) < 3.4) report("map target is too small to tap");
}

function checkMapTargets(p: MapPayload, report: Report): void {
  const [x, y, w, h] = p.view;
  if (!p.targets.includes(p.code) || !unique(p.targets)) report("map targets must be unique and hold the answer");
  if (p.targets.length < 3 || p.targets.length > 10) report(`map has ${p.targets.length} targets`);
  if (p.targets.some((code) => !COUNTRY_BY_CODE.has(code))) report("map target does not exist");
  for (const code of p.targets) {
    const [bx, by, bw, bh] = boxOf(code);
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    if (cx < x - EPS || cx > x + w + EPS || cy < y - EPS || cy > y + h + EPS) report(`map target ${code} is outside the view`);
    if (Math.max(bw, bh) < w / 9 - EPS && code !== p.code) report(`map target ${code} is too small to tap`);
  }
}

function checkMap(q: Question, p: MapPayload, report: Report): void {
  if (q.answer !== p.code || p.guessable !== true) report("map answer / guessable");
  checkMapView(p, report);
  checkMapTargets(p, report);
  if (p.ask === "flag" && q.hint.includes(nameOf(p.code))) report("map hint gives the country away");
}

function checkSort(q: Question, p: SortPayload, report: Report): void {
  if (!unique(p.buckets) || p.buckets.length < 2 || p.buckets.length > 3) report("sort buckets");
  if (!unique(p.cards) || p.cards.length < 4 || p.cards.length > 6) report(`sort has ${p.cards.length} cards`);
  if (p.cards.some((code) => !p.buckets.includes(continentOf(code)))) report("sort card has no bucket");
  if (p.buckets.some((bucket) => !p.cards.some((code) => continentOf(code) === bucket))) report("sort bucket is empty");
  const placed = Object.fromEntries(p.cards.map((code) => [code, continentOf(code)]));
  if (q.answer !== sortAnswer(p.buckets, placed) || sorted(p.codes) !== sorted(p.cards)) report("sort answer / codes");
}

function checkPaint(q: Question, p: PaintPayload, report: Report): void {
  const flag = PAINT_FLAGS[p.code];
  if (!flag) {
    report("paint flag is not paintable");
    return;
  }
  if (q.answer !== paintAnswer(flag.colors) || p.dir !== flag.dir) report("paint answer / direction");
  if (flag.colors.some((color) => !p.palette.includes(color))) report("paint palette misses a flag colour");
  if (!unique(p.palette) || p.palette.some((color) => !PAINT_COLOR_BY_ID.has(color))) report("paint palette");
  if (p.palette.length < 5 || p.palette.length > 6) report(`paint palette has ${p.palette.length} colours`);
  if (p.weights.length !== flag.colors.length || p.weights.join() !== paintWeights(flag).join()) report("paint weights");
}

function checkKind(q: Question, p: TourPayload, report: Report): void {
  if (p.tour === "pick") checkPick(q, p, report);
  else if (p.tour === "pairs") checkPairs(q, p, report);
  else if (p.tour === "build") checkBuild(q, p, report);
  else if (p.tour === "map") checkMap(q, p, report);
  else if (p.tour === "sort") checkSort(q, p, report);
  else checkPaint(q, p, report);
}

/** Every lesson country a payload mentions (credited or merely shown). Map neighbours are scenery. */
export function payloadCodes(p: TourPayload): string[] {
  let shown: string[] = [];
  if (p.tour === "pick") shown = p.options;
  else if (p.tour === "pairs") shown = [...p.left, ...p.right];
  else if (p.tour === "sort") shown = p.cards;
  return [...new Set([...p.codes, ...shown])];
}

/** The country a single-country exercise is about (null for pairs / sort). */
export function primaryOf(p: TourPayload): string | null {
  return "code" in p ? p.code : null;
}

function checkShape(q: Question, p: TourPayload, report: Report): void {
  if (!q.prompt.trim() || !q.answer.trim() || !q.hint.trim()) report("blank prompt, answer or hint");
  if (q.prompt.trim().split(/\s+/).length > 8) report(`prompt longer than 8 words: "${q.prompt}"`);
  if (/wrong|fail/i.test(`${q.prompt} ${q.hint}`)) report("forbidden word in prompt or hint");
  if (q.repeatable !== true || q.choices.length !== 0) report("must be repeatable with no choices");
  if (!TOUR_KINDS.includes(p.tour)) report(`unknown kind ${String(p.tour)}`);
  if (!p.codes.length || !unique(p.codes)) report("codes empty or repeated");
  const primary = primaryOf(p);
  if (primary && (p.codes.length !== 1 || p.codes[0] !== primary)) report("codes must be exactly the primary country");
  const subject = `tour:${p.tour}:${primary ?? sorted(p.codes)}`;
  if (q.dedupeKey !== subject && !q.dedupeKey?.startsWith(`${subject}#`)) report(`dedupeKey ${q.dedupeKey} is not ${subject}`);
}

/** Check one tour question against the contract. Returns its payload, or null when it is not a tour question. */
export function checkTourQuestion(q: Question, params: TourParams, label: string, failures: string[]): TourPayload | null {
  const p = tourPayload(q);
  if (!p) {
    failures.push(`${label}: not a tour question`);
    return null;
  }
  const report: Report = (message) => failures.push(`${label} [${p.tour} ${p.codes.join("+")}]: ${message}`);
  checkShape(q, p, report);
  if (!params.kinds.includes(p.tour)) report("kind is not in the lesson's kinds");
  const allowed = new Set([...params.focus, ...params.review, ...TOUR_ANCHORS]);
  const pool = new Set([...params.focus, ...params.review]);
  for (const code of payloadCodes(p)) {
    if (!COUNTRY_BY_CODE.has(code)) report(`unknown country ${code}`);
    else if (!allowed.has(code)) report(`${code} is outside the lesson pool and the anchors`);
  }
  if (primaryOf(p) && !pool.has(p.codes[0])) report("primary country is not in the lesson pool");
  checkKind(q, p, report);
  return p;
}
