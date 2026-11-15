// Handwriting tracer audit: the Arabic stroke data and the judge
// (src/engine/write/). Run alone (`bun scripts/audit-write.ts`) or through
// audit-questions.ts. For every letter it checks:
//   (a) the data is well-formed: 28 letters in order, strokes inside the box, dots last,
//       and the font file is the one the strokes were built from;
//   (b) each stroke's own path, with finger-like wobble (seeded) and at 70 % / 130 %
//       pointer speed, passes at both guide levels — also a shaky finger landing well
//       off the dot, stopping 60 units short or running 50 units past the end, or reported
//       by a fast, jittery touch screen; a tap passes
//       a dot, a tap on one of the letter's OTHER dots does not;
//   (c) the same path backwards fails, and so does going round a loop the wrong way
//       or skipping a tooth (the up-and-down of س ش ص ض, the lower arm of ع غ);
//   (d) the first half fails, and a straight shortcut fails for curved strokes;
//   (e) every OTHER letter's first stroke fails against this letter's first stroke,
//       unless the two are listed below as the same shape — both where it sits in the
//       box and moved so that it starts exactly on this letter's start dot;
//   plus traceVerdict's done / slips / order rules.
import crypto from "node:crypto";
import fs from "node:fs";
import { ARABIC_BOX, ARABIC_LETTERS } from "../src/content/arabic/letters";
import { ARABIC_FONT_SHA256 } from "../src/content/arabic/strokes.gen";
import { mulberry32 } from "../src/engine/rng";
import { judgeGlyphStroke } from "../src/engine/write/judge";
import { MAX_SLIPS, TOLERANCE } from "../src/engine/write/tolerance";
import type { GlyphStrokes, GuideLevel, Point, TraceAttempt } from "../src/engine/write/types";
import { TRACE_DONE, traceVerdict } from "../src/engine/write/verdict";
import { cutBy, cutTo, isSymmetric, loopsOf, maxDeviationFromChord, overshoot, retracesOf, skipSpan, sampleEvery, JITTERY, SHAKY, STEADY, wobble, wrongWayRound } from "./audit-write-traces";

const FONT_FILE = "node_modules/@fontsource-variable/noto-sans-arabic/files/noto-sans-arabic-arabic-wght-normal.woff2";
const ORDER = ["alif", "ba", "ta", "tha", "jeem", "hha", "kha", "dal", "thal", "ra", "zay", "seen", "sheen", "sad", "dad",
  "tta", "zza", "ain", "ghain", "fa", "qaf", "kaf", "lam", "meem", "noon", "ha", "waw", "ya"];

/** Letters whose FIRST stroke is genuinely the same shape (they differ only by dots). */
const SAME_BODY = [["ba", "ta", "tha"], ["jeem", "hha", "kha"], ["dal", "thal"], ["ra", "zay"], ["seen", "sheen"],
  ["sad", "dad"], ["tta", "zza"], ["ain", "ghain"]];
/**
 * Similar first strokes the judge MAY accept for each other once moved onto the
 * same start dot (in place in the box they are still told apart): د/ذ vs ر/ز are
 * two short curves of nearly the same length in this font; ف vs ق differ in bowl depth.
 */
const LOOK_ALIKE = [["dal", "thal", "ra", "zay"], ["fa", "qaf"]];
const LEVELS: GuideLevel[] = ["guided", "memory"];
const SEEDS = [11, 23, 47, 101, 2024];

interface Stats { passes: number; fails: number; lookAlikes: Set<string>; reasons: Record<string, number> }

function family(groups: string[][], a: string, b: string): boolean {
  return groups.some((group) => group.includes(a) && group.includes(b));
}

function checkData(failures: string[]): void {
  const ids = ARABIC_LETTERS.map((letter) => letter.id);
  if (ids.join() !== ORDER.join()) failures.push(`write: letters out of alphabet order: ${ids.join(" ")}`);
  const sha = crypto.createHash("sha256").update(fs.readFileSync(FONT_FILE)).digest("hex");
  if (sha !== ARABIC_FONT_SHA256) failures.push("write: the Arabic font file changed — run node scripts/build-arabic-strokes.mjs");
  for (const letter of ARABIC_LETTERS) {
    const g = letter.glyph;
    const label = `write/${letter.id}`;
    if (!letter.name.trim() || !letter.sound.trim() || [...letter.char].length !== 1) failures.push(`${label}: missing name, sound or char`);
    if (!g.strokes.length || g.strokes[0].kind !== "line") failures.push(`${label}: must start with a line stroke`);
    let seenDot = false;
    for (const [i, s] of g.strokes.entries()) {
      if (s.kind === "dot") seenDot = true;
      else if (seenDot) failures.push(`${label}: line stroke ${i + 1} after a dot`);
      if (s.kind === "dot" ? s.points.length !== 1 : s.points.length < 4) failures.push(`${label}: stroke ${i + 1} has ${s.points.length} points`);
      if (s.points.some(([x, y]) => !(x >= 0 && y >= 0 && x <= ARABIC_BOX && y <= ARABIC_BOX))) failures.push(`${label}: stroke ${i + 1} leaves the box`);
    }
  }
}

function expectJudge(failures: string[], stats: Stats, label: string, glyph: GlyphStrokes, index: number, drawn: Point[], guide: GuideLevel, want: boolean): void {
  const verdict = judgeGlyphStroke(glyph, index, drawn, guide);
  if (verdict.ok !== want) failures.push(`${label} [${guide}]: expected ${want ? "pass" : "fail"}, got ${verdict.ok ? "pass" : verdict.reason}`);
  if (want) stats.passes++;
  else {
    stats.fails++;
    if (!verdict.ok) stats.reasons[verdict.reason ?? "?"] = (stats.reasons[verdict.reason ?? "?"] ?? 0) + 1;
  }
}

function checkDots(failures: string[], stats: Stats, glyph: GlyphStrokes, index: number, label: string, guide: GuideLevel): void {
  const [x, y] = glyph.strokes[index].points[0];
  expectJudge(failures, stats, `${label} tap`, glyph, index, [[x + 20, y - 15]], guide, true);
  expectJudge(failures, stats, `${label} dab`, glyph, index, [[x - 15, y], [x, y + 10], [x + 15, y - 5]], guide, true);
  expectJudge(failures, stats, `${label} far tap`, glyph, index, [[x + 150, y + 60]], guide, false);
  glyph.strokes.forEach((other, j) => {
    if (j !== index && other.kind === "dot") expectJudge(failures, stats, `${label} tap on dot ${j + 1}`, glyph, index, [other.points[0]], guide, false);
  });
}

function checkLine(failures: string[], stats: Stats, glyph: GlyphStrokes, index: number, label: string, guide: GuideLevel): void {
  const path = glyph.strokes[index].points;
  for (const seed of SEEDS) {
    const rng = mulberry32(seed * 31 + index + glyph.id.length * 977);
    for (const spacing of [14, 10, 20]) {
      expectJudge(failures, stats, `${label} steady seed ${seed} every ${spacing}`, glyph, index, wobble(sampleEvery(path, spacing), rng, STEADY), guide, true);
    }
    expectJudge(failures, stats, `${label} shaky seed ${seed}`, glyph, index, wobble(sampleEvery(path, 14), rng, SHAKY), guide, true);
    expectJudge(failures, stats, `${label} fast jittery screen seed ${seed}`, glyph, index, wobble(sampleEvery(path, 2), rng, JITTERY), guide, true);
    expectJudge(failures, stats, `${label} shaky, stops 60 short, seed ${seed}`, glyph, index, wobble(sampleEvery(cutBy(path, 60), 14), rng, SHAKY), guide, true);
    expectJudge(failures, stats, `${label} shaky, past the end, seed ${seed}`, glyph, index, wobble(sampleEvery(overshoot(path, 50), 14), rng, SHAKY), guide, true);
  }
  if (!isSymmetric(path)) expectJudge(failures, stats, `${label} backwards`, glyph, index, [...path].reverse(), guide, false);
  for (const tooth of retracesOf(path)) {
    expectJudge(failures, stats, `${label} skipping the retrace ${tooth.join("-")}`, glyph, index, skipSpan(path, tooth), guide, false);
  }
  for (const loop of loopsOf(path)) {
    expectJudge(failures, stats, `${label} loop ${loop.join("-")} the wrong way round`, glyph, index, wrongWayRound(path, loop), guide, false);
  }
  expectJudge(failures, stats, `${label} first half`, glyph, index, cutTo(path, 0.5), guide, false);
  if (maxDeviationFromChord(path) > 120) {
    expectJudge(failures, stats, `${label} straight shortcut`, glyph, index, sampleEvery([path[0], path[path.length - 1]], 10), guide, false);
  }
}

function checkOwnStrokes(failures: string[], glyph: GlyphStrokes, stats: Stats): void {
  for (const [i, stroke] of glyph.strokes.entries()) {
    for (const guide of LEVELS) {
      const label = `write/${glyph.id} stroke ${i + 1}`;
      if (stroke.kind === "dot") checkDots(failures, stats, glyph, i, label, guide);
      else checkLine(failures, stats, glyph, i, label, guide);
    }
  }
}

function moveStartTo(points: readonly Point[], start: Point): Point[] {
  const dx = start[0] - points[0][0];
  const dy = start[1] - points[0][1];
  return points.map(([x, y]) => [x + dx, y + dy]);
}

function checkDiscrimination(failures: string[], stats: Stats): void {
  for (const target of ARABIC_LETTERS) {
    for (const other of ARABIC_LETTERS) {
      if (other.id === target.id || family(SAME_BODY, target.id, other.id)) {
        if (other.id !== target.id && !judgeGlyphStroke(target.glyph, 0, other.glyph.strokes[0].points, "guided").ok) {
          failures.push(`write/${target.id}: the identical body of ${other.id} was refused`);
        }
        continue;
      }
      const theirs = other.glyph.strokes[0].points;
      for (const guide of LEVELS) {
        expectJudge(failures, stats, `write/${target.id} vs ${other.id} in place`, target.glyph, 0, theirs, guide, false);
        const moved = moveStartTo(theirs, target.glyph.strokes[0].points[0]);
        if (family(LOOK_ALIKE, target.id, other.id)) {
          if (judgeGlyphStroke(target.glyph, 0, moved, guide).ok) stats.lookAlikes.add(`${other.id}→${target.id}`);
        } else {
          expectJudge(failures, stats, `write/${target.id} vs ${other.id} on the start dot`, target.glyph, 0, moved, guide, false);
        }
      }
    }
  }
}

function cleanAttempts(glyph: GlyphStrokes): TraceAttempt[] {
  return glyph.strokes.map((stroke, i) => ({ stroke: i, points: stroke.points }));
}

function checkVerdicts(failures: string[]): void {
  for (const letter of ARABIC_LETTERS) {
    const g = letter.glyph;
    const label = `write/${letter.id} verdict`;
    const clean = cleanAttempts(g);
    const slip = (stroke: number): TraceAttempt => ({ stroke, points: [[0, 0], [5, 5]] });
    const withSlips = (n: number) => [...Array.from({ length: n }, () => slip(0)), ...clean];
    if (traceVerdict(g, clean) !== TRACE_DONE) failures.push(`${label}: a clean letter is not done`);
    if (traceVerdict(g, withSlips(MAX_SLIPS)) !== TRACE_DONE) failures.push(`${label}: ${MAX_SLIPS} slips should still count`);
    if (!traceVerdict(g, withSlips(MAX_SLIPS + 1)).startsWith("miss:slips")) failures.push(`${label}: too many slips not reported`);
    if (!traceVerdict(g, clean.slice(0, -1)).startsWith("miss:unfinished")) failures.push(`${label}: unfinished letter not reported`);
    if (g.strokes.length > 1 && traceVerdict(g, [clean[1], ...clean]) !== "miss:order") failures.push(`${label}: out-of-order stroke not reported`);
    const again = traceVerdict(g, cleanAttempts(g));
    if (again !== TRACE_DONE) failures.push(`${label}: not deterministic`);
  }
}

export function auditWrite(): string[] {
  const failures: string[] = [];
  const stats: Stats = { passes: 0, fails: 0, lookAlikes: new Set(), reasons: {} };
  checkData(failures);
  for (const letter of ARABIC_LETTERS) checkOwnStrokes(failures, letter.glyph, stats);
  checkDiscrimination(failures, stats);
  checkVerdicts(failures);
  const { guided, memory } = TOLERANCE;
  if (memory.order !== guided.order || memory.minCover !== guided.minCover || memory.maxGap !== guided.maxGap) {
    failures.push("write: memory mode must keep the same direction and coverage rules as guided");
  }
  if (!failures.length) {
    const reasons = Object.entries(stats.reasons).map(([k, v]) => k + " " + v).join(", ");
    const strokes = ARABIC_LETTERS.reduce((n, letter) => n + letter.glyph.strokes.length, 0);
    console.log(`Write audit passed: ${ARABIC_LETTERS.length} letters, ${strokes} strokes, ${stats.passes} traces accepted, ` +
      `${stats.fails} traces refused (${reasons}); ` +
      `start-aligned look-alikes accepted: ${[...stats.lookAlikes].join(" ") || "none"}`);
  }
  return failures;
}

if (import.meta.main) {
  const failures = auditWrite();
  if (failures.length) {
    console.error(failures.slice(0, 120).join("\n"));
    console.error(`${failures.length} write audit failures`);
    process.exitCode = 1;
  }
}
