// The SOLVED view inside the amber "Almost — look at this." sheet after a kit
// miss: the template's warm `explain` line first, then the answer itself, small
// and calm. The sheet already frames it (.tl-teach), so no extra panel here.
import type { CSSProperties } from "react";
import type {
  KitBuildPayload, KitItem, KitNumberPayload, KitOrderPayload, KitPairsPayload, KitPickPayload, KitSortPayload,
} from "../../../engine/kit/types";
import { kitPayload } from "../../../engine/kit/types";
import { TOUR } from "../../../strings/tour";
import type { TeachProps } from "../exercises/contract";
import { stripOf } from "./art";
import { KitArrow } from "./KitArtView";
import { KitCard } from "./KitCard";
import { KitItems } from "./KitItems";
import { byId, parseMiss, parseOrder, parseSort } from "./parse";
import "./kit.css";
import "./kitTeach.css";

const S = TOUR.kit;

function PickTeach({ payload, answer, submitted }: { payload: KitPickPayload; answer: string; submitted?: string }) {
  const right = payload.options.find((item) => item.id === answer);
  const picked = submitted && submitted !== answer ? payload.options.find((item) => item.id === submitted) : undefined;
  if (!right) return null;
  return (
    <div className="kx-teach-pick">
      <div className="kx-teach-answer">
        {payload.hero && (
          <>
            <KitCard item={payload.hero} shape="chip" still lines={1} className="kx-teach-hero" />
            <KitArrow />
          </>
        )}
        <KitCard item={right} shape="row" still className="is-right kx-teach-right" />
      </div>
      {picked && (
        <div className="kx-teach-picked">
          <span className="kx-teach-note">{S.youPicked}</span>
          <KitCard item={picked} shape="chip" still lines={2} className="kx-teach-dim" />
        </div>
      )}
    </div>
  );
}

function PairRow({ left, right }: { left: KitItem; right: KitItem }) {
  return (
    <div className="kx-teach-pair">
      <KitCard item={left} shape="chip" still />
      <KitArrow both label={S.goesWith} />
      <KitCard item={right} shape="chip" still className="is-right" />
    </div>
  );
}

function PairsTeach({ payload, submitted }: { payload: KitPairsPayload; submitted?: string }) {
  const lefts = byId(payload.left);
  const rights = byId(payload.right);
  const miss = parseMiss(submitted);
  let ids = payload.left.map((item) => item.id);
  if (miss && lefts.has(miss.left)) {
    // The missed card's partner first; then the tapped card's own partner, if it has one.
    ids = [miss.left, ...(miss.right !== miss.left && lefts.has(miss.right) ? [miss.right] : [])];
  }
  const rows = ids.flatMap((id) => {
    const left = lefts.get(id);
    const right = rights.get(id);
    return left && right ? [{ left, right }] : [];
  });
  return (
    <div className={`kx-teach-pairs ${rows.length > 2 ? "is-grid" : ""}`}>
      {rows.map((row) => <PairRow key={row.left.id} left={row.left} right={row.right} />)}
    </div>
  );
}

function OrderTeach({ payload, answer }: { payload: KitOrderPayload; answer: string }) {
  const cards = byId(payload.cards);
  const steps = parseOrder(answer).flatMap((id) => cards.get(id) ?? []);
  const strip = stripOf(steps);
  return (
    <ol className={`kx-teach-order ${steps.length >= 5 ? "is-long" : ""} ${strip ? "is-strip" : ""}`} style={{ "--n": steps.length } as CSSProperties}>
      {steps.map((card, i) => (
        <li key={card.id} style={{ "--i": i } as CSSProperties}>
          <span className="kx-slot-num" aria-hidden="true">{i + 1}</span>
          <KitCard item={card} shape="chip" still lines={2} />
        </li>
      ))}
    </ol>
  );
}

function SortTeach({ payload, answer }: { payload: KitSortPayload; answer: string }) {
  const truth = parseSort(answer);
  const cards = byId(payload.cards);
  return (
    <div className={`kx-teach-sort ${payload.buckets.length >= 3 ? "is-narrow" : ""}`} style={{ "--cols": payload.buckets.length } as CSSProperties}>
      {payload.buckets.map((bucket) => (
        <div key={bucket.id} className="kx-teach-bucket">
          <KitCard item={bucket} shape="chip" still lines={2} className="kx-bucket-head" />
          {(truth.get(bucket.id) ?? []).flatMap((id) => cards.get(id) ?? []).map((card) => (
            <KitCard key={card.id} item={card} shape="chip" still lines={2} className="kx-teach-chip" />
          ))}
        </div>
      ))}
    </div>
  );
}

function BuildTeach({ payload, answer }: { payload: KitBuildPayload; answer: string }) {
  return (
    <div className="kx-teach-build">
      {payload.hero && <KitCard item={payload.hero} shape="chip" still className="kx-teach-hero" />}
      <div className="kx-teach-words">
        {answer.split(" ").filter(Boolean).map((word, i) => (
          <span key={i} className="ttile kx-word is-still is-right" style={{ "--i": i } as CSSProperties}>{word}</span>
        ))}
      </div>
    </div>
  );
}

function NumberTeach({ payload, answer }: { payload: KitNumberPayload; answer: string }) {
  return (
    <div className="kx-teach-number">
      <KitItems items={payload.items} caption={payload.caption} small />
      <span className="kx-teach-equals" aria-hidden="true">=</span>
      <strong className="kx-teach-big">{answer}</strong>
    </div>
  );
}

function body(payload: NonNullable<ReturnType<typeof kitPayload>>, answer: string, submitted?: string) {
  switch (payload.tour) {
    case "kit-pick":
      return <PickTeach payload={payload} answer={answer} submitted={submitted} />;
    case "kit-pairs":
      return <PairsTeach payload={payload} submitted={submitted} />;
    case "kit-order":
      return <OrderTeach payload={payload} answer={answer} />;
    case "kit-sort":
      return <SortTeach payload={payload} answer={answer} />;
    case "kit-build":
      return <BuildTeach payload={payload} answer={answer} />;
    default:
      return <NumberTeach payload={payload} answer={answer} />;
  }
}

/** The solved view shown in the "Almost — look at this." sheet after a miss. */
export function KitTeach({ question, submitted }: TeachProps) {
  const payload = kitPayload(question);
  if (!payload) return null;
  return (
    <div className="tx-teach kx-teach" data-testid={`kit-teach-${payload.tour}`}>
      {payload.explain && <p className="kx-teach-explain">{payload.explain}</p>}
      {body(payload, question.answer, submitted)}
    </div>
  );
}
