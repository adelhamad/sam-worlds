// Backdrop land for the tap-the-map exercise: the territories that are NOT in
// countries.json (Russia, Türkiye, Indonesia, Greenland…), joined into one SVG
// path in the same 360×180 world space as `country.worldPath`, so the map has
// no holes. Built by scripts/build-land-backdrop.py from Natural Earth 110m.
import land from "../../content/geography/land.json";

export const LAND_PATH: string = land.path;
