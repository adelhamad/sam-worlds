import type { Question } from "../engine/generators/types";
import type { DetectiveBoard } from "../content/traits/detectiveTypes";
import { TRAIT_PHOTOS } from "../content/traits/photoCatalog";
import { speak } from "../engine/feedback/speech";
import { DETECTIVE_FEEDBACK } from "../strings/traitDetectiveFeedback";
import "./traitDetectiveReview.css";

export interface DetectiveReview {
  question: Question;
  correct: boolean;
  stageId: string;
  submitted?: string;
}

export function TraitDetectiveReview({ review, disabled, finished, onNext }: {
  review: DetectiveReview; disabled: boolean; finished: boolean; onNext: () => void;
}) {
  const board = review.question.payload?.traitDetective as DetectiveBoard;
  const text = DETECTIVE_FEEDBACK;
  const placed = Object.fromEntries((review.submitted ?? "").split("|").filter(Boolean).map((entry) => entry.split("=")));
  return <section className="question-card panel detective-review" aria-labelledby="detective-review-title">
    <h2 id="detective-review-title">{review.correct ? text.correct : text.look}</h2>
    {board.claim && <div className="detective-review-stamps">
      <h3>{board.claim.title}</h3>
      <p>{text.supported}</p>
      <strong>{board.solution["stamp-adaptation"] === "yes" ? text.both : text.traitSupported}</strong>
    </div>}
    <p>{text.readClues}</p>
    <div className="detective-review-cards">
      {board.cards.map((card) => {
        const photo = card.photo ? TRAIT_PHOTOS[card.photo] : undefined;
        const zone = board.zones.find((item) => item.id === board.solution[card.id]);
        const chosen = board.zones.find((item) => item.id === placed[card.id]);
        return <article key={card.id}>
          {photo && <img src={photo.src} alt={photo.alt} width="96" height="80" />}
          <div><h3>{card.title}</h3>
            {chosen && chosen.id !== zone?.id && <p>{text.youPlaced(chosen.title)}</p>}
            <strong>{zone?.title}</strong><p>{card.explanation ?? card.clue}</p></div>
        </article>;
      })}
    </div>
    <p className="detective-review-reason">{board.takeaway ?? board.explanation}</p>
    <div className="input-actions">
      <button className="btn btn-secondary" onClick={() => speak(board.explanation)}>{text.listen}</button>
      <button className="btn btn-primary" disabled={disabled} onClick={onNext}>{finished ? text.finish : text.next}</button>
    </div>
  </section>;
}
