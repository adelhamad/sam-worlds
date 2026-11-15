// lang-memory — cards face down: flip two, find each phrase and its meaning.
// Self-submitting: the engine decides (memoryVerdict) once every pair is
// found, or when the turns run out.
import { useEffect, useRef, useState } from "react";
import { memoryPairs, memoryVerdict } from "../../../engine/lang/verdicts";
import type { MemoryPayload } from "../../../engine/lang/types";
import { tourSound, useTimers, type WidgetProps } from "../exercises/shared";
import { MeaningFace, PhraseFace } from "./LangFaces";
import { useVoice } from "./useVoice";

const LOOK_MS = 900;

export function LangMemory({ payload, disabled, onSubmit }: WidgetProps<MemoryPayload>) {
  const { say } = useVoice(payload.lang);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [turns, setTurns] = useState(0);
  const [over, setOver] = useState(false);
  const later = useTimers();
  const submit = useRef(onSubmit);
  useEffect(() => {
    submit.current = onSubmit;
  });

  const finish = (pairs: number, used: number) => {
    setOver(true);
    later(() => submit.current(memoryVerdict(payload, pairs, used)), 600);
  };

  const flip = (index: number) => {
    const card = payload.cards[index];
    if (disabled || over || open.length >= 2 || open.includes(index) || found.includes(card.pair)) return;
    tourSound.pop();
    if (card.side === "phrase") say(card.card);
    if (open.length === 0) { setOpen([index]); return; }
    const first = payload.cards[open[0]];
    const used = turns + 1;
    setTurns(used);
    setOpen([open[0], index]);
    if (first.pair === card.pair && first.side !== card.side) {
      tourSound.match();
      const all = [...found, card.pair];
      later(() => { setFound(all); setOpen([]); }, 350);
      if (all.length >= memoryPairs(payload)) finish(all.length, used);
      return;
    }
    later(() => setOpen([]), LOOK_MS);
    if (used >= payload.turns) finish(found.length, used + 1);
  };

  return (
    <div className="tx lx lx-memory" data-testid="lang-memory" data-turns={turns}>
      <div className="lx-memory-grid">
        {payload.cards.map((card, index) => {
          const up = open.includes(index) || found.includes(card.pair);
          return (
            <button
              key={`${card.pair}-${card.side}`} type="button"
              className={`ttile lx-memory-card ${up ? "is-up" : "is-down"} ${found.includes(card.pair) ? "is-right" : ""}`}
              disabled={disabled} data-testid={`lang-mem-${index}`} data-pair={card.pair} onClick={() => flip(index)}
            >
              {up && (card.side === "phrase" ? <PhraseFace card={card.card} lang={payload.lang} /> : <MeaningFace card={card.card} />)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
