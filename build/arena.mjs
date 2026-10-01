// Arena: competition results as an editorial ledger. Rank in big serif (amber for
// first places), event in serif, detail in muted mono, hairlines between rows.
// Desktop is two columns read top to bottom; mobile is a single column.
import { createGlyphRun, wrapLines, measure } from './lib/text.mjs';
import { svgDoc, theme, r2 } from './lib/svg.mjs';

const L = {
  desktop: { W: 1200, cols: 2, padX: 32, rankX: 32, rankSize: 36, textX: 168, textW: 400, eventSize: 23, detailSize: 13.5, detailLh: 18, rowH: 94, padTop: 12, padBottom: 12 },
  mobile: { W: 390, cols: 1, padX: 16, rankX: 16, rankSize: 26, textX: 112, textW: 262, eventSize: 17, eventLh: 20, detailSize: 10.5, detailLh: 15, padTop: 8, padBottom: 8 },
};

const isWin = (rank) => /^1st/.test(rank);

export function render(content, { variant = 'dark', mobile = false, still = false } = {}) {
  const t = theme(variant);
  const run = createGlyphRun();
  const C = mobile ? L.mobile : L.desktop;
  const entries = content.arena;
  const colW = C.W / C.cols;
  const perCol = Math.ceil(entries.length / C.cols);

  // Pre-wrap text so row heights are known before drawing.
  const prepared = entries.map((e) => ({
    e,
    eventLines: wrapLines(e.event, { font: 'serif', size: C.eventSize, maxWidth: C.textW, maxLines: mobile ? 2 : 1 }),
    detailLines: wrapLines(e.detail, { font: 'mono', size: C.detailSize, maxWidth: C.textW, maxLines: 2 }),
  }));
  const rowHeight = (p) => (mobile ? 24 + p.eventLines.length * C.eventLh + 4 + p.detailLines.length * C.detailLh + 14 : C.rowH);

  // Column-major placement: entries 1..perCol in the first column.
  const columns = Array.from({ length: C.cols }, (_, c) => prepared.slice(c * perCol, (c + 1) * perCol));
  const colHeights = columns.map((col) => col.reduce((s, p) => s + rowHeight(p), 0));
  const H = C.padTop + Math.max(...colHeights) + C.padBottom;

  const rows = [];
  let index = 0;
  columns.forEach((col, c) => {
    const x0 = c * colW;
    let y0 = C.padTop;
    col.forEach((p, r) => {
      const h = rowHeight(p);
      const rankY = mobile ? y0 + 34 : y0 + 44;
      const rank = run.place(p.e.rank, { font: 'serif', size: C.rankSize, x: x0 + C.rankX, y: rankY });
      const eventY = mobile ? y0 + 30 : y0 + 40;
      const events = p.eventLines.map((l, i) => run.place(l, { font: 'serif', size: C.eventSize, x: x0 + C.textX, y: eventY + i * (C.eventLh ?? 0) }));
      const detailY = mobile ? eventY + (p.eventLines.length - 1) * C.eventLh + 20 : y0 + 62;
      const details = p.detailLines.map((l, i) => run.place(l, { font: 'mono', size: C.detailSize, x: x0 + C.textX, y: detailY + i * C.detailLh }));
      const win = isWin(p.e.rank);
      const hairline = r < col.length - 1 ? `<line x1="${r2(x0 + C.padX)}" x2="${r2(x0 + colW - C.padX)}" y1="${r2(y0 + h - 1)}" y2="${r2(y0 + h - 1)}" stroke="${t.line}"/>` : '';
      rows.push(
        `<g class="row${win ? ' win' : ''}" style="animation-delay:${r2(0.15 + index * 0.09)}s">` +
          `<g fill="${win ? t.accent : t.fg}">${rank.uses}</g>` +
          `<g fill="${t.fg}">${events.map((x) => x.uses).join('')}</g>` +
          `<g fill="${t.muted}">${details.map((x) => x.uses).join('')}</g>` +
          `</g>${hairline}`,
      );
      y0 += h;
      index += 1;
    });
  });
  const divider = C.cols > 1 ? `<line x1="${colW}" x2="${colW}" y1="${C.padTop + 10}" y2="${H - C.padBottom - 10}" stroke="${t.line}"/>` : '';

  const styles = still
    ? ''
    : '.row{opacity:0;animation:up .6s cubic-bezier(.2,.7,.2,1) forwards}@keyframes up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
  const reduced = '.row{opacity:1;transform:none}';
  const title = `Arena: ${entries.map((e) => `${e.rank}, ${e.event} (${e.detail})`).join('; ')}`;
  return svgDoc({ width: C.W, height: H, title, body: divider + rows.join(''), styles, reduced, defs: run.defs() });
}

// measure is imported for callers that want to tune column widths in a REPL.
export { measure };
