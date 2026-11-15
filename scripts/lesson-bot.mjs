// Lesson bot — plays one course lesson through the REAL UI in a headless
// browser, the way a child would (taps on the widgets' test ids), and reports
// what happened. Use it to prove a course works end to end.
//
//   bun run bot -- --course tick               first lesson of Tick Tock
//   bun run bot -- --course chess --lesson 9   the 9th lesson (earlier ones are marked done)
//   bun run bot -- --course code --miss 1,3    miss the 2nd and 4th answers on purpose
//   bun run bot -- --course tour --shots /tmp/shots --w 820 --h 1180
//
// It starts its own dev server (or uses --port of one that is running) and
// needs Chrome/Chromium (set CHROME_PATH if it is not in a usual place).
// Exit code 0 = the lesson finished with no page errors.
import { spawn } from "node:child_process";
import fs from "node:fs";
import puppeteer from "puppeteer-core";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const courseId = arg("course", "tour");
const lessonNumber = Number(arg("lesson", 1));
const width = Number(arg("w", 390));
const height = Number(arg("h", 800));
const shotDir = arg("shots", "");
/** --sheets 1: also photograph every feedback sheet (needs --shots). */
const sheetShots = arg("sheets", "") !== "";
const missAt = new Set(String(arg("miss", "")).split(",").filter(Boolean).map(Number));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  const found = candidates.find((path) => path && fs.existsSync(path));
  if (!found) throw new Error("Chrome not found — set CHROME_PATH");
  return found;
}

async function reachable(port) {
  try {
    return (await fetch(`http://localhost:${port}/`)).ok;
  } catch {
    return false;
  }
}

/** Use the dev server on --port, or start one on a spare port. */
async function devServer() {
  const given = arg("port", "");
  if (given) return { port: Number(given), stop: () => {} };
  const port = 5300 + Math.floor(Math.random() * 200);
  // Dev tool: runs the project's own vite through bunx.
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  const child = spawn("bunx", ["vite", "--port", String(port), "--strictPort"], { stdio: "ignore" });
  for (let i = 0; i < 60 && !(await reachable(port)); i++) await sleep(250);
  return { port, stop: () => child.kill() };
}

const server = await devServer();
const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 2, hasTouch: true });
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(`PAGEERROR ${error.message}`));

let shotCount = 0;
async function shot(name) {
  if (!shotDir) return;
  fs.mkdirSync(shotDir, { recursive: true });
  shotCount += 1;
  await page.screenshot({ path: `${shotDir}/${String(shotCount).padStart(2, "0")}-${name}.png` });
}

/** Click the first element matching the selector (works for HTML and SVG). */
const tap = (selector) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (!el) return false;
  if (typeof el.click === "function") el.click();
  else el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  return true;
}, selector);
const tid = (id) => tap(`[data-testid="${id}"]`);
const tapText = (text) => page.evaluate((needle) => {
  const el = [...document.querySelectorAll("button,a")].find((item) => !item.disabled && item.textContent.trim().toLowerCase().includes(needle));
  if (el) el.click();
  return Boolean(el);
}, text.toLowerCase());

const session = () => page.evaluate(() => {
  const state = window.__game?.getState();
  const s = state?.session;
  return s ? { index: s.index, total: s.questions.length, question: s.questions[s.index], result: s.result } : null;
});

// ------------------------------------------------------------- solvers

/** Indices of `tiles` that spell `target` when joined (depth-first). */
function spell(tiles, target, glue = "") {
  const used = new Set();
  const out = [];
  const go = (rest) => {
    if (!rest) return true;
    for (let i = 0; i < tiles.length; i++) {
      const piece = tiles[i] + glue;
      const fits = rest === tiles[i] || rest.startsWith(piece);
      if (used.has(i) || !fits) continue;
      used.add(i);
      out.push(i);
      if (go(rest === tiles[i] ? "" : rest.slice(piece.length))) return true;
      used.delete(i);
      out.pop();
    }
    return false;
  };
  return go(target) ? out : [];
}

/** "Bucket:a,b|Other:c" → { a: "Bucket", b: "Bucket", c: "Other" } */
function sortMap(answer) {
  const map = {};
  for (const part of answer.split("|")) {
    const cut = part.indexOf(":");
    for (const id of part.slice(cut + 1).split(",").filter(Boolean)) map[id] = part.slice(0, cut);
  }
  return map;
}

const SOLVERS = {
  // ---- geography
  pick: async (q, p) => tid(`pick-${p.code}`),
  map: async (q, p) => (await tid(`map-hit-${p.code}`)) || tid(`map-${p.code}`),
  build: async (q, p) => { for (const i of spell(p.tiles, q.answer)) { await tid(`build-tile-${i}`); await sleep(150); } },
  paint: async (q) => {
    const colors = q.answer.split(",");
    for (let i = 0; i < colors.length; i++) { await tid(`paint-pot-${colors[i]}`); await sleep(80); await tid(`paint-band-${i}`); await sleep(120); }
  },
  sort: async (q, p) => {
    const map = sortMap(q.answer);
    for (const code of p.cards) { await tid(`sort-card-${code}`); await sleep(100); await tid(`sort-bucket-${map[code]}`); await sleep(140); }
  },
  pairs: async (q, p) => {
    for (const code of p.left) { await tid(`pair-L-${code}`); await sleep(120); await tid(`pair-R-${code}`); await sleep(420); }
    await sleep(900);
  },
  // ---- chess
  "chess-spot": async (q) => { for (const sq of q.answer.split(",")) { await tid(`sq-${sq}`); await sleep(120); } },
  "chess-count": async (q) => { for (const digit of q.answer) { await tid(`num-${digit}`); await sleep(120); } },
  "chess-place": async (q, p) => {
    const used = new Set();
    for (let j = 0; j < 8; j++) {
      if (q.answer[j] === "." || p.row[j]) continue;
      const i = p.tray.findIndex((type, index) => type === q.answer[j] && !used.has(index));
      if (i < 0) continue;
      used.add(i);
      await tid(`tray-${i}`); await sleep(150); await tid(`home-${j}`); await sleep(200);
    }
  },
  "chess-mission": async (q, p) => {
    for (const move of p.solution) {
      await tid(`sq-${move.from}`); await sleep(250);
      const armed = await page.evaluate((to) => Boolean(document.querySelector(`[data-sq="${to}"][data-go]`)), move.to);
      if (!armed) { await tid(`sq-${move.from}`); await sleep(250); }
      await tid(`sq-${move.to}`); await sleep(650);
    }
    await sleep(1400);
  },
  // ---- languages
  "lang-choose": async (q) => tid(`lang-opt-${q.answer}`),
  "lang-pairs": async (q, p) => { for (const card of p.left) { await tid(`lang-left-${card.id}`); await sleep(160); await tid(`lang-right-${card.id}`); await sleep(560); } await sleep(500); },
  "lang-build": async (q, p) => {
    for (const part of p.unit === "word" ? q.answer.split(" ") : Array.from(q.answer)) {
      await page.evaluate((text) => [...document.querySelectorAll("[data-testid^=lang-tile-]")].find((el) => el.dataset.text === text && !el.disabled)?.click(), part);
      await sleep(160);
    }
  },
  "lang-trace": async () => { await tid("lang-trace-done"); await sleep(400); },
  // ---- course kit
  "kit-pick": async (q) => tid(`kit-opt-${q.answer}`),
  "kit-number": async (q) => { for (const digit of q.answer) { await tid(`num-${digit}`); await sleep(120); } },
  "kit-order": async (q) => { for (const id of q.answer.split(">")) { await tid(`kit-card-${id}`); await sleep(220); } },
  "kit-sort": async (q, p) => {
    const map = sortMap(q.answer);
    for (const card of p.cards) { await tid(`kit-card-${card.id}`); await sleep(120); await tid(`kit-bucket-${map[card.id]}`); await sleep(160); }
  },
  "kit-build": async (q, p) => { for (const i of spell(p.tiles, q.answer, " ")) { await tid(`kit-tile-${i}`); await sleep(150); } },
  "kit-pairs": async (q, p) => {
    for (const item of p.left) { await tid(`kit-left-${item.id}`); await sleep(120); await tid(`kit-right-${item.id}`); await sleep(420); }
    await sleep(900);
  },
  // ---- tick tock
  "tick-read": async (q) => {
    const [hour, minute] = q.answer.split(":");
    for (const digit of hour) { await tid(`tick-pad-${digit}`); await sleep(140); }
    const shown = () => page.evaluate(() => document.querySelector('[data-testid="tick-display"]')?.getAttribute("data-value"));
    if ((await shown()) === q.answer) return; // whole-hour lessons fill the minutes themselves
    await tid("tick-field-minute"); await sleep(140);
    for (const digit of minute) { await tid(`tick-pad-${digit}`); await sleep(140); }
  },
  // The hands are dragged by a finger; in DEV the clock also accepts this event.
  "tick-set": async (q) => {
    const [hour, minute] = q.answer.split(":").map(Number);
    await page.evaluate((detail) => {
      document.querySelector('[data-testid="tick-clock"]')?.dispatchEvent(new CustomEvent("tick-set", { detail }));
    }, { hour, minute });
    await sleep(300);
  },
  // ---- code lab
  "code-trace": async (q) => tid(`code-sq-${q.answer}`),
  "code-run": async (q, p) => {
    for (const block of p.solution) {
      if (typeof block === "string") { await tid(`code-add-${block}`); await sleep(140); continue; }
      await tid(`code-loop-${block.times}`); await sleep(160);
      for (const dir of block.body) { await tid(`code-add-${dir}`); await sleep(140); }
      await tid("code-loop-done"); await sleep(140);
    }
    await tid("code-run");
    await waitForRun();
  },
  "code-debug": async (q, p) => {
    for (let i = 0; i < p.program.length; i++) {
      const before = p.program[i];
      const after = p.solution[i];
      if (typeof before === "string") {
        if (before !== after) { await tid(`code-block-${i}`); await sleep(200); await tid(`code-pick-${after}`); await sleep(200); }
        continue;
      }
      for (let j = 0; j < before.body.length; j++) {
        if (before.body[j] === after.body[j]) continue;
        await tid(`code-block-${i}-${j}`); await sleep(200); await tid(`code-pick-${after.body[j]}`); await sleep(200);
      }
    }
    await tid("code-run");
    await waitForRun();
  },
};

/** Self-submitting code widgets report on their own once the run animation ends. */
async function waitForRun() {
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    if (await page.evaluate(() => Boolean(document.querySelector(".tl-sheet")))) return;
  }
}

/** CONTINUE / GOT IT on the feedback sheet (never an answer card that happens to say "continue"). */
const SHEET_BUTTON = ".tl-sheet .tl-main-btn:not(:disabled)";
const SELF_SUBMITTING = new Set(["pairs", "kit-pairs", "chess-mission", "code-run", "code-debug", "lang-pairs", "lang-trace"]);

/** Tap through a gift or a cheer if one is showing. */
async function passInterludes() {
  for (let i = 0; i < 6; i++) {
    const kind = await page.evaluate(() => {
      if (document.querySelector(".tl-gift")) return "gift";
      return document.querySelector(".tl-cheer") ? "cheer" : null;
    });
    if (!kind) return;
    await sleep(500);
    await shot(kind);
    if (kind === "gift") { await tap(".tl-gift-box"); await sleep(900); await tap(".tl-gift-go"); await sleep(700); } else { await sleep(900); await tap(".tl-cheer"); await sleep(600); }
  }
}

/** Skip any opening demo (country cards, chess / code demo, kit slides). */
async function passOpening() {
  for (let i = 0; i < 8; i++) {
    const s = await session();
    const widget = await page.evaluate(() => Boolean(document.querySelector(".tl-exercise")));
    if (!s || widget) return;
    const started = (await tid("kit-meet-skip")) || (await tid("lang-meet-skip")) || (await tid("code-meet-start")) || (await tid("tick-meet-start")) || (await tid("chess-meet-start"));
    if (!started) await tapText("let's go");
    await sleep(700);
  }
}

/** The lesson's top bar must stay on screen and on top, whatever the puzzle or sheet does. */
async function checkTopBar(when) {
  const bad = await page.evaluate(() => {
    const bar = document.querySelector(".tl-top");
    if (!bar) return null;
    const box = bar.getBoundingClientRect();
    const root = document.querySelector(".tour-lesson");
    const quit = bar.querySelector(".tl-quit")?.getBoundingClientRect();
    const hit = quit ? document.elementFromPoint(quit.left + quit.width / 2, quit.top + quit.height / 2) : null;
    const covered = Boolean(quit) && !bar.contains(hit);
    const scrolled = (root?.scrollTop ?? 0) !== 0 || window.scrollY !== 0;
    return box.top < 0 || covered || scrolled ? `top=${Math.round(box.top)} covered=${covered} scrolled=${scrolled}` : null;
  });
  if (bad) unsolved.push(`top bar hidden ${when}: ${bad}`);
}

/**
 * Chess missions: every star / target ring / destination dot sits dead centre in
 * its square, and the goal chip's icon does not touch its number (tolerance 2 px).
 * Animations are switched off while measuring so a bob or pop cannot fool it.
 */
async function checkChessAlign(when) {
  const bad = await page.evaluate(() => {
    const out = [];
    const still = [...document.querySelectorAll(".cb-sq > *, .cx-goal")];
    for (const el of still) el.style.animation = "none";
    const centre = (r) => [r.left + r.width / 2, r.top + r.height / 2];
    for (const sq of document.querySelectorAll(".cb-sq")) {
      for (const el of sq.querySelectorAll(":scope > .cb-star, :scope > .cb-target, :scope > .cb-dot, :scope > .cb-mark")) {
        const [ax, ay] = centre(sq.getBoundingClientRect());
        const [bx, by] = centre(el.getBoundingClientRect());
        if (Math.hypot(ax - bx, ay - by) > 2) out.push(`${el.getAttribute("class")} in square ${sq.dataset.sq} is ${Math.round(bx - ax)},${Math.round(by - ay)}px off centre`);
      }
    }
    const chip = document.querySelector(".cx-goal");
    const icon = chip?.firstElementChild;
    const num = chip?.querySelector(".cx-goal-num");
    if (icon && num) {
      const a = icon.getBoundingClientRect();
      const b = num.getBoundingClientRect();
      const wide = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const high = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (wide > 2 && high > 2) out.push(`goal chip icon overlaps its number by ${Math.round(wide)}px`);
    }
    for (const el of still) el.style.animation = "";
    return out;
  });
  for (const message of bad) unsolved.push(`chess misaligned ${when}: ${message}`);
}

// ------------------------------------------------------------------ run

const base = `http://localhost:${server.port}/#`;
const kindsSeen = new Set();
const unsolved = [];
let answers = 0;
let finished = null;
try {
  await page.goto(`${base}/hub`, { waitUntil: "networkidle0" });
  await sleep(800);
  const course = await page.evaluate(async (id) => {
    const { COURSES } = await import("/src/content/courses.ts");
    const found = COURSES.find((item) => item.id === id);
    return found ? { path: found.path, worldId: found.worldId, stages: found.world.stages.map((stage) => stage.id) } : null;
  }, courseId);
  if (!course) throw new Error(`Unknown course "${courseId}"`);
  const stageId = course.stages[lessonNumber - 1];
  if (!stageId) throw new Error(`Course "${courseId}" has no lesson ${lessonNumber}`);

  await page.goto(`${base}${course.path}`, { waitUntil: "networkidle0" });
  await sleep(900);
  if (lessonNumber > 1) {
    await page.evaluate((worldId, done) => window.__game.getState().setWorldProgress(worldId, done), course.worldId, lessonNumber - 1);
    await sleep(400);
  }
  await shot("path");
  await page.goto(`${base}${course.path}/lesson/${stageId}`, { waitUntil: "networkidle0" });
  await sleep(1200);
  await shot("opening");
  await passOpening();

  for (let guard = 0; guard < 40; guard++) {
    await passInterludes();
    const s = await session();
    if (!s || s.result) break;
    const kind = s.question.payload.tour;
    const firstOfKind = !kindsSeen.has(kind);
    kindsSeen.add(kind);
    await sleep(350);
    if (kind === "chess-mission") { await sleep(1300); await checkChessAlign(`on mission #${answers}`); }
    if (missAt.has(answers)) {
      await page.evaluate(() => window.__tourLesson.submit("bot-miss"));
      await sleep(900);
      await shot(`miss-${kind}`);
      await checkTopBar(`on the miss sheet of ${kind} (#${answers})`);
      await sleep(2600);
      if (!(await tap(SHEET_BUTTON))) unsolved.push(`no GOT IT after a miss on ${kind}`);
      await sleep(700);
      answers += 1;
      continue;
    }
    const solve = SOLVERS[kind];
    if (!solve) { unsolved.push(`no solver for ${kind}`); break; }
    await solve(s.question, s.question.payload);
    await sleep(350);
    if (firstOfKind) await shot(`q-${kind}`);
    if (!SELF_SUBMITTING.has(kind) && !(await tap(".tl-check:not(:disabled)"))) unsolved.push(`CHECK not ready for ${kind} (#${answers})`);
    await sleep(900);
    const after = await session();
    const moved = !after || after.result || after.index !== s.index || after.question.id !== s.question.id;
    if (!moved) { unsolved.push(`${kind} (#${answers}) was not accepted`); await shot(`stuck-${kind}`); break; }
    await sleep(450);
    if (sheetShots) await shot(`sheet-${answers}-${kind}`);
    await checkTopBar(`after ${kind} (#${answers})`);
    // The last right answer has no sheet: the celebration follows on its own.
    if (!after?.result && !(await tap(SHEET_BUTTON))) unsolved.push(`no CONTINUE after ${kind} (#${answers})`);
    await sleep(700);
    answers += 1;
  }
  // Pogo's entrance plays first; the results follow.
  await sleep(1200);
  await shot("entrance");
  for (let i = 0; i < 40 && !(await page.evaluate(() => Boolean(document.querySelector('[data-testid="lesson-complete"]')))); i++) await sleep(250);
  await sleep(2200);
  await shot("complete");
  finished = await page.evaluate(() => {
    const state = window.__game.getState();
    return { result: state.session?.result ?? null, starDust: state.starDust };
  });
  await tapText("continue");
  await sleep(1500);
  await shot("path-after");
} catch (error) {
  unsolved.push(String(error));
}

await browser.close();
server.stop();
const ok = Boolean(finished?.result) && unsolved.length === 0 && errors.length === 0;
console.log(JSON.stringify({
  ok, course: courseId, lesson: lessonNumber, answers, kinds: [...kindsSeen], result: finished?.result ?? null,
  starDust: finished?.starDust ?? null, problems: unsolved, pageErrors: errors.slice(0, 5),
}, null, 2));
process.exit(ok ? 0 : 1);
