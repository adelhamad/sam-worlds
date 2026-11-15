# Arabic handwriting tracer

Sam traces the 28 Arabic letters (isolated forms) with a finger, stroke by stroke, in the
order and direction they are taught at school. This page explains where the shapes come
from, how a stroke is judged, and — for a parent who writes Arabic — the stroke order of
every letter, so it can be checked at a glance.

## Where the shapes come from

- **One font is the only source of shape**: Noto Sans Arabic (`@fontsource-variable/noto-sans-arabic`,
  OFL), weight 500. The faint letter on the canvas is that font, and the stroke centre lines are
  **derived from the same font's glyphs**, so the two coincide by construction.
- `scripts/build-arabic-strokes.mjs` (run with `node`, needs Chrome) draws each letter in headless
  Chrome exactly the way the app does (centre anchor, alphabetic baseline, same size), at
  about 1350 px per em, splits the ink into shapes (body, dots, kaf's small mark), thins the
  body to a one-pixel skeleton (Zhang–Suen), prunes spurs and joins hand-written waypoints by
  the shortest path **along the skeleton**. Ends that were cut square are pushed back out to
  the end of the ink; the line is smoothed and resampled every 10 units.
- **Order and direction** are the only hand-written part: `scripts/arabic/recipes.mjs`. A recipe
  says where a stroke starts (for example "the top-right end"), which waypoints it passes (so
  loops go round the right way) and where it ends. Dots are found automatically and ordered by
  the rule below.
- The build **checks itself** against the raster it came from and refuses to write the data
  file if a letter is off: every stroke point must lie on the ink (within 15 units = 1.5 % of
  the box), and the strokes, brushed at the letter's stroke width, must cover ≥ 92 % of the ink
  and spill ≤ 8 % outside it. It prints a per-letter table (also the median / 95th-percentile
  distance of the stroke from the middle of the ink).
- Output: `src/content/arabic/strokes.gen.ts` (generated, committed, deterministic). It records
  the SHA-256 of the font file; the audit fails if the font package changes, until the data is
  rebuilt. Names and sounds are hand-written in `src/content/arabic/letters.ts`.

```
node scripts/build-arabic-strokes.mjs                 # regenerate
node scripts/build-arabic-strokes.mjs --check         # fail if the committed file is out of date
node scripts/build-arabic-strokes.mjs --debug DIR     # skeleton + stroke sheets for recipe work
```

Design box: 1000 × 1000 units, y down. The glyph is drawn with `ARABIC_FONT` (family
"Noto Sans Arabic Variable", weight 500, size 678 units, baseline at y = 603) at the
letter's own `x` with a centred anchor (`text-anchor="middle"`), so every letter's ink is
centred in the box and all letters share one baseline and one size.

## Stroke order

Reference: the Wikimedia Commons stroke-order animations of the Arabic letters
("Lettre NN …" series, simple school handwriting), cross-checked with Mamoun Sakkal's Naskh
alphabet chart (sakkal.com, start dots and arrows) and the Alifbee letter guides. Where they
disagree it is said below. General rules: the body first, as one continuous stroke where the
letter allows, starting at its top or right; then dots and marks. Closed loops (ص ض ط ظ ف ق م و ه)
go **clockwise** on the page; the open heads of ع غ and the bowls of ج ح خ go anticlockwise.
Dots: right to left; in the three-dot triangle of ث ش the bottom pair first (right, then
left), then the top dot.

| Letter | Name | Strokes | Order and direction |
|---|---|---|---|
| ا | alif | 1 | One stroke from the top straight down to the line. |
| ب | baa | 2 | Body: from the right tip, down, left along the bowl, up to the left tip. Then the dot below. |
| ت | taa | 3 | Body as ب. Dots above: right, then left. |
| ث | thaa | 4 | Body as ب. Dots: bottom-right, bottom-left, then the top one. |
| ج | jeem | 2 | Head from its left tip to the right end, then back down-left and round the bowl (anticlockwise) to the tail at the bottom right. Then the dot inside. |
| ح | Haa | 1 | As ج, no dot. |
| خ | khaa | 2 | As ح, then the dot above. |
| د | daal | 1 | From the top, down and to the right, round and left along the line. |
| ذ | thaal | 2 | As د, then the dot above. |
| ر | raa | 1 | From the top, curving down and to the left below the line. |
| ز | zaay | 2 | As ر, then the dot above. |
| س | seen | 1 | From the top of the right tooth down; up and down the middle tooth; up and down the third tooth; then down into the bowl, round to the left and up to its tip. |
| ش | sheen | 4 | Body as س. Dots: bottom-right, bottom-left, then the top one. |
| ص | Saad | 1 | Loop first: from its bottom-left corner up the slanted side, over the top to the right, down and back left along the line (clockwise); then up and down the small tooth, and the bowl round to its left tip. |
| ض | Daad | 2 | As ص, then the dot above. |
| ط | Taa | 2 | Body first: from the bottom-left corner of the loop, up and over to the right, down and back left along the line to its left end (clockwise). Then the upright, from the top down to the line. |
| ظ | Zaa | 3 | As ط, then the dot. |
| ع | ain | 1 | From the top-right tip of the head, left and round like a small "c" (anticlockwise), out to the right along the lower arm, then back down-left and round the big bowl to the tail at the bottom right. |
| غ | ghain | 2 | As ع, then the dot above. |
| ف | faa | 2 | Head first: from where it meets the line (its bottom right), left along its bottom, up, over the top and down the right side (clockwise); then on along the line to the left and up to the tip. Then the dot. |
| ق | qaaf | 3 | Head as ف, then down round the deep bowl to the left tip. Dots: right, then left. |
| ك | kaaf | 2 | From the top of the upright down, left along the line, up to the left tip. Then the small inner mark, from its top-right end down to its bottom-left end. |
| ل | laam | 1 | From the top down, round the bowl to the left and up to the tip. |
| م | meem | 1 | From the left end of the head, up and over to the right, down and back left along its bottom (clockwise), then straight down the tail. |
| ن | noon | 2 | From the right tip, down round the bowl to the left tip. Then the dot. |
| ه | haa | 1 | From the top: down the right, round the right lobe and along the bottom, up round the left lobe to the top (clockwise, as the round ه is taught), then down the middle and out along the tail to the left. |
| و | waaw | 1 | Head first: from where it meets the tail (its bottom right), left along its bottom, up, over the top and down the right side (clockwise); then down the tail, curving left below the line. |
| ي | yaa | 3 | From the top-right tip, left and down, swinging back to the right (a reversed "s"), then down and round the big bowl to the left tip. Dots below: right, then left. |

Hamza (ء) is not one of the 28 letters here; harakat, joined forms and digits are out of scope.

### Where the sources differ, and what is least certain

- **ط ظ**: the brief asks for the loop body first, then the upright — that is what is built. The
  Commons animation draws the upright first and runs into the loop in one stroke; Sakkal marks
  both starts without an order. A parent may prefer the other order.
- **ك's inner mark**: no source shows how it is drawn; top-right to bottom-left is our choice.
- **ه**: Noto Sans Arabic's isolated heh is the Naskh "knot", not the round heh most worksheets
  show. The route (one stroke, both lobes clockwise, then out along the tail) follows the round
  heh's clockwise rule; it retraces two short pieces in the middle. A native writer should check it.
- **ع head**: Sakkal starts the head at its left; the Commons animation and Alifbee start at the
  top-right tip like a "c". We follow the latter.
- **ث ش dots**: Commons draws the bottom pair first, then the top; some teachers do top first.

## How a stroke is judged (`src/engine/write/`, pure, no React)

`judgeStroke(target, drawn, opts)` works in design units on the finger trail resampled to 64
even points. A `line` must, in this order: **start** near its start dot, be **long enough**,
stay near the path (**mean** and **90th-percentile** distance — a few jittery points are
fine), **cover** at least 85 % of the path with no uncovered stretch longer than 90 units (so
skipping a tooth of س or ص, or the lower arm of ع, does not count), **end** near its end, not be a scribble, and run
the right way (**in-order match**: the 90th percentile of a dynamic-time-warping match, which
catches going round a loop the wrong way even when every point sits on the ink). A `dot` takes
a tap or a small dab, and the tap must be nearer this dot than any other dot of the letter.
All numbers are data in `tolerance.ts`, two levels: `guided` and `memory` (more room on
position, the same direction and coverage rules). About 100 units ≈ a fingertip on a phone.

Slip reasons and their hints (`src/strings/write.ts`): start → "Start at the dot." (a dot:
"Tap the dot."), direction → "Follow the arrow.", short → "Go all the way.", shape → "Stay on
the path.", long → "Stop at the end." Never "wrong", "fail" or "mistake".

`traceVerdict(glyph, attempts, guide)` re-judges every attempt and returns `TRACE_DONE`
(`"traced"`) when every stroke was written in order with at most `MAX_SLIPS` (3) slips,
otherwise `miss:order`, `miss:unfinished:2/4` or `miss:slips:5`. `TRACE_DONE` looks the same
with 0 or 3 slips: a lesson that pays first-try vs after-hint (answer-integrity rule 4) should
grade with `traceTally(glyph, attempts, guide).slips`, using the attempts `onDone` hands over.

`scripts/audit-write.ts` (inside `bun run check`) proves it: every stroke's own path with
seeded finger wobble, at different pointer speeds, landing well off the dot, stopping short
or running past the end, passes at both levels; the path backwards, a loop the wrong way
round, a skipped tooth, the first half, a straight shortcut, a tap on another dot and every other letter's
first stroke (in place, and moved onto this letter's start dot) fail — except the listed
same-body families (ب ت ث; ج ح خ; د ذ; ر ز; س ش; ص ض; ط ظ; ع غ) and, once moved onto the same
start dot, the look-alikes د/ذ vs ر/ز.

## Using it in a lesson

```tsx
import { arabicGlyph, ARABIC_LETTERS } from "src/content/arabic/letters";
import { TraceCanvas } from "src/ui/write/TraceCanvas";
import { TRACE_DONE } from "src/engine/write";

<TraceCanvas glyph={arabicGlyph("ba")} guide="guided" disabled={sheetOpen}
  onStroke={({ ok }) => (ok ? chime() : aww())}
  onDone={(verdict) => submit(verdict)} />   // question.answer = TRACE_DONE
```

The canvas reports once per letter (it stops taking input then); remount it (`key`) for a
fresh try. It plays "Watch" by itself the first time a letter is shown in the session
(`autoWatch={false}` to skip); reduced motion shows the numbered strokes instead.

Dev bench: `/#/tour/lab/write` — the whole alphabet with strokes, numbers, start dots and
arrows over the faint glyph, and a live canvas (`?letter=sad&guide=memory`).
