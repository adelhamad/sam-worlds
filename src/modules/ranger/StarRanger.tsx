import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { sfx, playPitch, unlockAudio } from "../../engine/feedback/audio";
import { mulberry32, newSeed, type RNG } from "../../engine/rng";
import { isRapidGuessing, MISS_LOCK_MS, workedExample } from "../../engine/answers/answerEngine";
import { buildQuest, crystalScore, PATROL_LEN, praise, rankTitle, type Quest } from "../../engine/ranger";
import { persona } from "../../persona.config";
import { STR } from "../../strings/en";
import { RangerScene } from "../../three/ranger/RangerScene";
import { Controls } from "./Controls";
import { useKeyboard } from "./useKeyboard";

const MAX_PAYOUT = 50;

interface Run {
  rng: RNG;
  index: number;
  quest: Quest;
  questGolden: boolean;
  goldenId: number | null;
  seen: Set<string>;
  firstTry: boolean;
  miss: number;
  wrongStamps: number[];
  goldUsed: boolean;
  score: number;
  coins: number;
  firstTryCount: number;
  combo: number;
  busy: boolean;
  over: boolean;
}

/** Star Ranger — roam a blocky meadow in 3D and zap the right answer. */
export function StarRanger() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);
  const best = useGame((s) => s.rangerBest);
  const reportScore = useGame((s) => s.reportRangerScore);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<RangerScene | null>(null);
  const runRef = useRef<Run | null>(null);
  const onHitRef = useRef<(id: number) => void>(() => {});
  const onCoinRef = useRef<() => void>(() => {});

  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [hud, setHud] = useState({ prompt: "", qNum: 1, score: 0, coins: 0 });
  const [line, setLine] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; kind: "teach" | "miss" } | null>(null);
  const [fireReady, setFireReady] = useState(false);
  const [startBest, setStartBest] = useState(0);
  const [result, setResult] = useState<{ score: number; coins: number; rank: string; perfect: boolean; payout: number } | null>(null);

  // Mount the 3D meadow once (StrictMode-safe).
  useEffect(() => {
    if (!hostRef.current) return;
    const scene = RangerScene.create(hostRef.current, persona.name);
    scene.onHit = (id) => onHitRef.current(id);
    scene.onCoin = () => onCoinRef.current();
    scene.start();
    sceneRef.current = scene;
    return () => {
      sceneRef.current = null;
      scene.destroy();
    };
  }, []);

  // Keep the ZAP-ready glow in sync with whether a crystal is aimed.
  useEffect(() => {
    if (phase !== "play") return;
    const t = setInterval(() => setFireReady(Boolean(sceneRef.current?.hasAim())), 120);
    return () => clearInterval(t);
  }, [phase]);

  useKeyboard(phase === "play", {
    move: (x, y) => sceneRef.current?.setMove(x, y),
    jump: () => sceneRef.current?.jump(),
    fire: () => fire(),
  });

  function syncHud(r: Run) {
    setHud({ prompt: r.quest.question.prompt, qNum: r.index + 1, score: r.score, coins: r.coins });
  }

  function say(text: string, hold = 1800) {
    setLine(text);
    setTimeout(() => setLine((l) => (l === text ? null : l)), hold);
  }

  function spawnCurrent(r: Run) {
    const correct = r.quest.targets.find((t) => t.correct);
    r.goldenId = r.questGolden && correct ? correct.id : null;
    const items = r.quest.targets.map((t) => ({ id: t.id, value: t.value, golden: t.id === r.goldenId }));
    sceneRef.current?.spawnCluster(items);
    syncHud(r);
  }

  function endRun(r: Run) {
    r.over = true;
    sceneRef.current?.clearCluster();
    const perfect = r.firstTryCount >= PATROL_LEN;
    const payout = Math.min(MAX_PAYOUT, Math.round(r.score / 3) + r.coins + (perfect ? 10 : 0));
    if (payout > 0) earnDust(payout, "star-ranger");
    reportScore(r.score);
    if (perfect) sfx.perfect();
    else sfx.stageComplete();
    setResult({ score: r.score, coins: r.coins, rank: rankTitle(r.firstTryCount), perfect, payout });
    setPhase("done");
  }

  function nextQuest(r: Run) {
    r.index += 1;
    if (r.index >= PATROL_LEN) {
      endRun(r);
      return;
    }
    r.quest = buildQuest(r.rng, r.index, false, r.seen);
    r.firstTry = true;
    r.miss = 0;
    r.busy = false;
    r.questGolden = !r.goldUsed && r.index >= 4 && r.rng() < 0.3;
    if (r.questGolden) r.goldUsed = true;
    spawnCurrent(r);
    say(`Pip: ${r.quest.question.prompt}  — zap the answer!`, 2400);
  }

  function fire() {
    const r = runRef.current;
    if (!r || r.over) return;
    const targeted = sceneRef.current?.fire();
    playPitch(880, 0.05);
    playPitch(560, 0.09, 0.04);
    if (!targeted) sfx.tap();
  }

  function handleCorrect(r: Run, id: number) {
    r.busy = true;
    sceneRef.current?.shatter(id);
    sfx.correct();
    r.combo += 1;
    playPitch(440 * Math.pow(1.059, Math.min(r.combo, 12)), 0.16);
    const golden = id === r.goldenId;
    r.score += crystalScore(r.firstTry) + (golden ? 15 : 0);
    if (r.firstTry) r.firstTryCount += 1;
    sceneRef.current?.dropCoin();
    if (golden) sceneRef.current?.dropCoin();
    say(golden ? `✨ GOLDEN crystal! Bonus, Ranger ${persona.name}!` : praise(r.rng));
    syncHud(r);
    setTimeout(() => { if (!r.over) nextQuest(r); }, 780);
  }

  function handleWrong(r: Run, id: number) {
    r.busy = true;
    sceneRef.current?.bounce(id);
    sfx.wrong();
    r.firstTry = false;
    r.miss += 1;
    r.combo = 0;
    r.wrongStamps.push(Date.now());
    const q = r.quest.question;
    const second = r.miss >= 2;
    setToast({ text: second ? workedExample(q) || q.hint : q.hint, kind: second ? "teach" : "miss" });
    const rapid = isRapidGuessing(r.wrongStamps);
    say(rapid ? `Take your time, Ranger ${persona.name} — no rush.` : STR.almostLook, 2400);
    setTimeout(() => {
      const live = runRef.current;
      if (!live || live.over) return;
      live.quest = buildQuest(live.rng, live.index, rapid, live.seen);
      live.busy = false;
      setToast(null);
      spawnCurrent(live);
    }, MISS_LOCK_MS);
  }

  function handleHit(id: number) {
    const r = runRef.current;
    if (!r || r.over || r.busy) return;
    const target = r.quest.targets.find((t) => t.id === id);
    if (!target) return;
    if (target.correct) handleCorrect(r, id);
    else handleWrong(r, id);
  }

  function handleCoin() {
    const r = runRef.current;
    if (!r || r.over) return;
    r.coins += 1;
    sfx.earn();
    syncHud(r);
  }

  // Keep scene callbacks pointed at the latest closures.
  useEffect(() => {
    onHitRef.current = handleHit;
    onCoinRef.current = handleCoin;
  });

  function start() {
    unlockAudio();
    sfx.tap();
    const rng = mulberry32(newSeed());
    const seen = new Set<string>();
    const r: Run = {
      rng, index: 0, quest: buildQuest(rng, 0, false, seen), questGolden: false, goldenId: null,
      seen, firstTry: true, miss: 0, wrongStamps: [], goldUsed: false,
      score: 0, coins: 0, firstTryCount: 0, combo: 0, busy: false, over: false,
    };
    runRef.current = r;
    setStartBest(best);
    setResult(null);
    sceneRef.current?.clearCluster();
    spawnCurrent(r);
    setPhase("play");
    say(`Pip: ${r.quest.question.prompt}  — zap the answer!`, 2600);
  }

  function doneTitle(): string {
    if (!result) return "";
    if (result.perfect) return "⭐ PERFECT PATROL!";
    if (result.score > startBest && result.score > 0) return "🏆 NEW BEST!";
    return "Patrol Complete!";
  }

  return (
    <div className="screen stage-play ranger-screen">
      <div className="pixi-host" ref={hostRef} />

      <header className="stage-header ranger-top">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>← Base</Link>
        <span className="stage-title">🤠 Star Ranger</span>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      {phase === "play" && (
        <>
          <div className="ranger-hud">
            <div key={hud.prompt} className="ranger-quest">{hud.prompt}</div>
            <div className="ranger-stats">
              <span className="catch-stat">🎯 {hud.qNum}/{PATROL_LEN}</span>
              <span className="catch-stat">⭐ {hud.score}</span>
              <span className="catch-stat dim">🪙 {hud.coins}</span>
            </div>
          </div>
          {line && <div className="ranger-pip">{line}</div>}
          {toast && <div className={`ranger-toast ranger-toast-${toast.kind}`}>{toast.text}</div>}
          <Controls
            onMove={(x, y) => sceneRef.current?.setMove(x, y)}
            onJump={() => sceneRef.current?.jump()}
            onFire={fire}
            fireReady={fireReady}
          />
        </>
      )}

      {phase === "intro" && (
        <div className="overlay">
          <div className="panel celebration-card">
            <h2>🤠 Star Ranger</h2>
            <p className="catch-howto">Roam your blocky planet in 3D!</p>
            <p className="catch-howto dim">🕹️ Drag to move · ⤴ JUMP · ⚡ ZAP the crystal with the right answer.</p>
            <p className="catch-howto dim">Turn to aim — the ring lights up the crystal you'll hit. Find ✨golden ones!</p>
            {best > 0 && <p className="catch-howto">🏆 Best patrol: {best}</p>}
            <button className="btn btn-primary btn-big" onClick={start}>Start Patrol!</button>
          </div>
        </div>
      )}

      {phase === "done" && result && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>{doneTitle()}</h2>
            <p className="catch-howto">{result.rank}</p>
            <div className="payout">⭐ {result.score} · 🪙 {result.coins} → +{result.payout} ✨</div>
            <p className="catch-howto dim">🏆 Best: {Math.max(best, result.score)} · Pip waves: "Come back soon, Ranger {persona.name}!"</p>
            <div className="celebration-actions">
              <button className="btn btn-secondary" onClick={() => { sfx.tap(); navigate("/hub"); }}>← Base</button>
              <button className="btn btn-primary" onClick={start}>Patrol Again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
