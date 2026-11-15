// Rasterises Arabic letters with the app's own font in headless Chrome, the
// same way the app draws the guide letter (canvas/SVG text, centre-anchored,
// alphabetic baseline). Returns one alpha mask per letter at RASTER_SCALE
// pixels per design unit. Part of scripts/build-arabic-strokes.mjs.
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

export const FONT_FILE = "node_modules/@fontsource-variable/noto-sans-arabic/files/noto-sans-arabic-arabic-wght-normal.woff2";
export const FONT_FAMILY = "Noto Sans Arabic Variable";

export function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  const found = candidates.find((candidate) => candidate && fs.existsSync(candidate));
  if (!found) throw new Error("Chrome not found — set CHROME_PATH");
  return found;
}

function pageHtml(fontBase64) {
  return `<!doctype html><html><head><style>
@font-face { font-family: '${FONT_FAMILY}'; font-weight: 100 900;
  src: url(data:font/woff2;base64,${fontBase64}) format('woff2-variations'); }
body { margin: 0; background: #fff; }
</style></head><body><canvas id="c"></canvas></body></html>`;
}

/** Opens a page with the font loaded; returns { browser, page }. */
export async function openFontPage(root) {
  const font = fs.readFileSync(path.join(root, FONT_FILE)).toString("base64");
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "new" });
  const page = await browser.newPage();
  await page.setContent(pageHtml(font));
  const ok = await page.evaluate(async (family) => {
    await document.fonts.load(`500 100px "${family}"`, "ب");
    return document.fonts.check(`500 100px "${family}"`, "ب");
  }, FONT_FAMILY);
  if (!ok) throw new Error("font failed to load in the build page");
  return { browser, page };
}

/** Outline bounding boxes at a 1000px font size, relative to a centre anchor on the baseline. */
export async function measureLetters(page, chars, weight) {
  return page.evaluate((list, family, w) => {
    const ctx = document.getElementById("c").getContext("2d");
    ctx.font = `${w} 1000px "${family}"`;
    ctx.textAlign = "center";
    ctx.direction = "rtl";
    return list.map((ch) => {
      const m = ctx.measureText(ch);
      return { left: m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight, ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent };
    });
  }, chars, FONT_FAMILY, weight);
}

/**
 * Draws one letter into a (box*scale)² canvas and returns its alpha mask
 * thresholded at 50 % (1 = ink) as a Uint8Array, row-major.
 */
export async function rasterLetter(page, { char, x, baseline, fontSize, weight, box, scale }) {
  const b64 = await page.evaluate((opts, family) => {
    const size = opts.box * opts.scale;
    const canvas = document.getElementById("c");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size, size);
    ctx.setTransform(opts.scale, 0, 0, opts.scale, 0, 0);
    ctx.font = `${opts.weight} ${opts.fontSize}px "${family}"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.direction = "rtl";
    ctx.fillStyle = "#000";
    ctx.fillText(opts.char, opts.x, opts.baseline);
    const data = ctx.getImageData(0, 0, size, size).data;
    const bits = new Uint8Array(size * size);
    for (let i = 0; i < bits.length; i++) bits[i] = data[i * 4 + 3] >= 128 ? 1 : 0;
    let s = "";
    for (let i = 0; i < bits.length; i += 8192) s += String.fromCharCode(...bits.subarray(i, i + 8192));
    return btoa(s);
  }, { char, x, baseline, fontSize, weight, box, scale }, FONT_FAMILY);
  return new Uint8Array(Buffer.from(b64, "base64"));
}
