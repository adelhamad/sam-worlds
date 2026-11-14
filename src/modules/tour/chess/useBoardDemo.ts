// Plays a BoardIntro: the hero piece glides through its script on a loop, and
// the child can pick it up and carry it to any dot (or tap a dot) — free play.
// After a few idle seconds the loop takes over again.
import { useEffect, useState } from "react";
import { inCheck, movePiece, pieceAt, pseudoMoves } from "../../../engine/chess/rules";
import type { Position } from "../../../engine/chess/types";
import type { BoardIntro } from "../../../content/chess/intros";
import { moveKeys, tintAll, type BoardBurst, type MarkTone, type PieceKeys, type SquareTint } from "../../../ui/chess/boardTypes";
import { chessSound } from "./chessSound";
import { fireLines, trappedMarks } from "./missionLook";

const STEP_MS = 1150;
const HOLD_MS = 2600; // linger on the last picture of a "reset" script
const IDLE_MS = 7000; // free play pauses the loop this long

interface Demo {
  position: Position;
  keys: PieceKeys;
  hero: number;
  /** Index of the next scripted move. */
  step: number;
  /** Bumps on every restart so the pieces re-appear instead of sliding home. */
  gen: number;
  from: number | null;
  bursts: BoardBurst[];
}

function fresh(intro: BoardIntro, gen: number): Demo {
  const keys: PieceKeys = {};
  intro.position.pieces.forEach((piece, i) => {
    keys[piece.sq] = `g${gen}p${i}`;
  });
  return { position: intro.position, keys, hero: intro.hero, step: 0, gen, from: null, bursts: [] };
}

function moveHero(demo: Demo, to: number, step: number): Demo {
  const move = { from: demo.hero, to };
  const mover = pieceAt(demo.position, demo.hero);
  const victim = pieceAt(demo.position, to);
  const position = movePiece(demo.position, move);
  const crowned = mover?.type !== pieceAt(position, to)?.type;
  const id = demo.gen * 100 + demo.bursts.length;
  const bursts = [...demo.bursts];
  if (victim) bursts.push({ id, sq: to, kind: "puff", piece: { type: victim.type, side: victim.side } });
  else if (crowned) bursts.push({ id, sq: to, kind: "crown" });
  return { ...demo, position, keys: moveKeys(demo.keys, move), hero: to, step, from: demo.hero, bursts };
}

export interface BoardDemo {
  position: Position;
  keys: PieceKeys;
  dots: number[];
  tints: Record<number, SquareTint>;
  marks: Record<number, MarkTone>;
  bursts: BoardBurst[];
  /** True once the child has moved the piece. */
  played: boolean;
  /** Square of the piece the child can carry (null when it has nowhere to go). */
  hero: number | null;
  tap: (sq: number) => void;
  /** The hero was picked up: the loop waits. */
  grab: () => void;
}

export function useBoardDemo(intro: BoardIntro): BoardDemo {
  const [demo, setDemo] = useState(() => fresh(intro, 0));
  const [auto, setAuto] = useState(true);
  const [played, setPlayed] = useState(false);
  const [grabs, setGrabs] = useState(0); // every pick-up restarts the idle countdown

  const hero = pieceAt(demo.position, demo.hero);
  const freePlay = intro.kind === "piece";
  // A crowned pawn is a queen now: the pawn's story is told.
  const spent = hero?.type !== pieceAt(intro.position, intro.hero)?.type;
  let dots: number[] = [];
  if (freePlay && hero && !spent) dots = pseudoMoves(demo.position, hero);
  else if (!freePlay && demo.step < intro.script.length) dots = [intro.script[demo.step]];

  const scriptDone = demo.step >= intro.script.length;
  const stuck = dots.length === 0;
  useEffect(() => {
    const restart = () => {
      setDemo((now) => fresh(intro, now.gen + 1));
      setAuto(true);
    };
    let wait = STEP_MS;
    let then = () => setDemo((now) => {
      const next = now.step + 1;
      return moveHero(now, intro.script[now.step], intro.loop === "ring" ? next % intro.script.length : next);
    });
    if (!auto) {
      wait = stuck ? HOLD_MS : IDLE_MS; // stuck: nothing left to try (a pawn at the top, the check given)
      then = restart;
    } else if (scriptDone) {
      wait = HOLD_MS;
      then = restart;
    }
    const id = window.setTimeout(then, wait);
    return () => window.clearTimeout(id);
  }, [auto, demo, intro, scriptDone, stuck, grabs]);

  const tap = (sq: number) => {
    if (!dots.includes(sq)) return;
    if (hero?.type === "N") chessSound.hop();
    else chessSound.slide();
    if (pieceAt(demo.position, sq)) chessSound.capture();
    setPlayed(true);
    setAuto(false);
    setDemo(moveHero(demo, sq, freePlay ? demo.step : demo.step + 1));
  };
  const grab = () => {
    setAuto(false);
    setGrabs((n) => n + 1);
  };

  const checked = inCheck(demo.position, "b");
  const tints: Record<number, SquareTint> = demo.from === null ? {} : { [demo.from]: "trail" };
  if (checked) Object.assign(tints, tintAll(fireLines(demo.position, "b"), "fire"));
  const king = demo.position.pieces.find((piece) => piece.side === "b" && piece.type === "K");
  if (checked && king) tints[king.sq] = "danger";

  return {
    position: demo.position, keys: demo.keys, dots, tints, bursts: demo.bursts, played, tap, grab,
    hero: dots.length > 0 ? demo.hero : null,
    marks: intro.kind === "mate" ? trappedMarks(demo.position, "b") : {},
  };
}
