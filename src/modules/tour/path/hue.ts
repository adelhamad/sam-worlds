// A unit's hue can be anything a course author picks. Text drawn ON the hue
// (banner, node number) must stay readable, so pick dark or light ink from the
// hue's luminance, and give text drawn on the dark page a lifted variant.
import type { CSSProperties } from "react";

function channels(hue: string): [number, number, number] | null {
  const hex = hue.trim().replace(/^#/, "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((at) => parseInt(full.slice(at, at + 2), 16) / 255) as [number, number, number];
}

/** WCAG relative luminance, 0 (black) … 1 (white); null when the colour can't be read. */
export function luminance(hue: string): number | null {
  const rgb = channels(hue);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Below this, light ink out-contrasts the near-black ink on the hue. */
const DARK_HUE = 0.18;

export function isDarkHue(hue: string): boolean {
  const lum = luminance(hue);
  return lum !== null && lum < DARK_HUE;
}

/**
 * Inline style for anything painted in a unit's hue. Light hues keep the CSS
 * defaults (dark ink); dark hues get light ink and a lifted hue for text that
 * sits on the navy page.
 */
export function hueStyle(hue: string, extra: CSSProperties = {}): CSSProperties {
  const dark = isDarkHue(hue);
  return {
    ...extra,
    "--hue": hue,
    "--hue-text": dark ? `color-mix(in srgb, ${hue} 45%, #fff)` : hue,
    ...(dark ? { "--hue-ink": `color-mix(in srgb, ${hue} 10%, #fff)` } : {}),
  } as CSSProperties;
}
