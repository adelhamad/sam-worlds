import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { mulberry32, newSeed, pick, randInt, shuffle, type RNG } from "../../engine/rng";
import { WordSurfScene } from "../../three/WordSurfScene";

const MAX_PAYOUT = 40;
const SHIELDS = 3;
const ALPHA = "ABCDEFGHIJKLMNOPRSTUVWY";

// [word, emoji] — spelled letter by letter; long ones are the real challenge.
const WORDS: Array<[string, string]> = [
  ["STAR", "⭐"], ["MOON", "🌙"], ["FISH", "🐟"], ["FROG", "🐸"], ["CAKE", "🍰"], ["TREE", "🌳"],
  ["BEAR", "🐻"], ["LION", "🦁"], ["SHIP", "🚢"], ["KITE", "🪁"], ["DUCK", "🦆"], ["CROWN", "👑"],
  ["ROBOT", "🤖"], ["TRAIN", "🚂"], ["APPLE", "🍎"], ["HOUSE", "🏠"], ["SNAKE", "🐍"], ["HORSE", "🐴"],
  ["TIGER", "🐯"], ["PLANE", "✈️"], ["CLOUD", "☁️"], ["SHARK", "🦈"], ["QUEEN", "👸"], ["PIZZA", "🍕"],
  ["GHOST", "👻"], ["CANDY", "🍬"], ["WHALE", "🐋"], ["MOUSE", "🐭"], ["PANDA", "🐼"], ["CASTLE", "🏰"],
  ["ROCKET", "🚀"], ["DRAGON", "🐉"], ["BANANA", "🍌"], ["MONKEY", "🐵"], ["SPIDER", "🕷️"], ["WIZARD", "🧙"],
  ["PIRATE", "🏴‍☠️"], ["DOLPHIN", "🐬"], ["PENGUIN", "🐧"], ["RAINBOW", "🌈"], ["UNICORN", "🦄"], ["VOLCANO", "🌋"],
  ["OCTOPUS", "🐙"], ["DINOSAUR", "🦕"], ["MOUNTAIN", "⛰️"], ["TREASURE", "💰"],
];

const RHYMES: string[][] = [
  ["CAT", "HAT", "BAT", "MAT"], ["DOG", "LOG", "FROG", "FOG"], ["STAR", "CAR", "JAR", "FAR"],
  ["CAKE", "LAKE", "SNAKE", "RAKE"], ["BALL", "WALL", "TALL", "FALL"], ["TREE", "BEE", "KEY", "SEA"],
  ["LIGHT", "NIGHT", "KITE", "BRIGHT"], ["RING", "KING", "SING", "WING"], ["RAIN", "TRAIN", "BRAIN", "CHAIN"],
  ["GOAT", "BOAT", "COAT", "NOTE"], ["SNOW", "GROW", "SLOW", "GLOW"], ["ROCK", "SOCK", "CLOCK", "BLOCK"],
];

const CATEGORIES: Array<[string, string[]]> = [
  ["ANIMAL", ["TIGER", "WHALE", "EAGLE", "SNAKE", "PANDA", "CAMEL"]],
  ["FOOD", ["BREAD", "MANGO", "PIZZA", "SALAD", "HONEY", "PASTA"]],
  ["COLOR", ["GREEN", "PURPLE", "YELLOW", "ORANGE", "PINK", "BROWN"]],
  ["BODY PART", ["ELBOW", "ANKLE", "FINGER", "SHOULDER", "KNEE", "WRIST"]],
  ["VEHICLE", ["TRUCK", "PLANE", "BOAT", "TRAIN", "SCOOTER", "ROCKET"]],
];

const OPPOSITES: Array<[string, string, string[]]> = [
  ["HOT", "COLD", ["WARM", "WET"]], ["BIG", "SMALL", ["TALL", "WIDE"]], ["FAST", "SLOW", ["QUICK", "FAR"]],
  ["UP", "DOWN", ["OVER", "OUT"]], ["DAY", "NIGHT", ["NOON", "SUN"]], ["HAPPY", "SAD", ["GLAD", "MAD"]],
  ["OPEN", "CLOSED", ["WIDE", "EMPTY"]], ["LOUD", "QUIET", ["NOISY", "SOFT"]], ["FULL", "EMPTY", ["HEAVY", "DEEP"]],
  ["EASY", "HARD", ["SIMPLE", "TINY"]],
];

type Zone = "spell" | "missing" | "rhyme" | "category" | "opposite";
const ZONE_INFO: Record<Zone, { name: string; color: number }> = {
  spell: { name: "✨ SPELL IT", color: 0xffb454 },
  missing: { name: "🕳️ MISSING LETTER", color: 0x22d3ee },
  rhyme: { name: "🎵 RHYME TIME", color: 0xa78bfa },
  category: { name: "🗂️ CATCH THE…", color: 0x4ade80 },
  opposite: { name: "🔃 OPPOSITES", color: 0xf472b6 },
};
const ZONE_CYCLE: Zone[] = ["spell", "rhyme", "missing", "category", "opposite"];
const GATES_PER_ZONE = 3;

interface Task {
  ask: string; // HUD line (empty for spell — the word bar shows instead)
  labels: string[];
  correct: string;
  points: number;
}

interface RunState {
  rng: RNG;
  zoneIdx: number;
  gatesInZone: number;
  word: string;
  emoji: string;
  collected: number;
  task: Task;
  lane: number;
  score: number;
  shields: number;
}

const zoneOf = (r: RunState): Zone => ZONE_CYCLE[r.zoneIdx % ZONE_CYCLE.length];

function spellTask(r: RunState): Task {
  const need = r.word[r.collected];
  const wrongs = shuffle(r.rng, [...ALPHA].filter((c) => c !== need)).slice(0, 2);
  return { ask: "", labels: shuffle(r.rng, [need, ...wrongs]), correct: need, points: 1 };
}

function missingTask(r: RunState): Task {
  const [word, emoji] = pick(r.rng, WORDS);
  const hole = randInt(r.rng, 0, word.length - 1);
  const correct = word[hole];
  const shown = [...word].map((c, i) => (i === hole ? "_" : c)).join("");
  const wrongs = shuffle(r.rng, [...ALPHA].filter((c) => c !== correct)).slice(0, 2);
  return { ask: `${emoji} ${shown}`, labels: shuffle(r.rng, [correct, ...wrongs]), correct, points: 2 };
}

function rhymeTask(r: RunState): Task {
  const fam = pick(r.rng, RHYMES);
  const target = fam[0];
  const correct = pick(r.rng, fam.slice(1));
  const wrongs = shuffle(r.rng, RHYMES.filter((f) => f !== fam).flat()).slice(0, 2);
  return { ask: `Rhymes with ${target}?`, labels: shuffle(r.rng, [correct, ...wrongs]), correct, points: 2 };
}

function categoryTask(r: RunState): Task {
  const [cat, members] = pick(r.rng, CATEGORIES);
  const correct = pick(r.rng, members);
  const others = CATEGORIES.filter(([c]) => c !== cat).flatMap(([, m]) => m);
  const wrongs = shuffle(r.rng, others).slice(0, 2);
  return { ask: `Catch the ${cat}!`, labels: shuffle(r.rng, [correct, ...wrongs]), correct, points: 2 };
}

function oppositeTask(r: RunState): Task {
  const [word, correct, traps] = pick(r.rng, OPPOSITES);
  return { ask: `Opposite of ${word}?`, labels: shuffle(r.rng, [correct, ...traps]), correct, points: 2 };
}

function makeTask(r: RunState): Task {
  switch (zoneOf(r)) {
    case "missing":
      return missingTask(r);
    case "rhyme":
      return rhymeTask(r);
    case "category":
      return categoryTask(r);
    case "opposite":
      return oppositeTask(r);
    default:
      return spellTask(r);
  }
}

function nextWord(r: RunState): void {
  const [word, emoji] = pick(r.rng, WORDS);
  r.word = word;
  r.emoji = emoji;
  r.collected = 0;
}

/** Word Surfer — an endless 3D word run through rotating learning zones. */
export function WordSurf() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);
  const best = useGame((s) => s.surfBest);
  const reportSurfScore = useGame((s) => s.reportSurfScore);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<WordSurfScene | null>(null);
  const runRef = useRef<RunState | null>(null);

  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [hud, setHud] = useState({ zone: "spell" as Zone, ask: "", word: "", emoji: "", collected: 0, score: 0, shields: SHIELDS });
  const [startBest, setStartBest] = useState(0);

  // Mount the 3D scene once (StrictMode-safe).
  useEffect(() => {
    if (!hostRef.current) return;
    const scene = WordSurfScene.create(hostRef.current);
    sceneRef.current = scene;
    return () => {
      sceneRef.current = null;
      scene.destroy();
    };
  }, []);

  function syncHud(r: RunState) {
    setHud({ zone: zoneOf(r), ask: r.task.ask, word: r.word, emoji: r.emoji, collected: r.collected, score: r.score, shields: r.shields });
  }

  function spawn(r: RunState) {
    r.task = makeTask(r);
    sceneRef.current?.spawnRow(r.task.labels, ZONE_INFO[zoneOf(r)].color, randInt(r.rng, 0, 2));
    syncHud(r);
  }

  function advanceZone(r: RunState) {
    r.gatesInZone += 1;
    const inSpell = zoneOf(r) === "spell";
    const spellDone = inSpell && r.collected >= r.word.length;
    if (spellDone) {
      r.score += r.word.length; // word bonus
      sfx.perfect();
      sceneRef.current?.celebrate(0x22d3ee);
      nextWord(r);
    }
    // spell zone hands over after a finished word; quiz zones after N gates
    if ((inSpell && spellDone) || (!inSpell && r.gatesInZone >= GATES_PER_ZONE)) {
      r.zoneIdx += 1;
      r.gatesInZone = 0;
      if (zoneOf(r) === "spell") nextWord(r);
    }
  }

  function resolveArrival() {
    const r = runRef.current;
    const scene = sceneRef.current;
    if (!r || !scene) return;
    const hitCorrect = r.task.labels[r.lane] === r.task.correct;
    if (hitCorrect) {
      sfx.correct();
      r.score += r.task.points;
      if (zoneOf(r) === "spell") r.collected += 1;
      scene.celebrate();
      advanceZone(r);
    } else {
      sfx.wrong();
      scene.flashWrong();
      r.shields -= 1;
    }
    if (r.shields <= 0) {
      syncHud(r);
      scene.stop();
      setPhase("done");
      return;
    }
    scene.speed = Math.min(40, 16 + r.score * 0.5);
    spawn(r); // a miss never replays the same gates (rule 1)
  }

  function steer(lane: number) {
    const r = runRef.current;
    if (!r) return;
    r.lane = Math.max(0, Math.min(2, lane));
    sceneRef.current?.setLane(r.lane);
  }

  // Keyboard for desktop testing.
  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      const r = runRef.current;
      if (!r) return;
      if (e.key === "ArrowLeft") steer(r.lane - 1);
      if (e.key === "ArrowRight") steer(r.lane + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  // Pay out at the end of the run.
  useEffect(() => {
    if (phase !== "done") return;
    const r = runRef.current;
    if (!r) return;
    const payout = Math.min(r.score, MAX_PAYOUT);
    if (payout > 0) earnDust(payout, "word-surf");
    reportSurfScore(r.score);
    sfx.stageComplete();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    unlockAudio();
    sfx.tap();
    const scene = sceneRef.current;
    if (!scene) return;
    const r: RunState = {
      rng: mulberry32(newSeed()),
      zoneIdx: 0,
      gatesInZone: 0,
      word: "",
      emoji: "",
      collected: 0,
      task: { ask: "", labels: [], correct: "", points: 1 },
      lane: 1,
      score: 0,
      shields: SHIELDS,
    };
    nextWord(r);
    runRef.current = r;
    setStartBest(best);
    scene.onArrive = resolveArrival;
    scene.onStar = (collected) => {
      const run = runRef.current;
      if (!collected || !run) return;
      sfx.tap();
      run.score += 1;
      sceneRef.current?.celebrate();
      syncHud(run);
    };
    scene.speed = 16;
    scene.setLane(1);
    scene.start();
    setPhase("play");
    spawn(r);
  }

  const spelled = hud.word.slice(0, hud.collected);
  const todo = hud.word.slice(hud.collected);

  return (
    <div className="screen stage-play surf-screen">
      <div
        className="pixi-host"
        ref={hostRef}
        onPointerDown={(e) => {
          if (phase !== "play") return;
          steer(Math.floor((e.clientX / window.innerWidth) * 3));
        }}
      />

      <header className="stage-header">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Base
        </Link>
        <span className="stage-title">🏄 Word Surfer</span>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      {phase === "play" && (
        <div className="surf-hud">
          <span key={hud.zone} className="surf-zone">
            {ZONE_INFO[hud.zone].name}
          </span>
          {hud.zone === "spell" ? (
            <div className="surf-word">
              <span className="surf-emoji">{hud.emoji}</span>
              <span className="surf-spelled">{spelled}</span>
              <span className="surf-todo">{todo}</span>
            </div>
          ) : (
            <div className="surf-word surf-ask">{hud.ask}</div>
          )}
          <div className="rush-hud">
            <span className="catch-stat">{"🛡️".repeat(hud.shields)}</span>
            <span className="catch-stat">⭐ {hud.score}</span>
            <span className="catch-stat dim">🏆 {Math.max(best, hud.score)}</span>
          </div>
        </div>
      )}

      {phase === "intro" && (
        <div className="overlay">
          <div className="panel celebration-card">
            <h2>🏄 Word Surfer</h2>
            <p className="catch-howto">An endless 3D word run!</p>
            <p className="catch-howto dim">Surf through the RIGHT gate — spell words, find rhymes, catch categories, crack opposites.</p>
            <p className="catch-howto dim">Grab ⭐ bonus stars on the way. 3 shields. Faster and faster!</p>
            {best > 0 && <p className="catch-howto">🏆 Best run: {best}</p>}
            <button className="btn btn-primary btn-big" onClick={start}>
              Surf!
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>{hud.score > startBest && hud.score > 0 ? "🏆 NEW BEST RUN!" : "Cowabunga!"}</h2>
            <div className="payout">
              ⭐ {hud.score} → +{Math.min(hud.score, MAX_PAYOUT)} ✨
            </div>
            <p className="catch-howto dim">🏆 Best: {Math.max(best, hud.score)}</p>
            <div className="celebration-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  sfx.tap();
                  navigate("/hub");
                }}
              >
                ← Base
              </button>
              <button className="btn btn-primary" onClick={start}>
                Surf Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
