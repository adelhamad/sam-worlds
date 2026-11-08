import { TRAIT_IMAGES } from "./images";
import { PHOTOS_ANIMALS } from "./photosAnimals";
import { PHOTOS_PLANTS } from "./photosPlants";
import { PHOTOS_EXAMPLES } from "./photosExamples";
import type { TraitPhoto } from "./photoTypes";

export const TRAIT_PHOTOS: Record<string, TraitPhoto> = {
  turtle: { ...TRAIT_IMAGES.turtle, label: "Turtle" },
  duck: { ...TRAIT_IMAGES.duck, label: "Duck" },
  cactus: { ...TRAIT_IMAGES.cactus, label: "Cactus" },
  "polar-bear": { ...TRAIT_IMAGES.polarBear, label: "Polar bear" },
  katydid: { ...TRAIT_IMAGES.katydid, label: "Leaf-like bug" },
  giraffe: { ...TRAIT_IMAGES.giraffe, label: "Giraffe" },
  ...PHOTOS_ANIMALS,
  ...PHOTOS_PLANTS,
  ...PHOTOS_EXAMPLES,
};
