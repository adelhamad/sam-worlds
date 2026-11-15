// lang-give — Pogo asks for a thing in the language; the child hands him its
// picture (tap a picture, then tap Pogo). Self-submitting: the hand-over is
// the answer (the item's id).
import { useEffect, useState } from "react";
import type { GivePayload } from "../../../engine/lang/types";
import { LANG } from "../../../strings/lang";
import { Icon } from "../../../ui/icons/Icon";
import { Pogo } from "../../../ui/tour/Pogo";
import { tourSound, type WidgetProps } from "../exercises/shared";
import { PhraseFace } from "./LangFaces";
import { useVoice } from "./useVoice";

export function LangGive({ payload, disabled, onSubmit }: WidgetProps<GivePayload>) {
  const { canSay, say } = useVoice(payload.lang);
  const [held, setHeld] = useState<string | null>(null);
  const [given, setGiven] = useState(false);
  const { ask } = payload;
  const audible = canSay(ask);

  useEffect(() => {
    if (!audible) return;
    const timer = window.setTimeout(() => say(ask), 500);
    return () => window.clearTimeout(timer);
  }, [ask, audible, say]);

  const hand = () => {
    if (disabled || given || !held) return;
    tourSound.place();
    setGiven(true);
    onSubmit(held);
  };

  return (
    <div className="tx lx lx-give" data-testid="lang-give">
      <button type="button" className="lx-give-pogo" onClick={hand} aria-label={LANG.engine.give} data-testid="lang-give-pogo">
        <Pogo mood={held ? "wow" : "talk"} size={110} />
        <span className="lx-bubble" onClick={(event) => { event.stopPropagation(); say(ask); }}>
          <PhraseFace card={ask} lang={payload.lang} />
          <Icon name="sound" size={22} mono />
        </span>
      </button>
      <div className="lx-opts is-grid">
        {payload.items.map((item) => (
          <button
            key={item.id} type="button" className={`ttile lx-opt lx-give-item ${held === item.id ? "is-selected" : ""}`}
            disabled={disabled || given} aria-pressed={held === item.id} data-testid={`lang-item-${item.id}`}
            onClick={() => { tourSound.pop(); setHeld(item.id); }}
          >
            {item.art && <Icon name={item.art} size={64} />}
          </button>
        ))}
      </div>
    </div>
  );
}
