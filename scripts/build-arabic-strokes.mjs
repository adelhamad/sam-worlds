// Builds src/content/arabic/strokes.gen.ts — the stroke centrelines of the 28
// Arabic letters (isolated forms) for the handwriting tracer.
//
//   node scripts/build-arabic-strokes.mjs                 regenerate the data file
//   node scripts/build-arabic-strokes.mjs --check         rebuild and fail if the committed file differs
//   node scripts/build-arabic-strokes.mjs --debug <dir>   also write debug sheets (skeleton + strokes)
//   node scripts/build-arabic-strokes.mjs --force         write even if a geometry check fails (recipe work only)
//
// How: the app's own font (Noto Sans Arabic, @fontsource-variable) is the only
// source of SHAPE. Each letter is rasterised in headless Chrome exactly as the
// app draws the guide letter, split into ink shapes (body / dots / kaf's mark),
// thinned to a one-pixel skeleton (Zhang–Suen) and pruned of spurs. ORDER and
// DIRECTION come from the hand-written recipes in scripts/arabic/recipes.mjs:
// waypoints snapped onto the skeleton, joined by shortest paths along it. Every
// letter is then checked against the raster it came from (scripts/arabic/check.mjs)
// and the build fails loudly if any letter is off. Needs Chrome (CHROME_PATH).
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkGeometry } from "./arabic/check.mjs";
import { writeDebugSheets } from "./arabic/debug.mjs";
import { LETTERS } from "./arabic/letters.mjs";
import { FONT_FAMILY, FONT_FILE, measureLetters, openFontPage, rasterLetter } from "./arabic/raster.mjs";
import { RECIPES } from "./arabic/recipes.mjs";
import { routeStroke } from "./arabic/route.mjs";
import { components, distanceTransform, endpoints, junctions, prune, thin } from "./arabic/skeleton.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = "src/content/arabic/strokes.gen.ts";
const BOX = 1000;
const MARGIN = 70;
const SCALE = 2; // raster pixels per design unit (em box ≈ 1350 px)
const WEIGHT = 500;
const PRUNE = 1.6; // spur length, in stroke radii, below which a skeleton branch is noise
const DOT_MAX = 100; // design units: a dot is a compact blob no wider or taller than this
const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] ?? "" : null; };

function layoutFor(metrics) {
  let ascent = 0, descent = 0, width = 0;
  for (const m of metrics) {
    ascent = Math.max(ascent, m.ascent);
    descent = Math.max(descent, m.descent);
    width = Math.max(width, m.left + m.right);
  }
  const size = Math.floor(Math.min((BOX - 2 * MARGIN) / (ascent + descent), (BOX - 2 * MARGIN) / width) * 1000);
  const baseline = Math.round(BOX / 2 + ((ascent - descent) / 2) * (size / 1000));
  return { size, baseline, weight: WEIGHT };
}

function classify(comps) {
  const [body, ...rest] = comps;
  const dots = [], marks = [];
  for (const c of rest) {
    const [x0, y0, x1, y1] = c.bbox;
    const aspect = (x1 - x0 + 1) / (y1 - y0 + 1);
    const size = Math.max(x1 - x0 + 1, y1 - y0 + 1) / SCALE;
    (size <= DOT_MAX && aspect > 0.66 && aspect < 1.5 ? dots : marks).push(c);
  }
  return { body, dots, marks };
}

function dotStroke(c, w) {
  let sx = 0, sy = 0;
  for (const p of c.pixels) { sx += p % w; sy += (p - (p % w)) / w; }
  const x = sx / c.area / SCALE, y = sy / c.area / SCALE;
  return { kind: "dot", points: [[Math.round(x), Math.round(y)]], radius: Math.sqrt(c.area / Math.PI) / SCALE };
}

/** Row by row from the bottom (the pair under the top dot of ث ش first), right to left in a row. */
function dotOrder(a, b) {
  const [ax, ay] = a.points[0], [bx, by] = b.points[0];
  return Math.abs(ay - by) > a.radius ? by - ay : bx - ax;
}

function buildLetter(letter, mask, layoutX) {
  const w = BOX * SCALE;
  const inside = distanceTransform(w, w, (p) => mask[p] === 1);
  const outside = distanceTransform(w, w, (p) => mask[p] === 0);
  const { body, dots, marks } = classify(components(mask, w, w));
  const comps = { body, mark: marks[0] };
  const skeletons = {};
  const debug = { id: letter.id, char: letter.char, x: layoutX, skeleton: [], ends: [], forks: [] };
  for (const [name, comp] of Object.entries(comps)) {
    if (!comp) continue;
    const skel = prune(thin(comp.pixels, w, w), w, inside, PRUNE);
    skeletons[name] = skel;
    const toXY = (p) => [(p % w) / SCALE, Math.floor(p / w) / SCALE];
    debug.skeleton.push(...skel.list.filter((_, i) => i % 3 === 0).map(toXY));
    debug.ends.push(...endpoints(skel, w).map(toXY));
    debug.forks.push(...junctions(skel, w).map(toXY));
  }
  const medianRadius = (skel) => {
    const radii = skel.list.map((p) => inside[p]).sort((a, b) => a - b);
    return radii[radii.length >> 1] / SCALE;
  };
  const radius = medianRadius(skeletons.body);
  const inkDepth = (x, y) => inside[Math.round(y) * w + Math.round(x)];
  const lines = RECIPES[letter.id].map((recipe) => {
    const skel = skeletons[recipe.comp];
    if (!skel) throw new Error(`${letter.id}: no "${recipe.comp}" shape in the glyph`);
    const own = medianRadius(skel);
    return { kind: "line", radius: own, points: routeStroke(recipe, { skel, w, scale: SCALE, inkDepth, radius: own }) };
  });
  const strokes = [...lines, ...dots.map((c) => dotStroke(c, w)).sort(dotOrder)];
  const geometry = checkGeometry({ strokes, mask, outside, w, scale: SCALE, radius });
  debug.strokes = strokes;
  return { strokes, radius, geometry, debug, marks: marks.length };
}

function fmtStroke(s) {
  const pts = s.points.map(([x, y]) => `[${x}, ${y}]`).join(", ");
  return s.kind === "dot" ? `{ kind: "dot", points: [${pts}] }` : `{ kind: "line", points: [${pts}] }`;
}

function render(layout, built, fontSha) {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "node_modules/@fontsource-variable/noto-sans-arabic/package.json"), "utf8"));
  const lines = [
    "// GENERATED by scripts/build-arabic-strokes.mjs — do not edit by hand.",
    "// Regenerate: node scripts/build-arabic-strokes.mjs (needs Chrome; see the script header).",
    `// Shape source: @fontsource-variable/noto-sans-arabic ${pkg.version}, ${path.basename(FONT_FILE)}.`,
    "// Order and direction: scripts/arabic/recipes.mjs, documented in docs/ARABIC_WRITING.md.",
    "// Units: a 1000 × 1000 design box, y down. Draw the guide letter with ARABIC_FONT at",
    "// (x, baseline), text-anchor middle, and it lines up with these strokes exactly.",
    'import type { GlyphFont, RawGlyph } from "../../engine/write/types";',
    "",
    `export const ARABIC_FONT_SHA256 = "${fontSha}";`,
    "",
    `export const ARABIC_FONT: GlyphFont = { family: "${FONT_FAMILY}", weight: ${layout.weight}, size: ${layout.size}, baseline: ${layout.baseline} };`,
    "",
    "export const ARABIC_STROKES: Record<string, RawGlyph> = {",
  ];
  for (const b of built) {
    lines.push(`  ${b.id}: { char: "${b.char}", x: ${b.x}, width: ${Math.round(b.radius * 2)}, strokes: [`);
    for (const s of b.strokes) lines.push(`    ${fmtStroke(s)},`);
    lines.push("  ] },");
  }
  lines.push("};", "");
  return lines.join("\n");
}

const debugDir = arg("debug");
const fontSha = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, FONT_FILE))).digest("hex");
const { browser, page } = await openFontPage(ROOT);
const failures = [];
const built = [];
try {
  const metrics = await measureLetters(page, LETTERS.map((l) => l.char), WEIGHT);
  const layout = layoutFor(metrics);
  console.log(`font ${FONT_FAMILY} ${WEIGHT}, size ${layout.size}, baseline ${layout.baseline} (box ${BOX})`);
  console.log("on-ink: how far any stroke sample strays off the ink (0 = on the font's own skeleton, by construction);");
  console.log("off-centre: distance from the middle of the stroke, median / 95th percentile; all in design units.");
  console.log("letter  strokes  dots  width  on-ink(max)  off-centre  cover   spill   result");
  for (const [i, letter] of LETTERS.entries()) {
    const m = metrics[i];
    const x = Math.round((BOX / 2 + ((m.left - m.right) / 2) * (layout.size / 1000)) * 10) / 10;
    const mask = await rasterLetter(page, { char: letter.char, x, baseline: layout.baseline, fontSize: layout.size, weight: WEIGHT, box: BOX, scale: SCALE });
    const r = buildLetter(letter, mask, x);
    const lines = r.strokes.filter((s) => s.kind === "line").length;
    const g = r.geometry;
    console.log(`${letter.id.padEnd(7)} ${String(lines).padStart(7)} ${String(r.strokes.length - lines).padStart(5)} ${String(Math.round(r.radius * 2)).padStart(6)} ` +
      `${g.worst.toFixed(1).padStart(12)} ${(g.centre.median.toFixed(1) + " / " + g.centre.p95.toFixed(1)).padStart(11)} ${(g.cover * 100).toFixed(1).padStart(6)}% ${(g.spill * 100).toFixed(1).padStart(6)}%   ${g.problems.length ? "FAIL" : "ok"}`);
    for (const problem of g.problems) failures.push(`${letter.id}: ${problem}`);
    built.push({ ...letter, x, radius: r.radius, strokes: r.strokes, debug: r.debug });
  }
  if (debugDir) {
    fs.mkdirSync(debugDir, { recursive: true });
    await page.setViewport({ width: 1400, height: 2800 });
    await writeDebugSheets(page, built.map((b) => b.debug), layout, debugDir);
  }
  const text = render(layout, built, fontSha);
  const target = path.join(ROOT, OUT_FILE);
  if (arg("check") !== null) {
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== text) failures.push(`${OUT_FILE} is out of date — run node scripts/build-arabic-strokes.mjs`);
  } else if (!failures.length || arg("force") !== null) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
    console.log(`wrote ${OUT_FILE}`);
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.error(failures.join("\n"));
  const note = arg("force") === null ? ` — ${OUT_FILE} was not written` : "";
  console.error(`${failures.length} geometry problems${note}`);
  process.exitCode = 1;
}
