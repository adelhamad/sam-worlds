// kit-number — look at the things drawn above, type the number on the pad.
// Draft = the typed digits (max 3, no leading zero) once something is typed.
import { useState, type CSSProperties } from "react";
import type { KitNumberPayload } from "../../../engine/kit/types";
import { TOUR } from "../../../strings/tour";
import { tourSound, useDraft, type WidgetProps } from "../exercises/shared";
import { KitItems } from "./KitItems";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const MAX_DIGITS = 3;

export function KitNumber({ payload, disabled, onDraft }: WidgetProps<KitNumberPayload>) {
  const [typed, setTyped] = useState("");
  const [full, setFull] = useState(0);
  useDraft(onDraft, typed === "" ? null : typed);

  const press = (digit: string) => {
    if (disabled) return;
    const next = typed === "0" ? digit : typed + digit;
    if (next.length > MAX_DIGITS) {
      setFull((n) => n + 1); // the display wobbles: it is full
      return;
    }
    tourSound.pop();
    setTyped(next);
  };
  const erase = () => {
    if (disabled || typed === "") return;
    tourSound.pop();
    setTyped(typed.slice(0, -1));
  };

  return (
    <div className="tx kx kx-number">
      <KitItems items={payload.items} caption={payload.caption} />
      <p className="kx-help">{TOUR.kit.numberHelp}</p>
      <div className="kx-entry">
        <output
          key={full}
          className={`kx-display ${typed === "" ? "is-empty" : ""} ${full > 0 ? "is-full" : ""}`}
          aria-label={TOUR.kit.yourNumber}
          data-testid="kit-number-display"
        >
          {typed === "" ? "?" : typed}
        </output>
        <button
          type="button"
          className="tbtn kx-erase"
          disabled={disabled || typed === ""}
          onClick={erase}
          aria-label={TOUR.kit.erase}
          data-testid="num-back"
        >
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
            <path
              d="M9 5.5h10a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H9L3 12Z M11.5 9.5l5 5 M16.5 9.5l-5 5"
              fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="kx-pad">
        {KEYS.map((digit, i) => (
          <button
            key={digit}
            type="button"
            className="tbtn kx-key"
            style={{ "--i": i } as CSSProperties}
            disabled={disabled}
            onClick={() => press(digit)}
            data-testid={`num-${digit}`}
          >
            {digit}
          </button>
        ))}
      </div>
    </div>
  );
}
