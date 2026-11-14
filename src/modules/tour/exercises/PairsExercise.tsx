// pairs — tap one card on each side to match them. Self-submitting: a mismatch
// reports pairsMiss right away, a cleared board reports pairsAnswer.
import { useEffect, useRef, useState } from "react";
import { pairsAnswer, pairsMiss } from "../../../engine/tour/answers";
import { countryName } from "../../../engine/tour/countries";
import type { PairsPayload } from "../../../engine/tour/types";
import { Flag } from "../../../ui/tour/Flag";
import { Outline } from "./Outline";
import { tourSound, useTimers, type WidgetProps } from "./shared";

type Side = "L" | "R";
interface Sel {
  side: Side;
  code: string;
}

const POP_MS = 380;
const MISS_MS = 450;

export function PairsExercise({ payload, disabled, onSubmit }: WidgetProps<PairsPayload>) {
  const [sel, setSel] = useState<Sel | null>(null);
  /** Matched codes: "right" while the pop plays, then "done". */
  const [matched, setMatched] = useState<Record<string, "right" | "done">>({});
  const [miss, setMiss] = useState<{ l: string; r: string } | null>(null);
  const later = useTimers();
  const submit = useRef(onSubmit);
  useEffect(() => {
    submit.current = onSubmit;
  });

  const resolve = (l: string, r: string) => {
    setSel(null);
    if (l !== r) {
      tourSound.nudge();
      setMiss({ l, r });
      later(() => {
        setMiss(null);
        submit.current(pairsMiss(l, r));
      }, MISS_MS);
      return;
    }
    tourSound.match();
    const next = { ...matched, [l]: "right" as const };
    setMatched(next);
    later(() => setMatched((now) => ({ ...now, [l]: "done" })), POP_MS);
    if (payload.left.every((code) => next[code])) {
      later(() => submit.current(pairsAnswer(payload.left)), POP_MS + 140);
    }
  };

  const tap = (side: Side, code: string) => {
    if (disabled || miss || matched[code]) return;
    if (!sel || sel.side === side) {
      tourSound.pop();
      setSel(sel?.side === side && sel.code === code ? null : { side, code });
      return;
    }
    if (side === "L") resolve(code, sel.code);
    else resolve(sel.code, code);
  };

  const stateOf = (side: Side, code: string): string => {
    if (matched[code]) return `is-${matched[code]}`;
    if (miss && (side === "L" ? miss.l : miss.r) === code) return "is-miss";
    return sel?.side === side && sel.code === code ? "is-selected" : "";
  };

  const column = (side: Side, codes: string[]) => (
    <div className={`tx-pairs-col tx-pairs-${side === "L" ? "left" : "right"}`}>
      {codes.map((code) => (
        <button
          key={code}
          type="button"
          className={`ttile tx-pair-card ${stateOf(side, code)}`}
          aria-pressed={sel?.side === side && sel.code === code}
          disabled={disabled || Boolean(matched[code])}
          data-testid={`pair-${side}-${code}`}
          onClick={() => tap(side, code)}
        >
          {side === "R" && <span className="tx-pair-name">{countryName(code)}</span>}
          {side === "L" && payload.leftKind === "flag" && <Flag code={code} size={46} />}
          {side === "L" && payload.leftKind === "outline" && <Outline code={code} size={56} />}
        </button>
      ))}
    </div>
  );

  return (
    <div className="tx tx-pairs" style={{ "--rows": Math.max(payload.left.length, payload.right.length) } as React.CSSProperties}>
      {column("L", payload.left)}
      {column("R", payload.right)}
    </div>
  );
}
