import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { sfx, playPitch, unlockAudio } from "../../engine/feedback/audio";
import { mulberry32, newSeed, type RNG } from "../../engine/rng";
import { workedExample } from "../../engine/answers/answerEngine";
import {
  buildGate, BOOST_GAIN, GATES_TOTAL, LANES, MISS_GAIN, placeLabel, placeOf, RIVALS, type Gate,
} from "../../engine/racing";
import { persona } from "../../persona.config";
import { RacerScene } from "../../three/racer/RacerScene";

const MAX_PAYOUT = 50;
const PLACE_BONUS = [30, 16, 8, 0];
const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th"];

interface Run {
  rng: RNG;
  seen: Set<string>;
  gateNum: number;
  step: number;
  gate: Gate;
  busy: boolean;
  over: boolean;
  score: number;
  coins: number;
  correct: number;
  playerDist: number;
  rivalDist: number[];
}

/** Turbo Tracks — a 3D kart race. Steer into the gate with the right answer to
 * boost and overtake the rivals. */
export function TurboTracks() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);
  const best = useGame((s) => s.racerBest);
  const reportScore = useGame((s) => s.reportRacerScore);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<RacerScene | null>(null);
  const runRef = useRef<Run | null>(null);
  const onGateRef = useRef<(lane: number) => void>(() => {});
  const onCoinRef = useRef<() => void>(() => {});

  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [hud, setHud] = useState({ prompt: "", gate: 1, place: 1, score: 0, coins: 0 });
  const [line, setLine] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [result, setResult] = useState<{ place: number; correct: number; coins: number; payout: number; score: number } | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const scene = RacerScene.create(hostRef.current, RIVALS.map((r) => ({ color: r.color, emoji: r.emoji })));
    scene.onGate = (lane) => onGateRef.current(lane);
    scene.onCoin = () => onCoinRef.current();
    scene.start();
    sceneRef.current = scene;
    return () => { sceneRef.current = null; scene.destroy(); };
  }, []);

  // Keyboard steering (desktop): arrows / A,D.
  useEffect(() => {
    if (phase !== "play") return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") { sceneRef.current?.steer(-1); sfx.tap(); }
      else if (k === "arrowright" || k === "d") { sceneRef.current?.steer(1); sfx.tap(); }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [phase]);

  function syncHud(r: Run) {
    setHud({
      prompt: r.gate.question.prompt,
      gate: Math.min(GATES_TOTAL, r.gateNum + 1),
      place: placeOf(r.playerDist, r.rivalDist),
      score: r.score,
      coins: r.coins,
    });
  }

  function say(text: string, hold = 2000) {
    setLine(text);
    setTimeout(() => setLine((l) => (l === text ? null : l)), hold);
  }

  function spawnGate(r: Run) {
    r.gate = buildGate(r.rng, r.step, false, r.seen);
    r.busy = false;
    sceneRef.current?.spawnGateRow(r.gate.lanes.map((l) => l.value));
    if (r.rng() < 0.6) sceneRef.current?.spawnCoin(Math.floor(r.rng() * LANES));
    syncHud(r);
    say(`${r.gate.question.prompt} — steer to the answer!`, 2400);
  }

  function finish(r: Run) {
    r.over = true;
    sceneRef.current?.clearGate();
    const place = placeOf(r.playerDist, r.rivalDist);
    const score = r.score + r.coins + PLACE_BONUS[place - 1];
    const payout = Math.min(MAX_PAYOUT, Math.round(score / 3) + r.coins);
    if (payout > 0) earnDust(payout, "turbo-tracks");
    reportScore(score);
    if (place === 1) sfx.perfect(); else sfx.stageComplete();
    setResult({ place, correct: r.correct, coins: r.coins, payout, score });
    setPhase("done");
  }

  function onGate(lane: number) {
    const r = runRef.current;
    if (!r || r.over || r.busy) return;
    r.busy = true;
    const correct = Boolean(r.gate.lanes[lane]?.correct);
    r.rivalDist = r.rivalDist.map((d, i) => d + RIVALS[i].gain);
    if (correct) {
      r.playerDist += BOOST_GAIN;
      r.step = Math.min(r.step + 1, GATES_TOTAL);
      r.score += 10;
      r.correct += 1;
      sceneRef.current?.boost();
      sfx.correct();
      playPitch(660, 0.12);
      say(`💨 BOOST! ${["Go!", "Zoom!", "Nice!", "Yeah!"][Math.floor(r.rng() * 4)]}`);
    } else {
      r.playerDist += MISS_GAIN;
      sceneRef.current?.bump();
      sfx.wrong();
      const q = r.gate.question;
      setToast(workedExample(q) || `${q.prompt.replace("= ?", "")}= ${q.answer}`);
      setTimeout(() => setToast(null), 2300);
      say(`Almost — that was lane ${r.gate.lanes.findIndex((l) => l.correct) + 1}.`);
    }
    sceneRef.current?.setRivalLead(r.rivalDist.map((d) => d - r.playerDist));
    r.gateNum += 1;
    syncHud(r);
    setTimeout(() => {
      if (!r.over) { if (r.gateNum >= GATES_TOTAL) finish(r); else spawnGate(r); }
    }, 720);
  }

  function handleCoin() {
    const r = runRef.current;
    if (!r || r.over) return;
    r.coins += 1;
    sfx.earn();
    syncHud(r);
  }

  useEffect(() => {
    onGateRef.current = onGate;
    onCoinRef.current = handleCoin;
  });

  function start() {
    unlockAudio();
    sfx.tap();
    const rng = mulberry32(newSeed());
    const seen = new Set<string>();
    const r: Run = {
      rng, seen, gateNum: 0, step: 0, gate: buildGate(rng, 0, false, seen),
      busy: false, over: false, score: 0, coins: 0, correct: 0,
      // rivals start spread out ahead — chase them down by answering right!
      playerDist: 0, rivalDist: RIVALS.map((_, i) => 5 + i * 4),
    };
    runRef.current = r;
    setResult(null);
    sceneRef.current?.setLane(1);
    sceneRef.current?.setRivalLead(r.rivalDist.map((d) => d - r.playerDist));
    sceneRef.current?.spawnGateRow(r.gate.lanes.map((l) => l.value));
    setPhase("play");
    syncHud(r);
    say(`Race start! ${r.gate.question.prompt} — steer to the answer!`, 2600);
  }

  function steer(dir: number) {
    sceneRef.current?.steer(dir);
    sfx.tap();
  }

  return (
    <div className="screen stage-play ranger-screen">
      <div className="pixi-host" ref={hostRef} />

      <header className="stage-header ranger-top">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>← Base</Link>
        <span className="stage-title">🏎️ Turbo Tracks</span>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      {phase === "play" && (
        <>
          <div className="ranger-hud">
            <div key={hud.prompt} className="ranger-quest">{hud.prompt}</div>
            <div className="ranger-stats">
              <span className="catch-stat">🏁 {hud.gate}/{GATES_TOTAL}</span>
              <span className="catch-stat">🏁 {ORDINAL[hud.place - 1] ?? `${hud.place}th`}</span>
              <span className="catch-stat dim">🪙 {hud.coins}</span>
            </div>
          </div>
          {line && <div className="ranger-pip">{line}</div>}
          {toast && <div className="ranger-toast ranger-toast-teach">{toast}</div>}
          <div className="racer-steer">
            <button className="ranger-btn racer-arrow" onPointerDown={(e) => { e.stopPropagation(); steer(-1); }}>◀</button>
            <button className="ranger-btn racer-arrow" onPointerDown={(e) => { e.stopPropagation(); steer(1); }}>▶</button>
          </div>
        </>
      )}

      {phase === "intro" && (
        <div className="overlay">
          <div className="panel celebration-card">
            <h2>🏎️ Turbo Tracks</h2>
            <p className="catch-howto">Race the rivals on your 3D track!</p>
            <p className="catch-howto dim">◀ ▶ steer between lanes. Drive through the gate with the RIGHT answer to BOOST 💨 and overtake!</p>
            <p className="catch-howto dim">Grab 🪙 coins. Finish 1st to win the race!</p>
            {best > 0 && <p className="catch-howto">🏆 Best: {best}</p>}
            <button className="btn btn-primary btn-big" onClick={start}>Start Race!</button>
          </div>
        </div>
      )}

      {phase === "done" && result && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>{placeLabel(result.place)}</h2>
            <div className="payout">✅ {result.correct}/{GATES_TOTAL} · 🪙 {result.coins} → +{result.payout} ✨</div>
            <p className="catch-howto dim">🏆 Best: {Math.max(best, result.score)} · Great driving, {persona.name}!</p>
            <div className="celebration-actions">
              <button className="btn btn-secondary" onClick={() => { sfx.tap(); navigate("/hub"); }}>← Base</button>
              <button className="btn btn-primary" onClick={start}>Race Again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
