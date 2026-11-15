// Stroke ORDER and DIRECTION for every letter — the only hand-written part of
// the stroke data. Geometry never comes from here: each waypoint is snapped
// onto the font's own skeleton and consecutive waypoints are joined by the
// shortest path along it (see route.mjs). Loops get enough waypoints to fix
// which way round they go. Coordinates are design-box units (0–1000, y down).
//
//   comp: "body" — the largest ink shape; "mark" — the largest non-dot shape
//         after it (kaf's small inner mark).
//   via:  { end: "top" | [x, y] } a line end, { at: [x, y] } any skeleton
//         point, { fork: [x, y] } a branch point, { apex: "top" } (first only) a
//         pointed tip of the ink the skeleton does not reach.
//
// Dots are not listed: every dot-shaped ink blob becomes a `dot` stroke after
// the line strokes, ordered right to left; in the three-dot triangle of ث ش
// the bottom pair comes first (right, left), then the top dot.
// The order is documented for parents in docs/ARABIC_WRITING.md — keep both in sync.

const line = (...via) => ({ comp: "body", via });
const ends = (from, to) => line({ end: from }, { end: to });

/** ب ت ث — from the right tip, down along the bowl, up to the left tip. */
const BOWL = [ends("right", "left")];
/** ج ح خ — head from its left tip to its right end, then back down-left round the bowl to the tail. */
const JEEM = [line({ end: "top-left" }, { end: [648, 396] }, { end: "bottom-right" })];
/** د ذ — from the top, down to the corner, then left along the line. */
const DAL = [ends("top", "left")];
/** ر ز — from the top, curving down and to the left below the line. */
const RA = [ends("top", "bottom")];
/** س ش — three teeth right to left (up and down each tooth), then the bowl. */
const SEEN = [line({ end: "top-right" }, { end: [716, 414] }, { end: [488, 403] }, { end: "left" })];
/**
 * ص ض — the loop first: from where it meets the line, up the slanted side,
 * over the top to the right and back along the line (clockwise on the page);
 * then the small tooth (up and down) and the bowl to its left tip.
 */
const SAD = [line({ fork: [567, 559] }, { at: [797, 370] }, { at: [894, 461] }, { at: [703, 575] }, { fork: [567, 559] }, { end: [458, 398] }, { end: "left" })];
/**
 * ط ظ — the body first: like ص, from the bottom-left corner of the loop up
 * and over to the right, down and back left along the line to its left end
 * (clockwise); then the upright from the top down to the line.
 */
const TTA = [
  line({ fork: [388, 570] }, { at: [625, 372] }, { at: [711, 453] }, { at: [547, 575] }, { end: "left" }),
  line({ end: "top" }, { fork: [388, 570] }),
];
/** ع غ — the head from its top-right tip round to the left, out to the right, then back down-left round the bowl. */
const AIN = [line({ end: "top-right" }, { end: [573, 430] }, { end: [672, 786] })];
/**
 * ف ق و — the head first: from where it meets the stem (bottom-right of the
 * head), left along its bottom, up the left side, over the top and down the
 * right side back to the start (clockwise), then on along the line / down the tail.
 */
const headLoop = (fork, bottom, left, top) => [{ fork }, { at: bottom }, { at: left }, { at: top }, { fork }];
const FA = [line(...headLoop([777, 450], [672, 484], [609, 375], [688, 284]), { end: "left" })];
const QAF = [line(...headLoop([706, 516], [625, 523], [544, 430], [617, 352]), { end: "left" })];
const WAW = [line(...headLoop([583, 570], [484, 570], [425, 500], [508, 398]), { end: "bottom" })];
/**
 * ه — drawn as the round heh children are taught (ە, see letters.mjs): one
 * stroke from the pointed tip at the top, right and down the right side, left
 * along the bottom, up the left side and closed back at the top (clockwise —
 * the Commons animation and Sakkal's chart agree). No tail, no retracing.
 */
const HA = [line({ apex: "top" }, { at: [500, 350] }, { at: [600, 471] }, { at: [500, 564] }, { at: [414, 486] }, { at: [500, 350] })];

export const RECIPES = {
  alif: [ends("top", "bottom")],
  ba: BOWL, ta: BOWL, tha: BOWL,
  jeem: JEEM, hha: JEEM, kha: JEEM,
  dal: DAL, thal: DAL,
  ra: RA, zay: RA,
  seen: SEEN, sheen: SEEN,
  sad: SAD, dad: SAD,
  tta: TTA, zza: TTA,
  ain: AIN, ghain: AIN,
  fa: FA,
  qaf: QAF,
  kaf: [ends("top", "left"), { comp: "mark", via: [{ end: "top-right" }, { end: "bottom-left" }] }],
  lam: [ends("top", "left")],
  meem: [ends("top", "bottom")],
  noon: [ends("right", "left")],
  ha: HA,
  waw: WAW,
  ya: [ends("top-right", "left")],
};
