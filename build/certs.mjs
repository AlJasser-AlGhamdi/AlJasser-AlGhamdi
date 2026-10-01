// Credential groups: a small-caps group label over a row of chips (code + issuer).
// Each group is one image no wider than 390px so phones show it at full size.
import { createGlyphRun, measure } from './lib/text.mjs';
import { svgDoc, theme, r2 } from './lib/svg.mjs';

const MAX_W = 390;

export function render(group, { variant = 'dark', still = false } = {}) {
  const t = theme(variant);
  const run = createGlyphRun();
  const padX = 12, labelH = 26, chipH = 34, gapX = 8, gapY = 8, chipPad = 12, sep = 7;
  const codeSize = 13, issuerSize = 11;

  // Measure chips first so rows can wrap.
  const chips = group.items.map((item) => {
    const codeW = measure(item.code, { font: 'mono-medium', size: codeSize });
    const issuerW = measure(item.issuer, { font: 'mono', size: issuerSize });
    return { item, w: Math.ceil(chipPad + codeW + sep + issuerW + chipPad), codeW };
  });
  let x = padX, y = labelH, rows = 1;
  const placed = chips.map((c) => {
    if (x + c.w > MAX_W - padX && x > padX) { x = padX; y += chipH + gapY; rows += 1; }
    const p = { ...c, x, y };
    x += c.w + gapX;
    return p;
  });
  const contentW = rows > 1 ? MAX_W : x - gapX + padX;
  const W = Math.ceil(contentW), H = y + chipH + padX;

  const label = run.place(group.label.toUpperCase(), { font: 'mono', size: 10.5, letterSpacing: 1.6, x: padX, y: 15 });
  const body = [
    `<g class="group-label" fill="${t.muted}">${label.uses}</g>`,
    ...placed.map((c, i) => {
      const code = run.place(c.item.code, { font: 'mono-medium', size: codeSize, x: chipPad, y: 22.5 });
      const issuer = run.place(c.item.issuer, { font: 'mono', size: issuerSize, x: chipPad + c.codeW + sep, y: 22.5 });
      return (
        `<g class="chip" transform="translate(${r2(c.x)} ${r2(c.y)})" style="animation-delay:${r2(i * 0.07)}s">` +
        `<rect x="0.5" y="0.5" width="${c.w - 1}" height="${chipH - 1}" rx="9" fill="${t.panel}" stroke="${t.line}"/>` +
        `<g fill="${t.fg}">${code.uses}</g><g fill="${t.muted}">${issuer.uses}</g></g>`
      );
    }),
  ].join('');
  const styles = still ? '' : '.chip{opacity:0;animation:up .5s cubic-bezier(.2,.7,.2,1) forwards}@keyframes up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}';
  const reduced = '.chip{opacity:1;transform:none}';
  const names = group.items.map((i) => `${i.code} (${i.name}, ${i.issuer})`).join('; ');
  return svgDoc({ width: W, height: H, title: `${group.label}: ${names}`, body, styles, reduced, defs: run.defs() });
}
