// lang-pairs — tap a phrase and its meaning to match them. Partners share an
// id. Self-submitting: a mismatch reports pairsMiss after the shake, a cleared
// board reports pairsAnswer after the last pop. Tapping a phrase says it.
import { useEffect, useRef, useState } from "react";
import { pairsAnswer, pairsMiss } from "../../../engine/lang/answers";
import type { LangCard, PairsPayload } from "../../../engine/lang/types";
import { LANG } from "../../../strings/lang";
import { tourSound, useTimers, type WidgetProps } from "../exercises/shared";
import { MeaningFace, PhraseFace } from "./LangFaces";
import { useVoice } from "./useVoice";

type Side = "left" | "right";
const POP_MS = 380;
const MISS_MS = 450;

export function LangPairs({ payload, disabled, onSubmit }: WidgetProps<PairsPayload>) {
  const { say } = useVoice(payload.lang);
  const [sel, setSel] = useState<{ side: Side; id: string } | null>(null);
  /** Matched ids: "right" while the pop plays, then "done". */
  const [matched, setMatched] = useState<Record<string, "right" | "done">>({});
  const [miss, setMiss] = useState<{ left: string; right: string } | null>(null);
  const [finished, setFinished] = useState(false);
  const later = useTimers();
  const submit = useRef(onSubmit);
  useEffect(() => {
    submit.current = onSubmit;
  });
  const ids = payload.left.map((card) => card.id);

  const resolve = (left: string, right: string) => {
    setSel(null);
    if (left !== right) {
      tourSound.nudge();
      setMiss({ left, right });
      later(() => {
        setMiss(null);
        submit.current(pairsMiss(left, right));
      }, MISS_MS);
      return;
    }
    tourSound.match();
    const next = { ...matched, [left]: "right" as const };
    setMatched(next);
    later(() => setMatched((now) => ({ ...now, [left]: "done" })), POP_MS);
    if (ids.every((id) => next[id])) {
      setFinished(true);
      later(() => submit.current(pairsAnswer(ids)), POP_MS + 140);
    }
  };

  const tap = (side: Side, card: LangCard) => {
    if (disabled || miss || finished || matched[card.id]) return;
    if (side === "left") say(card);
    if (!sel || sel.side === side) {
      tourSound.pop();
      setSel(sel?.side === side && sel.id === card.id ? null : { side, id: card.id });
      return;
    }
    if (side === "left") resolve(card.id, sel.id);
    else resolve(sel.id, card.id);
  };

  const stateOf = (side: Side, id: string): string => {
    if (matched[id]) return `is-${matched[id]}`;
    if (miss && miss[side] === id) return "is-miss";
    return sel?.side === side && sel.id === id ? "is-selected" : "";
  };

  const column = (side: Side, cards: LangCard[]) => (
    <div className={`lx-pairs-col is-${side}`}>
      {cards.map((card) => {
        const state = stateOf(side, card.id);
        return (
          <button
            key={card.id} type="button" className={`ttile lx-pair ${state}`} aria-pressed={state === "is-selected"}
            disabled={disabled || state === "is-right" || state === "is-done"}
            data-testid={`lang-${side}-${card.id}`} onClick={() => tap(side, card)}
          >
            {side === "left" ? <PhraseFace card={card} lang={payload.lang} noRoman={payload.noRoman} /> : <MeaningFace card={card} />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="tx lx lx-pairs-wrap" data-testid="lang-pairs">
      <p className="lx-help">{LANG.ui.pairsHelp}</p>
      <div className="lx-pairs" style={{ "--rows": payload.left.length } as React.CSSProperties}>
        {column("left", payload.left)}
        {column("right", payload.right)}
      </div>
    </div>
  );
}
