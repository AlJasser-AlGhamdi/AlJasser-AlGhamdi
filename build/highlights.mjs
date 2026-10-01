// Highlights strip: five tiles (value / label / sub) separated by hairlines.
// Desktop is one row of five; mobile is two columns.
import { createGlyphRun, wrapLines } from './lib/text.mjs';
import { svgDoc, theme, r2 } from './lib/svg.mjs';

const LAYOUT = {
  desktop: { W: 1200, cols: 5, rowH: 156, padX: 24, value: 50, label: 14, sub: 12, valueY: 66, labelY: 97, lh: 20, subY: 142 },
  mobile: { W: 390, cols: 2, rowH: 124, padX: 16, value: 32, label: 11.5, sub: 10, valueY: 46, labelY: 72, lh: 16, subY: 110 },
};

export function render(content, { variant = 'dark', mobile = false, still = false } = {}) {
  const t = theme(variant);
  const L = mobile ? LAYOUT.mobile : LAYOUT.desktop;
  const run = createGlyphRun();
  const items = content.highlights;
  const tileW = L.W / L.cols;
  const rows = Math.ceil(items.length / L.cols);
  const H = rows * L.rowH;

  const tiles = items.map((h, i) => {
    const col = i % L.cols, row = Math.floor(i / L.cols);
    const x0 = col * tileW, y0 = row * L.rowH;
    const value = run.place(h.value, { font: 'serif', size: L.value, x: x0 + L.padX, y: y0 + L.valueY });
    const labelLines = wrapLines(h.label, { font: 'mono', size: L.label, maxWidth: tileW - L.padX * 2, maxLines: 2 });
    const labels = labelLines.map((l, j) => run.place(l, { font: 'mono', size: L.label, x: x0 + L.padX, y: y0 + L.labelY + j * L.lh }));
    const subLines = wrapLines(h.sub, { font: 'mono', size: L.sub, maxWidth: tileW - L.padX * 2, maxLines: 1 });
    const sub = run.place(subLines[0], { font: 'mono', size: L.sub, x: x0 + L.padX, y: y0 + L.subY });
    const divider = col > 0 ? `<line x1="${r2(x0)}" x2="${r2(x0)}" y1="${y0 + 22}" y2="${y0 + L.rowH - 22}" stroke="${t.line}"/>` : '';
    return (
      `${divider}<g class="tile" style="animation-delay:${r2(0.2 + i * 0.12)}s">` +
      `<g fill="${t.fg}">${value.uses}${labels.map((r) => r.uses).join('')}</g>` +
      `<g fill="${t.muted}">${sub.uses}</g></g>`
    );
  });

  const styles = still
    ? ''
    : '.tile{opacity:0;animation:up .7s cubic-bezier(.2,.7,.2,1) forwards}@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}';
  const reduced = '.tile{opacity:1;transform:none}';
  const title = items.map((h) => `${h.value} ${h.label} (${h.sub})`).join('; ');
  return svgDoc({ width: L.W, height: H, title, body: tiles.join(''), styles, reduced, defs: run.defs() });
}
