// lang-memory — a real card game: cards lie face down (violet = a phrase,
// rose = a meaning). Turn two over: a phrase and its meaning stay open with a
// sparkle; any other two get a gentle shake and turn back once the child has
// had a look (tapping a third card turns them back at once). Self-submitting:
// the engine decides (memoryVerdict) once every pair is found, or when the
// generous, never-shown allowance of turns runs out.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { memoryPairs, memoryVerdict } from "../../../engine/lang/verdicts";
import type { MemoryPayload } from "../../../engine/lang/types";
import { LANG } from "../../../strings/lang";
import { tourSound, useTimers, type WidgetProps } from "../exercises/shared";
import { MeaningFace, PhraseFace } from "./LangFaces";
import { MemoryBack, Sparkle } from "./MemoryBack";
import { useVoice } from "./useVoice";
import "./play.css";

/** A non-match stays open this long (the shake starts at SHAKE_MS). */
const LOOK_MS = 1400;
const SHAKE_MS = 650;
const MATCH_SOUND_MS = 260; // once the second card has turned
const WIN_MS = 900;
const OUT_MS = 600;

type Over = "won" | "out" | null;

export function LangMemory({ payload, disabled, onSubmit }: WidgetProps<MemoryPayload>) {
  const { say } = useVoice(payload.lang);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [fresh, setFresh] = useState<string | null>(null);
  const [shake, setShake] = useState<number[]>([]);
  const [turns, setTurns] = useState(0);
  const [over, setOver] = useState<Over>(null);
  const [reveal, setReveal] = useState(false);
  const look = useRef(0); // the pending flip-back; bumped to cancel it
  const later = useTimers();
  const submit = useRef(onSubmit);
  useEffect(() => {
    submit.current = onSubmit;
  });
  const { cards } = payload;
  const pairs = memoryPairs(payload);

  const finish = (pairsFound: number, used: number, won: boolean) => {
    setOver(won ? "won" : "out");
    later(() => submit.current(memoryVerdict(payload, pairsFound, used)), won ? WIN_MS : OUT_MS);
    if (!won) later(() => setReveal(true), LOOK_MS);
  };

  const hear = (index: number) => {
    const card = cards[index];
    if (card.side === "phrase") say(card.card);
  };

  const flip = (index: number) => {
    const card = cards[index];
    if (disabled || over) return;
    if (found.includes(card.pair) || open.includes(index)) { hear(index); return; }
    tourSound.pop();
    hear(index);
    if (open.length !== 1) {
      // Nothing open — or a non-match is still showing: turn those back now, this card starts a new turn.
      look.current += 1;
      setShake([]);
      setOpen([index]);
      return;
    }
    const first = cards[open[0]];
    const used = turns + 1;
    setTurns(used);
    if (first.pair === card.pair && first.side !== card.side) {
      const all = [...found, card.pair];
      setOpen([]);
      setFound(all);
      setFresh(card.pair);
      later(() => tourSound.match(), MATCH_SOUND_MS);
      if (all.length >= pairs) finish(all.length, used, true);
      return;
    }
    const both = [open[0], index];
    setOpen(both);
    const token = ++look.current;
    later(() => {
      if (look.current !== token) return;
      setShake(both);
      tourSound.nudge();
    }, SHAKE_MS);
    later(() => {
      if (look.current !== token) return;
      setOpen([]);
      setShake([]);
    }, LOOK_MS);
    if (used >= payload.turns) finish(found.length, used + 1, false);
  };

  const rootCls = ["tx", "lx", "lx-memory", over === "won" ? "is-won" : ""].filter(Boolean).join(" ");

  return (
    <div className={rootCls} data-testid="lang-memory" data-turns={turns}>
      <div className="lxm-pips" role="img" aria-label={LANG.ui.memFound(found.length, pairs)}>
        {Array.from({ length: pairs }, (_, i) => (
          <span key={i} className={`lxm-pip ${i < found.length ? "is-on" : ""}`}>
            <svg viewBox="-8 -8 16 16" aria-hidden="true">
              <path d="M0 -7 L2 -2.2 L7 -2.2 L3 1 L4.4 6.4 L0 3.3 L-4.4 6.4 L-3 1 L-7 -2.2 L-2 -2.2 Z" />
            </svg>
          </span>
        ))}
      </div>
      <div className="lxm-grid" data-count={cards.length}>
        {cards.map((card, index) => {
          const isFound = found.includes(card.pair);
          const up = isFound || open.includes(index) || reveal;
          const cls = [
            "lxm-card", `is-${card.side}`, up ? "is-up" : "is-down", isFound ? "is-found" : "",
            fresh === card.pair ? "is-fresh" : "", shake.includes(index) ? "is-shake" : "",
          ].filter(Boolean).join(" ");
          return (
            <button
              key={`${card.pair}-${card.side}`} type="button" className={cls} style={{ "--i": index } as CSSProperties}
              disabled={disabled} data-testid={`lang-mem-${index}`} data-pair={card.pair}
              aria-label={up ? undefined : LANG.ui.memCard} onClick={() => flip(index)}
            >
              <span className="lxm-inner">
                <span className="lxm-face lxm-back" aria-hidden={up}>
                  <MemoryBack side={card.side} />
                </span>
                <span className="lxm-face lxm-front" aria-hidden={!up}>
                  {card.side === "phrase" ? <PhraseFace card={card.card} lang={payload.lang} /> : <MeaningFace card={card.card} />}
                </span>
              </span>
              {isFound && fresh === card.pair && <Sparkle />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
