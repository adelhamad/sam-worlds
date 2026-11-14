// map — tap the country on a zoomed map. Draft = the tapped country code.
import { useState } from "react";
import type { MapPayload } from "../../../engine/tour/types";
import { TOUR } from "../../../strings/tour";
import { Flag } from "../../../ui/tour/Flag";
import { TourMap } from "./TourMap";
import { tourSound, useDraft, type WidgetProps } from "./shared";

export function MapExercise({ payload, disabled, onDraft }: WidgetProps<MapPayload>) {
  const [picked, setPicked] = useState<string | null>(null);
  useDraft(onDraft, picked);

  return (
    <div className="tx tx-mapx">
      {payload.ask === "flag" && <div className="tx-hero tx-hero-small"><Flag code={payload.code} size={72} /></div>}
      <TourMap
        view={payload.view}
        targets={payload.targets}
        selected={picked}
        disabled={disabled}
        spotLabel={TOUR.exercise.mapSpot}
        onPick={(code) => {
          if (code !== picked) tourSound.place();
          setPicked(code);
        }}
      />
    </div>
  );
}
