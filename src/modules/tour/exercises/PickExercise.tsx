// pick — hear / see a country, tap its card. Draft = the tapped country code.
import { useEffect, useState } from "react";
import { speak, speechSupported } from "../../../engine/feedback/speech";
import { countryName } from "../../../engine/tour/countries";
import type { PickPayload } from "../../../engine/tour/types";
import { useGame } from "../../../state/store";
import { Flag } from "../../../ui/tour/Flag";
import { Outline } from "./Outline";
import { tourSound, useDraft, type WidgetProps } from "./shared";

export function PickExercise({ payload, disabled, onDraft }: WidgetProps<PickPayload>) {
  const soundOn = useGame((s) => s.soundOn);
  const [picked, setPicked] = useState<string | null>(null);
  useDraft(onDraft, picked);

  const name = countryName(payload.code);
  const spoken = payload.ask === "name" && soundOn && speechSupported();
  useEffect(() => {
    if (spoken) speak(name);
    // Speak once per question (the widget is keyed by question id).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (code: string) => {
    if (disabled) return;
    tourSound.pop();
    setPicked(code);
  };

  return (
    <div className="tx tx-pick">
      {payload.ask === "flag" && <div className="tx-hero"><Flag code={payload.code} size={92} /></div>}
      {payload.ask === "outline" && <div className="tx-hero"><Outline code={payload.code} size={124} /></div>}
      <div className="tx-pick-grid">
        {payload.options.map((code) => (
          <button
            key={code}
            type="button"
            className={`ttile tx-pick-card ${picked === code ? "is-selected" : ""}`}
            aria-pressed={picked === code}
            disabled={disabled}
            data-testid={`pick-${code}`}
            onClick={() => choose(code)}
          >
            {payload.show === "flag" ? <Flag code={code} size={72} /> : <Outline code={code} size={92} />}
          </button>
        ))}
      </div>
    </div>
  );
}
