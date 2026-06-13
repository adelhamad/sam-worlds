import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { playPitch, sfx, unlockAudio } from "../../engine/feedback/audio";
import { mulberry32, newSeed, type RNG } from "../../engine/rng";
import {
  buildGoldenWave,
  buildWave,
  CRITTERS,
  pickTrait,
  reshuffleSlots,
  TRAIT_PALETTE,
  wrongTapFact,
  type Critter,
  type Trait,
  type WaveSlot,
} from "../../engine/critters";
import { CritterScene } from "../../three/CritterScene";

const SHIELDS = 3;
const MAX_PAYOUT = 40;
const COMBO_X2_AT = 5;
const GOLDEN_EVERY = 4; // every Nth wave is a golden rush

interface Run {
  rng: RNG;
  waveIdx: number;
  trait: Trait;
  ask: string;
  golden: boolean;
  pending: WaveSlot[];
  alive: Map<number, WaveSlot>;
  shownThisWave: Critter[];
  recent: Critter[];
  spawnAcc: number;
  betweenWaves: number;
  nextId: number;
  score: number;
  combo: number;
  shields: number;
  newDex: string[];
  over: boolean;
}

/** Critter Current — tap ONLY the animals that match the guardian's call. */
export function CritterCurrent() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);
  const best = useGame((s) => s.critterBest);
  const dex = useGame((s) => s.critterDex);
  const reportCritterScore = useGame((s) => s.reportCritterScore);
  const addCritterDex = useGame((s) => s.addCritterDex);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CritterScene | null>(null);
  const runRef = useRef<Run | null>(null);
  const onTickRef = useRef<(dt: number) => void>(() => {});
  const dexRef = useRef(new Set<string>());

  const onTapRef = useRef<(id: number) => void>(() => {});
  const onPassedRef = useRef<(id: number) => void>(() => {});

  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [hud, setHud] = useState({ ask: "", score: 0, shields: SHIELDS, combo: 0, golden: false });
  const [toast, setToast] = useState<{ text: string; kind: "teach" | "miss" | "new" } | null>(null);
  const [startBest, setStartBest] = useState(0);
  const [newDex, setNewDex] = useState<string[]>([]);

  // Mount the 3D river once (StrictMode-safe).
  useEffect(() => {
    if (!hostRef.current) return;
    const scene = CritterScene.create(hostRef.current);
    scene.onTick = (dt) => onTickRef.current(dt);
    scene.onTap = (id) => onTapRef.current(id);
    scene.onPassed = (id) => onPassedRef.current(id);
    scene.start();
    sceneRef.current = scene;
    return () => {
      sceneRef.current = null;
      scene.destroy();
    };
  }, []);

  function syncHud(r: Run) {
    setHud({ ask: r.ask, score: r.score, shields: r.shields, combo: r.combo, golden: r.golden });
  }

  function flashToast(text: string, kind: "teach" | "miss" | "new") {
    setToast({ text, kind });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), kind === "teach" ? 2600 : 1400);
  }

  function startWave(r: Run) {
    r.waveIdx += 1;
    r.golden = r.waveIdx % GOLDEN_EVERY === 0;
    const trait = pickTrait(r.rng, r.trait);
    const wave = r.golden ? buildGoldenWave(r.rng, trait) : buildWave(r.rng, trait, r.recent);
    r.trait = wave.trait;
    r.ask = wave.ask;
    r.pending = [...wave.slots];
    r.shownThisWave = wave.slots.map((s) => s.critter);
    r.alive.clear();
    r.spawnAcc = -0.8; // a breath while the banner shows
    sceneRef.current?.setPalette(TRAIT_PALETTE[wave.trait]);
    // Flow quickens only gently and caps low, so later waves never rush the
    // tap window (it used to more than double, leaving little reaction time).
    sceneRef.current!.flow = Math.min(1.5, 1 + r.waveIdx * 0.03);
    syncHud(r);
  }

  function onTick(dt: number) {
    const r = runRef.current;
    if (!r || r.over) return;
    if (r.pending.length === 0 && r.alive.size === 0) {
      r.betweenWaves += dt;
      if (r.betweenWaves > 0.9) {
        r.betweenWaves = 0;
        r.recent = r.shownThisWave.slice(0, 5);
        startWave(r);
      }
      return;
    }
    r.spawnAcc += dt;
    const gap = Math.max(1.1, 1.7 - r.waveIdx * 0.03);
    if (r.pending.length > 0 && r.spawnAcc >= gap) {
      r.spawnAcc = 0;
      const slot = r.pending.shift()!;
      const id = r.nextId++;
      r.alive.set(id, slot);
      sceneRef.current?.spawn(id, slot.critter.emoji, slot.golden);
    }
  }

  function endRun(r: Run) {
    r.over = true;
    syncHud(r);
    setPhase("done");
  }

  function handleTap(id: number) {
    const r = runRef.current;
    const scene = sceneRef.current;
    if (!r || r.over || !scene) return;
    const slot = r.alive.get(id);
    if (!slot) return;
    if (slot.isMatch) {
      r.alive.delete(id);
      scene.pop(id, true);
      r.combo += 1;
      const mult = r.combo >= COMBO_X2_AT ? 2 : 1;
      r.score += (slot.golden ? 15 : 10) * mult;
      sfx.correct();
      playPitch(380 * Math.pow(1.059, Math.min(r.combo, 14)), 0.18);
      if (!dexRef.current.has(slot.critter.name)) {
        dexRef.current.add(slot.critter.name);
        r.newDex.push(slot.critter.name);
        addCritterDex([slot.critter.name]);
        flashToast(`📔 NEW critter: ${slot.critter.emoji} ${slot.critter.name}!`, "new");
      }
      syncHud(r);
      return;
    }
    // wrong tap: teach the distinguishing fact, then reshuffle what's left
    scene.pop(id, false);
    r.alive.delete(id);
    sfx.wrong();
    r.combo = 0;
    r.shields -= 1;
    flashToast(wrongTapFact(slot.critter, r.trait), "teach");
    if (r.shields <= 0) {
      endRun(r);
      return;
    }
    // rule 1: never let elimination win — replace the rest of the wave
    const aliveIds = [...r.alive.keys()];
    const replaceCount = r.alive.size + r.pending.length;
    scene.clear(aliveIds);
    r.alive.clear();
    r.pending = reshuffleSlots(r.rng, r.trait, r.shownThisWave, replaceCount);
    r.shownThisWave.push(...r.pending.map((s) => s.critter));
    r.spawnAcc = 0;
    syncHud(r);
  }

  function handlePassed(id: number) {
    const r = runRef.current;
    if (!r || r.over) return;
    const slot = r.alive.get(id);
    if (!slot) return;
    r.alive.delete(id);
    if (slot.isMatch) {
      r.combo = 0;
      flashToast(`💨 The ${slot.critter.name} got away!`, "miss");
      syncHud(r);
    }
  }

  // Keep the scene's callbacks pointed at the latest game logic.
  useEffect(() => {
    onTickRef.current = onTick;
    onTapRef.current = handleTap;
    onPassedRef.current = handlePassed;
  });

  // Pay out + record when the run ends.
  useEffect(() => {
    if (phase !== "done") return;
    const r = runRef.current;
    if (!r) return;
    setNewDex(r.newDex);
    const payout = Math.min(Math.round(r.score / 8), MAX_PAYOUT);
    if (payout > 0) earnDust(payout, "critter-current");
    reportCritterScore(r.score);
    sfx.stageComplete();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    unlockAudio();
    sfx.tap();
    dexRef.current = new Set(dex);
    const r: Run = {
      rng: mulberry32(newSeed()),
      waveIdx: 0,
      trait: "mammal",
      ask: "",
      golden: false,
      pending: [],
      alive: new Map(),
      shownThisWave: [],
      recent: [],
      spawnAcc: 0,
      betweenWaves: 0,
      nextId: 1,
      score: 0,
      combo: 0,
      shields: SHIELDS,
      newDex: [],
      over: false,
    };
    runRef.current = r;
    setStartBest(best);
    setNewDex([]);
    sceneRef.current?.clear();
    startWave(r);
    setPhase("play");
  }

  return (
    <div className="screen stage-play surf-screen">
      <div className="pixi-host" ref={hostRef} />

      <header className="stage-header">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Base
        </Link>
        <span className="stage-title">🦉 Critter Current</span>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      {phase === "play" && (
        <div className="surf-hud">
          <div key={hud.ask} className={`surf-word surf-ask critter-ask ${hud.golden ? "critter-golden" : ""}`}>{hud.ask}</div>
          <div className="rush-hud">
            <span className="catch-stat">{"🛡️".repeat(hud.shields)}</span>
            <span className="catch-stat">⭐ {hud.score}</span>
            {hud.combo >= COMBO_X2_AT && <span className="catch-stat rush-combo">🔥 ×2</span>}
            <span className="catch-stat dim">📔 {dex.length}/{CRITTERS.length}</span>
          </div>
          {toast && <span className={`surf-zone critter-toast critter-toast-${toast.kind}`}>{toast.text}</span>}
        </div>
      )}

      {phase === "intro" && (
        <div className="overlay">
          <div className="panel celebration-card">
            <h2>🦉 Critter Current</h2>
            <p className="catch-howto">A magical river of animal bubbles!</p>
            <p className="catch-howto dim">Listen to the call — tap ONLY the animals that match. Let the others float by!</p>
            <p className="catch-howto dim">Watch for tricksters: a bat is not a bird… 🦇</p>
            <p className="catch-howto">📔 Critterdex: {dex.length}/{CRITTERS.length} discovered{best > 0 ? ` · 🏆 Best: ${best}` : ""}</p>
            <button className="btn btn-primary btn-big" onClick={start}>
              Dive in!
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>{hud.score > startBest && hud.score > 0 ? "🏆 NEW BEST RUN!" : "The river thanks you!"}</h2>
            <div className="payout">
              ⭐ {hud.score} → +{Math.min(Math.round(hud.score / 8), MAX_PAYOUT)} ✨
            </div>
            {newDex.length > 0 && (
              <p className="catch-howto">
                📔 NEW critters:{" "}
                {newDex.map((n) => CRITTERS.find((c) => c.name === n)?.emoji ?? "").join(" ")}
              </p>
            )}
            <p className="catch-howto dim">
              📔 {dex.length}/{CRITTERS.length} discovered · 🏆 Best: {Math.max(best, hud.score)}
            </p>
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
                Dive Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
