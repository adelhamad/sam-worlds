import { TRAIT_PHOTOS } from "../content/traits/photoCatalog";
import "./traits.css";

/** Reference portraits have neutral names; they never print the answer's job. */
export function TraitPhotos({ pictureIds }: { pictureIds: unknown }) {
  if (!Array.isArray(pictureIds)) return null;
  const pictures = pictureIds.flatMap((id) => typeof id === "string" && TRAIT_PHOTOS[id]
    ? [{ id, photo: TRAIT_PHOTOS[id] }] : []);
  if (!pictures.length) return null;
  return <div className={`trait-question-photos trait-photos-${pictures.length}`}>
    {pictures.map(({ id, photo }) => <figure key={id}>
      <img src={photo.src} alt={photo.alt} width="320" height="240" />
      <figcaption>{photo.label}</figcaption>
    </figure>)}
  </div>;
}
