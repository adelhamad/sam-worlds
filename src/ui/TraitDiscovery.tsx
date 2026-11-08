import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TRAIT_PHOTOS } from "../content/traits/photoCatalog";
import { speak } from "../engine/feedback/speech";
import { DISCOVERY as text } from "../strings/traitDiscovery";
import "./traitDiscovery.css";

type Place = "unknown" | "adaptation" | "outside";
type Membership = "both" | "only" | null;

/** An unscored, local exploration: the inner collection never replaces the outer. */
export function TraitDiscovery({ stageId }: { stageId: string }) {
  const [step, setStep] = useState(0);
  const [placements, setPlacements] = useState<Partial<Record<number, Place>>>({});
  const [membership, setMembership] = useState<Membership>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const done = step === text.cases.length;
  const discovery = text.cases[Math.min(step, text.cases.length - 1)];
  const photo = TRAIT_PHOTOS[discovery.photo];
  const placement = placements[step];
  const feedback = placement ? discovery.feedback[placement] : "";
  const membershipFeedback = membership === "both" ? text.bothFeedback : text.onlyFeedback;
  const ready = placement === discovery.answer && (step !== 0 || membership === "both");

  function advance() {
    setStep(step + 1);
    setMembership(null);
    heading.current?.focus();
  }

  function place(area: Place) {
    setPlacements({ ...placements, [step]: area });
    if (step === 0) setMembership(null);
  }

  function zone(area: Place, label: string, hint: string) {
    const accessibleArea = area === "outside" ? label : `${text.body}, ${label}`;
    return (
      <div className={`discovery-zone discovery-zone-${area}`}>
        <h4>{label}</h4>
        <p>{hint}</p>
        <ul className="discovery-collection">
          {text.cases.map((item, index) => placements[index] === area && (
            <li key={item.feature} aria-current={!done && index === step ? "true" : undefined}>
              {item.feature}
            </li>
          ))}
        </ul>
        {!done && <button
          type="button"
          className="btn btn-secondary discovery-place"
          aria-label={text.place(discovery.feature, accessibleArea)}
          aria-pressed={placement === area}
          onClick={() => place(area)}
        >{label}</button>}
      </div>
    );
  }

  function readDiscovery() {
    const words = done
      ? [text.done, text.takeaway, text.doneDetail]
      : [text.progress(step + 1), discovery.feature, ...discovery.clues, text.instruction,
        text.body, text.unknown, text.adaptation, text.adaptationHint, text.outside, feedback,
        ...(step === 0 && placement === "adaptation" ? [text.membership, text.both, text.only] : []),
        ...(membership ? [membershipFeedback] : [])];
    speak(words.join(" "));
  }

  return (
    <div className="trait-discovery">
      <div className="discovery-heading">
        <h3 ref={heading} tabIndex={-1}>{done ? text.done : text.progress(step + 1)}</h3>
        <button type="button" className="btn btn-secondary" onClick={readDiscovery}>{text.listen}</button>
      </div>
      {!done && <div className="discovery-evidence">
        <figure>
          <img src={photo.src} alt={photo.alt} width="640" height="480" />
          <figcaption>{discovery.caption}</figcaption>
        </figure>
        <div>
          <h4>{discovery.feature}</h4>
          <p className="discovery-clue-label">{text.evidence}</p>
          {discovery.clues.map((clue) => <p key={clue}>{clue}</p>)}
        </div>
      </div>}
      <p className="discovery-instruction">{done ? text.takeaway : text.instruction}</p>
      <div className="discovery-family">
        <h3>{text.body}</h3>
        <p>{text.bodyHint}</p>
        <div className="discovery-inner">
          {zone("unknown", text.unknown, text.unknownHint)}
          {zone("adaptation", text.adaptation, text.adaptationHint)}
        </div>
      </div>
      {zone("outside", text.outside, text.outsideHint)}
      {!done && <>
        <div className="discovery-feedback" role="status" aria-live="polite" aria-atomic="true">
          {feedback && <p>{feedback}</p>}
        </div>
        {step === 0 && placement === "adaptation" && <fieldset className="discovery-membership">
          <legend>{text.membership}</legend>
          <div className="discovery-actions">
            {(["both", "only"] as const).map((answer) => <button
              key={answer} type="button" className="btn btn-secondary"
              aria-pressed={membership === answer} onClick={() => setMembership(answer)}
            >{text[answer]}</button>)}
          </div>
          <p role="status" aria-live="polite">{membership ? membershipFeedback : ""}</p>
        </fieldset>}
        <button type="button" className="btn btn-primary discovery-next" disabled={!ready} onClick={advance}>
          {step === text.cases.length - 1 ? text.finish : text.next}
        </button>
      </>}
      {done && <>
        <p>{text.doneDetail}</p>
        <div className="discovery-actions">
          <Link className="btn btn-primary" to={`/play/${stageId}`}>{text.start}</Link>
          {stageId !== "traits-01" && <Link className="btn btn-secondary" to="/play/traits-01">{text.beginning}</Link>}
        </div>
      </>}
    </div>
  );
}
