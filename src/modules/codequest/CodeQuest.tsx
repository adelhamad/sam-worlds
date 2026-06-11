import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { vibrate } from "../../engine/sensors";
import { mulberry32, newSeed, shuffle, type RNG } from "../../engine/rng";

const GEMS = ["🔴", "🔵", "🟡", "🟢", "🟣", "🟠"];
const ROUNDS = [
  { length: 3, palette: 4 },
  { length: 3, palette: 5 },
  { length: 4, palette: 5 },
];
const HINT_AFTER = 6;

interface GuessRow {
  gems: string[];
  perfect: number; // right gem, right spot
  close: number; // right gem, wrong spot
}

/** Classic Mastermind feedback (no duplicate gems in the secret). */
function judge(secret: string[], guess: string[]): { perfect: number; close: number } {
  let perfect = 0;
  let close = 0;
  guess.forEach((g, i) => {
    if (g === secret[i]) perfect++;
    else if (secret.includes(g)) close++;
  });
  return { perfect, close };
}

function starsFor(guessCount: number): number {
  if (guessCount <= 4) return 3;
  if (guessCount <= 6) return 2;
  return 1;
}

export function CodeQuest() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);

  const rngRef = useRef<RNG>(mulberry32(newSeed()));
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [round, setRound] = useState(0);
  const [secret, setSecret] = useState<string[]>([]);
  const [palette, setPalette] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [history, setHistory] = useState<GuessRow[]>([]);
  const [stars, setStars] = useState(0);
  const [solvedRound, setSolvedRound] = useState(false);
  const [hintIndex, setHintIndex] = useState<number | null>(null);

  const cfg = ROUNDS[round];

  function newRound(r: number): void {
    const config = ROUNDS[r];
    const gems = shuffle(rngRef.current, GEMS).slice(0, config.palette);
    setPalette(gems);
    setSecret(shuffle(rngRef.current, gems).slice(0, config.length));
    setSlots([]);
    setHistory([]);
    setHintIndex(null);
    setSolvedRound(false);
  }

  function start(): void {
    unlockAudio();
    sfx.tap();
    setRound(0);
    setStars(0);
    setPhase("play");
    newRound(0);
  }

  function tapGem(gem: string): void {
    if (solvedRound || slots.length >= cfg.length || slots.includes(gem)) return;
    sfx.tap();
    setSlots((s) => [...s, gem]);
  }

  function check(): void {
    if (slots.length !== cfg.length) return;
    const verdict = judge(secret, slots);
    const row: GuessRow = { gems: slots, ...verdict };
    const guesses = history.length + 1;
    setHistory((h) => [row, ...h]);
    setSlots([]);

    if (verdict.perfect === cfg.length) {
      sfx.stageComplete();
      vibrate([40, 50, 80]);
      setSolvedRound(true);
      const gained = starsFor(guesses);
      setStars((st) => st + gained);
      setTimeout(() => {
        if (round + 1 >= ROUNDS.length) {
          setPhase("done");
        } else {
          setRound((r) => {
            newRound(r + 1);
            return r + 1;
          });
        }
      }, 1600);
      return;
    }
    sfx.wrong();
    vibrate(40);
    // scaffold, not punishment: after many tries, reveal one position
    if (guesses === HINT_AFTER) {
      setHintIndex(Math.floor(rngRef.current() * cfg.length));
      sfx.earn();
    }
  }

  const payout = stars * 4;

  // Pay out exactly once per finished run.
  useEffect(() => {
    if (phase !== "done") return;
    sfx.badge();
    earnDust(payout, "code-quest");
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="screen code-quest">
      <header className="hub-header">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Base
        </Link>
        <h1>🔮 Code Quest</h1>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      {phase === "intro" && (
        <div className="panel celebration-card code-intro">
          <h2>🔮 Crack the secret code!</h2>
          <p className="catch-howto">Hidden gems are waiting in order.</p>
          <p className="catch-howto dim">✔ = right gem, right spot</p>
          <p className="catch-howto dim">↔ = right gem, wrong spot</p>
          <p className="catch-howto dim">Think like a detective — every guess is a clue!</p>
          <button className="btn btn-primary btn-big" onClick={start}>
            Investigate!
          </button>
        </div>
      )}

      {phase === "play" && (
        <>
          <div className="code-status">
            <span className="catch-stat">Round {round + 1}/{ROUNDS.length}</span>
            <span className="catch-stat">⭐ {stars}</span>
            <span className="catch-stat">🔍 Guess {history.length + 1}</span>
          </div>

          <div className="panel code-board">
            <div className="code-slots">
              {Array.from({ length: cfg.length }).map((_, i) => {
                const revealed = solvedRound || (!slots[i] && hintIndex === i);
                const content = revealed ? secret[i] : slots[i] ?? "";
                return (
                  <span key={i} className={`code-slot ${solvedRound ? "code-solved" : ""}`}>
                    {content}
                    {hintIndex === i && !solvedRound && !slots[i] && <span className="code-hint-tag">hint</span>}
                  </span>
                );
              })}
            </div>
            {solvedRound && <div className="perfect-banner">🎉 Code cracked!</div>}
            <div className="code-gems">
              {palette.map((gem) => (
                <button
                  key={gem}
                  className="btn code-gem"
                  disabled={solvedRound || slots.includes(gem) || slots.length >= cfg.length}
                  onClick={() => tapGem(gem)}
                >
                  {gem}
                </button>
              ))}
            </div>
            <div className="input-actions">
              <button className="btn btn-secondary" disabled={!slots.length || solvedRound} onClick={() => setSlots((s) => s.slice(0, -1))}>
                ⌫
              </button>
              <button className="btn btn-primary" disabled={slots.length !== cfg.length || solvedRound} onClick={check}>
                🔍 Check!
              </button>
            </div>
          </div>

          <div className="code-history">
            {history.map((row, i) => (
              <div key={i} className="panel code-row">
                <span className="code-row-gems">{row.gems.join(" ")}</span>
                <span className="code-row-pegs">
                  {"✔".repeat(row.perfect)}
                  {"↔".repeat(row.close)}
                  {row.perfect === 0 && row.close === 0 && "✖"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {phase === "done" && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>Master detective!</h2>
            <div className="payout">
              {stars} ⭐ of {ROUNDS.length * 3} → +{payout} ✨
            </div>
            {stars >= ROUNDS.length * 3 - 1 && <div className="perfect-banner">🌟 Sherlock of Space!</div>}
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
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
