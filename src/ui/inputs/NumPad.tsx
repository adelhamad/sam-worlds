import { useState } from "react";
import { sfx } from "../../engine/feedback/audio";

const PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "OK"];

interface Props {
  disabled: boolean;
  onSubmit: (value: string) => void;
}

export function NumPad({ disabled, onSubmit }: Props) {
  const [typed, setTyped] = useState("");

  function onKey(k: string) {
    if (k === "OK") {
      if (typed) {
        onSubmit(typed);
        setTyped("");
      }
      return;
    }
    sfx.tap();
    if (k === "⌫") setTyped((t) => t.slice(0, -1));
    else setTyped((t) => (t.length >= 4 ? t : t + k));
  }

  return (
    <>
      <div className="typed-display">{typed || "▁"}</div>
      <div className="numpad">
        {PAD_KEYS.map((k) => (
          <button
            key={k}
            className={`btn pad-key ${k === "OK" ? "pad-ok" : ""}`}
            disabled={disabled}
            onClick={() => onKey(k)}
          >
            {k}
          </button>
        ))}
      </div>
    </>
  );
}
