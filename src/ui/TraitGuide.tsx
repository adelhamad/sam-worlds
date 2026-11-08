import { TRAIT_PHOTOS } from "../content/traits/photoCatalog";
import { STR } from "../strings/en";
import { DISCOVERY } from "../strings/traitDiscovery";
import { TraitDiscovery } from "./TraitDiscovery";
import "./traits.css";

/** A nested example makes the subset relationship visible, not an either/or. */
export function TraitGuide({ stageId }: { stageId: string }) {
  const text = STR.traits;
  return (
    <section className="trait-guide panel" aria-labelledby="trait-guide-title">
      <div className="trait-guide-heading">
        <h2 id="trait-guide-title">{DISCOVERY.title}</h2>
      </div>
      <p>{DISCOVERY.intro}</p>
      <p className="discovery-scope">{DISCOVERY.scope}</p>
      <TraitDiscovery stageId={stageId} />
      <section className="discovery-roadmap" aria-labelledby="discovery-roadmap-title">
        <h3 id="discovery-roadmap-title">{DISCOVERY.roadmap}</h3>
        <ol>{DISCOVERY.chapters.map((chapter) => <li key={chapter.title}>
          <strong>{chapter.title}</strong> <span>{chapter.range}</span>
          <p>{chapter.detail}</p>
        </li>)}</ol>
      </section>
      <details className="trait-photo-credits">
        <summary>{text.photoCredits}</summary>
        {Object.entries(TRAIT_PHOTOS).map(([id, image]) => <p key={id}>
          {image.label} · {image.credit} · {image.license}
          <br />{image.sourceUrl}<br />{image.licenseUrl}
        </p>)}
      </details>
    </section>
  );
}
