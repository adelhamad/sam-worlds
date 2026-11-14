// The SOLVED view shown in the amber "Almost — look at this." sheet after a
// miss. It teaches the fact (flag + name + where it is) rather than just
// revealing an answer; the missed question is already gone by the time it shows.
import { COUNTRY_BY_CODE } from "../../../engine/generators/geography";
import { continentOf, countryName } from "../../../engine/tour/countries";
import { PAINT_COLOR_BY_ID, PAINT_FLAGS, paintWeights } from "../../../engine/tour/paintFlags";
import {
  tourPayload, type MapPayload, type PairsPayload, type PaintPayload, type SortPayload,
} from "../../../engine/tour/types";
import { TOUR } from "../../../strings/tour";
import { Flag } from "../../../ui/tour/Flag";
import type { TeachProps } from "./contract";
import { FlagBands } from "./FlagBands";
import { locatorView } from "./mapGeo";
import { ContinentIcon, Outline } from "./Outline";
import { TourMap } from "./TourMap";

const S = TOUR.exercise;

/** flag + name + continent, next to a small map with the country lit. */
function CountryCard({ code, spelled = false }: { code: string; spelled?: boolean }) {
  return (
    <div className="tx-teach-country">
      <div className="tx-teach-facts">
        <Flag code={code} size={56} />
        {spelled && <span className="tx-teach-note">{S.spells}</span>}
        <strong className={`tx-teach-name ${spelled ? "is-spelled" : ""}`}>{countryName(code)}</strong>
        <span className="tx-teach-note">{S.isIn(continentOf(code))}</span>
      </div>
      <TourMap view={locatorView(code)} lit={code} className="tx-teach-map" />
    </div>
  );
}

function MapTeach({ payload, submitted }: { payload: MapPayload; submitted?: string }) {
  const tapped = submitted && submitted !== payload.code && COUNTRY_BY_CODE.has(submitted) ? submitted : null;
  return (
    <div className="tx-teach-country">
      <div className="tx-teach-facts">
        {tapped && <span className="tx-teach-note is-tapped">{S.thatWas(countryName(tapped))}</span>}
        <Flag code={payload.code} size={52} />
        <strong className="tx-teach-name">{S.thisIs(countryName(payload.code))}</strong>
        <span className="tx-teach-note">{S.isIn(continentOf(payload.code))}</span>
      </div>
      <TourMap view={payload.view} lit={payload.code} ghost={tapped} className="tx-teach-map" />
    </div>
  );
}

function PairRow({ code, kind }: { code: string; kind: PairsPayload["leftKind"] }) {
  return (
    <div className="tx-teach-pair">
      <span className="tx-teach-pair-pic">
        {kind === "outline" && <Outline code={code} size={48} />}
        <Flag code={code} size={40} />
      </span>
      <span className="tx-teach-link" aria-label={S.goesWith}>↔</span>
      <strong className="tx-teach-pair-name">{countryName(code)}</strong>
    </div>
  );
}

function PairsTeach({ payload, submitted }: { payload: PairsPayload; submitted?: string }) {
  const [, l, r] = /^miss:([^>]+)>(.+)$/.exec(submitted ?? "") ?? [];
  const codes = l && COUNTRY_BY_CODE.has(l)
    ? [l, ...(r && r !== l && COUNTRY_BY_CODE.has(r) ? [r] : [])]
    : payload.left;
  return (
    <div className={`tx-teach-pairs ${codes.length > 2 ? "is-grid" : ""}`}>
      {codes.map((code) => <PairRow key={code} code={code} kind={payload.leftKind} />)}
    </div>
  );
}

function SortTeach({ payload }: { payload: SortPayload }) {
  return (
    <div className={`tx-teach-sort ${payload.buckets.length >= 3 ? "is-narrow" : ""}`} style={{ "--cols": payload.buckets.length } as React.CSSProperties}>
      {payload.buckets.map((bucket) => (
        <div key={bucket} className="tx-teach-bucket">
          <div className="tx-sort-label">
            <ContinentIcon continent={bucket} size={28} />
            <span>{bucket}</span>
          </div>
          {payload.cards.filter((code) => continentOf(code) === bucket).map((code) => (
            <div key={code} className="tx-teach-chip">
              <Flag code={code} size={24} />
              <span>{countryName(code)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function PaintTeach({ payload, answer }: { payload: PaintPayload; answer: string }) {
  const flag = PAINT_FLAGS[payload.code];
  const colors = flag?.colors ?? answer.split(",");
  return (
    <div className="tx-teach-paint">
      <div className="tx-teach-facts">
        <FlagBands dir={payload.dir} weights={flag ? paintWeights(flag) : payload.weights} colors={colors} className="tx-teach-flag" />
        <strong className="tx-teach-name">{countryName(payload.code)}</strong>
      </div>
      <ol className="tx-teach-colors">
        {colors.map((id, i) => (
          <li key={i}>
            <span className="tx-teach-dot" style={{ background: PAINT_COLOR_BY_ID.get(id)?.hex }} />
            {PAINT_COLOR_BY_ID.get(id)?.name ?? id}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The solved view shown in the "Almost — look at this" sheet after a miss. */
export function TourTeach({ question, submitted }: TeachProps) {
  const payload = tourPayload(question);
  if (!payload) return null;
  let body: React.ReactNode;
  switch (payload.tour) {
    case "pick":
      body = <CountryCard code={payload.code} />;
      break;
    case "build":
      body = <CountryCard code={payload.code} spelled />;
      break;
    case "map":
      body = <MapTeach payload={payload} submitted={submitted} />;
      break;
    case "pairs":
      body = <PairsTeach payload={payload} submitted={submitted} />;
      break;
    case "sort":
      body = <SortTeach payload={payload} />;
      break;
    default:
      body = <PaintTeach payload={payload} answer={question.answer} />;
  }
  return <div className="tx-teach" data-testid={`teach-${payload.tour}`}>{body}</div>;
}
