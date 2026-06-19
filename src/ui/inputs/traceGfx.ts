// Canvas drawing + scoring for the Trace It world. The guide (a number, letter
// or shape) and the child's ink are each rasterized to a coarse grid; the score
// is how much of the guide was covered vs how much ink strayed off it.
export const SIZE = 300; // internal canvas resolution
export const INK_W = 22; // ink line width
const GRID = 44; // scoring grid resolution

export type Stroke = Array<[number, number]>;

export function drawShapePath(ctx: CanvasRenderingContext2D, shape: string): void {
  const c = SIZE / 2;
  const r = SIZE * 0.36;
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(c, c, r, 0, Math.PI * 2);
  } else if (shape === "square") {
    ctx.rect(c - r, c - r, r * 2, r * 2);
  } else if (shape === "triangle") {
    ctx.moveTo(c, c - r);
    ctx.lineTo(c + r, c + r);
    ctx.lineTo(c - r, c + r);
    ctx.closePath();
  } else if (shape === "heart") {
    ctx.moveTo(c, c + r);
    ctx.bezierCurveTo(c - r * 1.4, c - r * 0.3, c - r * 0.5, c - r * 1.1, c, c - r * 0.2);
    ctx.bezierCurveTo(c + r * 0.5, c - r * 1.1, c + r * 1.4, c - r * 0.3, c, c + r);
    ctx.closePath();
  } else {
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI / 5) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.45;
      const x = c + Math.cos(ang) * rad;
      const y = c + Math.sin(ang) * rad;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
}

function offscreenCtx(): CanvasRenderingContext2D {
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;
  return c.getContext("2d") as CanvasRenderingContext2D;
}

function gridFrom(ctx: CanvasRenderingContext2D): Uint8Array {
  const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
  const grid = new Uint8Array(GRID * GRID);
  const cell = SIZE / GRID;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (data[(y * SIZE + x) * 4 + 3] > 40) {
        grid[Math.floor(y / cell) * GRID + Math.floor(x / cell)] = 1;
      }
    }
  }
  return grid;
}

function guideGrid(glyph: string, kind: string): Uint8Array {
  const ctx = offscreenCtx();
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  if (kind === "shape") {
    ctx.lineWidth = 28;
    ctx.lineJoin = "round";
    drawShapePath(ctx, glyph);
    ctx.stroke();
  } else {
    ctx.font = 'bold 240px "Trebuchet MS", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, SIZE / 2, SIZE / 2 + 12);
  }
  return gridFrom(ctx);
}

export function inkGrid(strokes: Stroke[]): Uint8Array {
  const ctx = offscreenCtx();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = INK_W;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const st of strokes) {
    if (!st.length) continue;
    ctx.beginPath();
    st.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (st.length === 1) ctx.lineTo(st[0][0] + 0.5, st[0][1]);
    ctx.stroke();
  }
  return gridFrom(ctx);
}

function near(grid: Uint8Array, gx: number, gy: number): boolean {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = gx + dx;
      const y = gy + dy;
      if (x >= 0 && x < GRID && y >= 0 && y < GRID && grid[y * GRID + x]) return true;
    }
  }
  return false;
}

export interface TraceScore {
  coverage: number;
  stray: number;
  pass: boolean;
}

export function scoreTrace(glyph: string, kind: string, strokes: Stroke[]): TraceScore {
  const guide = guideGrid(glyph, kind);
  const ink = inkGrid(strokes);
  let guideOn = 0;
  let covered = 0;
  let inkOn = 0;
  let strayInk = 0;
  for (let i = 0; i < guide.length; i++) {
    const gx = i % GRID;
    const gy = (i / GRID) | 0;
    if (guide[i]) {
      guideOn++;
      if (near(ink, gx, gy)) covered++;
    }
    if (ink[i]) {
      inkOn++;
      if (!near(guide, gx, gy)) strayInk++;
    }
  }
  const coverage = guideOn ? covered / guideOn : 0;
  const stray = inkOn ? strayInk / inkOn : 1;
  return { coverage, stray, pass: coverage >= 0.5 && stray <= 0.55 && inkOn > 6 };
}
