import type { Question } from "../../engine/generators/types";
import { GeoMap } from "../../ui/GeoMap";
import { StatCompare, type StatPair } from "../../ui/StatCompare";

export function GeoStatMedia({ q }: { q: Question }) {
  return <>
    {typeof q.payload?.bigSymbol === "string" && <div className="big-symbol">{q.payload.bigSymbol}</div>}
    {typeof q.payload?.mapCode === "string" && (
      <GeoMap code={q.payload.mapCode} style={q.payload.mapStyle as "outline" | "pin" | "world"} />
    )}
    {q.payload?.statPair && <StatCompare pair={q.payload.statPair as unknown as StatPair} />}
    {typeof q.payload?.statNote === "string" && <div className="stat-note">{q.payload.statNote}</div>}
  </>;
}
