// Optional debug sheets for the stroke builder (`--debug <dir>`): the glyph,
// its pruned skeleton (grey), line ends (green), branch points (red) and the
// routed strokes, numbered, with a start dot and an arrow at the end.
export async function writeDebugSheets(page, letters, layout, dir) {
  const PER = 8;
  for (let part = 0; part * PER < letters.length; part++) {
    const subset = letters.slice(part * PER, part * PER + PER);
    await page.evaluate((list, lay) => {
      document.body.innerHTML = "";
      const cell = 700;
      const cv = document.createElement("canvas");
      cv.width = cell * 2;
      cv.height = cell * Math.ceil(list.length / 2);
      document.body.appendChild(cv);
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, cv.width, cv.height);
      list.forEach((g, k) => {
        ctx.save();
        ctx.translate((k % 2) * cell, Math.floor(k / 2) * cell);
        ctx.scale(cell / 1000, cell / 1000);
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        for (let v = 100; v < 1000; v += 100) {
          ctx.beginPath(); ctx.moveTo(v, 0); ctx.lineTo(v, 1000); ctx.moveTo(0, v); ctx.lineTo(1000, v); ctx.stroke();
        }
        ctx.strokeStyle = "#999"; ctx.strokeRect(0, 0, 1000, 1000);
        ctx.font = `${lay.weight} ${lay.size}px "Noto Sans Arabic Variable"`;
        ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "#cfdcec";
        ctx.fillText(g.char, g.x, lay.baseline);
        ctx.fillStyle = "#888";
        for (const [x, y] of g.skeleton) ctx.fillRect(x - 1, y - 1, 2, 2);
        ctx.fillStyle = "#1a1"; for (const [x, y] of g.ends) { ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); }
        ctx.fillStyle = "#d22"; for (const [x, y] of g.forks) { ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); }
        g.strokes.forEach((s, i) => {
          const hue = (i * 97 + 200) % 360;
          ctx.strokeStyle = ctx.fillStyle = `hsl(${hue} 85% 38%)`;
          ctx.lineWidth = 5; ctx.lineJoin = ctx.lineCap = "round";
          const p = s.points;
          if (s.kind === "line") {
            ctx.beginPath(); p.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
            for (let j = 6; j < p.length - 4; j += 10) {
              const c = Math.atan2(p[j + 1][1] - p[j - 1][1], p[j + 1][0] - p[j - 1][0]);
              const [cx, cy] = p[j];
              ctx.beginPath(); ctx.moveTo(cx - 16 * Math.cos(c - 0.6), cy - 16 * Math.sin(c - 0.6)); ctx.lineTo(cx, cy);
              ctx.lineTo(cx - 16 * Math.cos(c + 0.6), cy - 16 * Math.sin(c + 0.6)); ctx.stroke();
            }
            const [ax, ay] = p[p.length - 3] ?? p[0], [bx, by] = p[p.length - 1];
            const a = Math.atan2(by - ay, bx - ax);
            ctx.beginPath(); ctx.moveTo(bx, by);
            ctx.lineTo(bx - 34 * Math.cos(a - 0.45), by - 34 * Math.sin(a - 0.45));
            ctx.lineTo(bx - 34 * Math.cos(a + 0.45), by - 34 * Math.sin(a + 0.45)); ctx.fill();
          }
          ctx.beginPath(); ctx.arc(p[0][0], p[0][1], 16, 0, 7); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center"; ctx.direction = "ltr";
          ctx.fillText(String(i + 1), p[0][0], p[0][1] + 8);
        });
        ctx.fillStyle = "#222"; ctx.font = "36px sans-serif"; ctx.textAlign = "left"; ctx.direction = "ltr";
        ctx.fillText(g.id, 16, 44);
        ctx.restore();
      });
    }, subset, layout);
    const el = await page.$("canvas");
    await el.screenshot({ path: `${dir}/debug-${part + 1}.png` });
  }
}
