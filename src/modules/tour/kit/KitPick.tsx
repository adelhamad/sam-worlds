// kit-pick — tap the one right card (tap another to change). Draft = its id.
import { useState } from "react";
import type { KitPickPayload } from "../../../engine/kit/types";
import { TOUR } from "../../../strings/tour";
import { tourSound, useDraft, type WidgetProps } from "../exercises/shared";
import { KitCard } from "./KitCard";
import { groupFit } from "./fit";

export function KitPick({ payload, disabled, onDraft }: WidgetProps<KitPickPayload>) {
  const [picked, setPicked] = useState<string | null>(null);
  useDraft(onDraft, picked);
  const list = payload.layout === "list";
  const fit = groupFit(payload.options.map((item) => item.label));

  const choose = (id: string) => {
    if (disabled) return;
    tourSound.pop();
    setPicked(id);
  };

  return (
    <div className={`tx kx kx-pick ${list ? "is-list" : "is-grid"}`}>
      {payload.hero && <KitCard item={payload.hero} shape="hero" className="kx-hero" />}
      <p className="kx-help">{TOUR.kit.pickHelp}</p>
      <div className={list ? "kx-pick-list" : "kx-pick-grid"}>
        {payload.options.map((item, i) => (
          <KitCard
            key={item.id}
            item={item}
            shape={list ? "row" : "tile"}
            fit={fit}
            className={`kx-option ${picked === item.id ? "is-selected" : ""}`}
            style={{ "--i": i } as React.CSSProperties}
            aria-pressed={picked === item.id}
            disabled={disabled}
            data-testid={`kit-opt-${item.id}`}
            onClick={() => choose(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
