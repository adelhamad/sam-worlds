import { TRAIT_IMAGES, type TraitImageKey } from "../content/traits/images";
import { STR } from "../strings/en";
import { speak } from "../engine/feedback/speech";
import { Link } from "react-router-dom";
import "./traits.css";

/** A nested example makes the subset relationship visible, not an either/or. */
export function TraitGuide({ stageId }: { stageId: string }) {
  const text = STR.traits;
  const turtle = TRAIT_IMAGES.turtle;
  return (
    <section className="trait-guide panel" aria-labelledby="trait-guide-title">
      <div className="trait-guide-heading">
        <h2 id="trait-guide-title">{text.guideTitle}</h2>
        <Link className="btn btn-primary" to={`/play/${stageId}`}>{text.startLesson}</Link>
        <button className="btn btn-secondary" onClick={() => speak([
          text.traitLabel, text.traitDefinition, text.adaptationLabel, text.adaptationDefinition,
          text.guideExample, text.guideConnection, text.guideLearning, text.guideChange,
        ].join(" "))}>{text.guideListen}</button>
      </div>
      <div className="trait-guide-body">
        <figure className="trait-guide-photo">
          <img src={turtle.src} alt={turtle.alt} width="640" height="480" />
          <figcaption>{text.guideExample} {text.guideConnection}</figcaption>
        </figure>
        <div className="trait-family">
          <h3>{text.traitLabel}</h3>
          <p>{text.traitDefinition}</p>
          <div className="trait-adaptation">
            <h3>{text.adaptationLabel}</h3>
            <p>{text.adaptationDefinition}</p>
            <strong>{text.guideReminder}</strong>
          </div>
          <p>{text.guideLearning}</p>
          <p>{text.guideChange}</p>
        </div>
      </div>
      <details className="trait-more-examples">
        <summary>{text.moreExamples}</summary>
        <div className="trait-example-photos">
          {(["cactus", "katydid", "polarBear"] as const).map((id) => <figure key={id}>
            <img src={TRAIT_IMAGES[id].src} alt={TRAIT_IMAGES[id].alt} width="320" height="240" loading="lazy" />
            <figcaption>{TRAIT_IMAGES[id].caption}</figcaption>
          </figure>)}
        </div>
      </details>
      <details className="trait-photo-credits">
        <summary>{text.photoCredits}</summary>
        {Object.entries(TRAIT_IMAGES).map(([id, image]) => <p key={id}>
          {image.caption} · {image.credit} · {image.license}
          <br />{image.sourceUrl}<br />{image.licenseUrl}
        </p>)}
      </details>
    </section>
  );
}

// Exact aliases only: a painted turtle must not illustrate a sea turtle's
// flippers, nor a katydid stand in for an unrelated leaf insect.
const photoAliases: Record<string, TraitImageKey> = {
  turtle: "turtle", paintedturtle: "turtle", duck: "duck", mallardduck: "duck",
  cactus: "cactus", polarbear: "polarBear", katydid: "katydid", giraffe: "giraffe",
};

export function TraitPhotos({ organisms }: { organisms: unknown }) {
  if (!Array.isArray(organisms)) return null;
  const images = organisms.flatMap((organism) => {
    if (typeof organism !== "string") return [];
    const name = organism.toLowerCase().replace(/^(a|an|the) /, "").replace(/[^a-z]/g, "");
    const id = photoAliases[name];
    return id ? [{ id, image: TRAIT_IMAGES[id] }] : [];
  });
  if (!images.length) return null;
  return <div className="trait-question-photos">
    {images.map(({ id, image }, index) => <figure key={`${id}-${index}`}>
      <img src={image.src} alt={image.alt} width="320" height="240" />
      <figcaption>{image.caption}</figcaption>
    </figure>)}
  </div>;
}
