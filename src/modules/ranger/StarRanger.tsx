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

// The golems you battle, escalating to a dragon boss. HP totals 12 = PATROL_LEN.
const MONSTERS = [
  { name: "Grumble", face: "👹", color: 0x9b5de5, hp: 2, scale: 1.0, boss: false },
  { name: "Gloop", face: "👾", color: 0x4cc9f0, hp: 3, scale: 1.05, boss: false },
  { name: "Rockjaw", face: "🗿", color: 0x8d99ae, hp: 3, scale: 1.12, boss: false },
  { name: "Draglor", face: "🐲", color: 0xef476f, hp: 4, scale: 1.4, boss: true },
];

interface Run {
  rng: RNG;
  seen: Set<string>;
  step: number; // difficulty pointer
  quest: Quest;
  questGolden: boolean;
  goldenId: number | null;
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
  mIndex: number;
  hp: number;
  max: number;
}

/** Star Ranger — roam a blocky planet in 3D and battle Number Golems. */
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
  const dragRef = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);

  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [hud, setHud] = useState({ prompt: "", face: "", name: "", hp: 0, max: 0, score: 0, coins: 0 });
  const [line, setLine] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; kind: "teach" | "miss" } | null>(null);
  const [fireReady, setFireReady] = useState(false);
  const [startBest, setStartBest] = useState(0);
  const [result, setResult] = useState<{ score: number; coins: number; rank: string; perfect: boolean; payout: number } | null>(null);

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
    const m = MONSTERS[r.mIndex];
    setHud({ prompt: r.quest.question.prompt, face: m.face, name: m.name, hp: r.hp, max: r.max, score: r.score, coins: r.coins });
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

  /** Build the next question (same difficulty band advances by one step). */
  function rollQuest(r: Run) {
    r.step += 1;
    r.quest = buildQuest(r.rng, r.step, false, r.seen);
    r.firstTry = true;
    r.miss = 0;
    r.busy = false;
    r.questGolden = !r.goldUsed && r.step >= 4 && r.rng() < 0.3;
    if (r.questGolden) r.goldUsed = true;
  }

  function nextMonster(r: Run) {
    r.mIndex += 1;
    if (r.mIndex >= MONSTERS.length) { endRun(r); return; }
    const m = MONSTERS[r.mIndex];
    r.hp = m.hp;
    r.max = m.hp;
    rollQuest(r);
    sceneRef.current?.spawnMonster(m.face, m.color, m.scale, m.boss);
    spawnCurrent(r);
    say(`${m.boss ? "👑 BOSS! " : ""}A ${m.name} appears! ${r.quest.question.prompt}`, 2600);
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
    sceneRef.current?.flinch();
    sfx.correct();
    r.combo += 1;
    playPitch(440 * Math.pow(1.059, Math.min(r.combo, 12)), 0.16);
    const golden = id === r.goldenId;
    r.score += crystalScore(r.firstTry) + (golden ? 15 : 0);
    if (r.firstTry) r.firstTryCount += 1;
    sceneRef.current?.dropCoin();
    r.hp -= 1;
    syncHud(r);
    if (r.hp <= 0) {
      sceneRef.current?.monsterDefeat();
      say(`💥 ${MONSTERS[r.mIndex].name} defeated! Nice, Ranger ${persona.name}!`, 2200);
      setTimeout(() => { if (!r.over) nextMonster(r); }, 900);
    } else {
      say(golden ? `✨ GOLDEN hit! Bonus!` : praise(r.rng));
      setTimeout(() => { if (!r.over) { rollQuest(r); spawnCurrent(r); } }, 720);
    }
  }

  function handleWrong(r: Run) {
    r.busy = true;
    sceneRef.current?.monsterAttack();
    sfx.wrong();
    r.firstTry = false;
    r.miss += 1;
    r.combo = 0;
    r.wrongStamps.push(Date.now());
    const q = r.quest.question;
    const second = r.miss >= 2;
    setToast({ text: second ? workedExample(q) || q.hint : q.hint, kind: second ? "teach" : "miss" });
    const rapid = isRapidGuessing(r.wrongStamps);
    say(rapid ? `Steady, Ranger ${persona.name} — read it first.` : STR.almostLook, 2400);
    setTimeout(() => {
      const live = runRef.current;
      if (!live || live.over) return;
      live.quest = buildQuest(live.rng, live.step, rapid, live.seen);
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
    else handleWrong(r);
  }

  function handleCoin() {
    const r = runRef.current;
    if (!r || r.over) return;
    r.coins += 1;
    sfx.earn();
    syncHud(r);
  }

  useEffect(() => {
    onHitRef.current = handleHit;
    onCoinRef.current = handleCoin;
  });

  function start() {
    unlockAudio();
    sfx.tap();
    const rng = mulberry32(newSeed());
    const seen = new Set<string>();
    const m0 = MONSTERS[0];
    const r: Run = {
      rng, seen, step: 0, quest: buildQuest(rng, 0, false, seen), questGolden: false, goldenId: null,
      firstTry: true, miss: 0, wrongStamps: [], goldUsed: false,
      score: 0, coins: 0, firstTryCount: 0, combo: 0, busy: false, over: false,
      mIndex: 0, hp: m0.hp, max: m0.hp,
    };
    runRef.current = r;
    setStartBest(best);
    setResult(null);
    sceneRef.current?.spawnMonster(m0.face, m0.color, m0.scale, m0.boss);
    spawnCurrent(r);
    setPhase("play");
    say(`A ${m0.name} appears! Zap the answer to hit it!`, 2800);
  }

  // Drag anywhere on the 3D view to look around (orbit + tilt the camera).
  function onDragStart(e: React.PointerEvent) {
    dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onDragMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    sceneRef.current?.look((e.clientX - d.x) * 0.005, -(e.clientY - d.y) * 0.004);
    d.x = e.clientX;
    d.y = e.clientY;
  }
  function onDragEnd(e: React.PointerEvent) {
    if (dragRef.current?.id === e.pointerId) dragRef.current = null;
  }

  function doneTitle(): string {
    if (!result) return "";
    if (result.perfect) return "⭐ FLAWLESS VICTORY!";
    if (result.score > startBest && result.score > 0) return "🏆 NEW BEST!";
    return "🎉 Meadow Saved!";
  }

  const hearts = "❤️".repeat(Math.max(0, hud.hp)) + "🖤".repeat(Math.max(0, hud.max - hud.hp));

  return (
    <div className="screen stage-play ranger-screen">
      <div
        className="pixi-host"
        ref={hostRef}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      />

      <header className="stage-header ranger-top">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>← Base</Link>
        <span className="stage-title">🤠 Star Ranger</span>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      {phase === "play" && (
        <>
          <div className="ranger-hud">
            <div className="ranger-foe">{hud.face} {hud.name} <span className="ranger-hearts">{hearts}</span></div>
            <div key={hud.prompt} className="ranger-quest">{hud.prompt}</div>
            <div className="ranger-stats">
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
            <p className="catch-howto">Battle the Number Golems on your 3D planet!</p>
            <p className="catch-howto dim">🕹️ Joystick to move · ⤴ JUMP · ✋ drag the view to look around.</p>
            <p className="catch-howto dim">Turn to aim, then ⚡ZAP the crystal with the right answer to hit the golem. Beat all 4 — the last is a BOSS! 🐲</p>
            {best > 0 && <p className="catch-howto">🏆 Best: {best}</p>}
            <button className="btn btn-primary btn-big" onClick={start}>Start Battle!</button>
          </div>
        </div>
      )}

      {phase === "done" && result && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>{doneTitle()}</h2>
            <p className="catch-howto">{result.rank}</p>
            <div className="payout">⭐ {result.score} · 🪙 {result.coins} → +{result.payout} ✨</div>
            <p className="catch-howto dim">🏆 Best: {Math.max(best, result.score)} · Pip cheers: "You saved the meadow, Ranger {persona.name}!"</p>
            <div className="celebration-actions">
              <button className="btn btn-secondary" onClick={() => { sfx.tap(); navigate("/hub"); }}>← Base</button>
              <button className="btn btn-primary" onClick={start}>Battle Again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
