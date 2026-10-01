// README banner for scan-to-controls in the same noir style (dark/light SVG pair).
// Usage: node repo-banner.mjs <output-dir>
import fs from 'node:fs';
import path from 'node:path';
import { createGlyphRun, wrapLines } from './lib/text.mjs';
import { svgDoc, theme, r2 } from './lib/svg.mjs';

const W = 1200, H = 300, PAD = 64;
const COPY = {
  kicker: 'CODE AND DATA BEHIND THE PAPER',
  title: 'scan-to-controls',
  summary: 'An automated tiered-evidence toolkit for cybersecurity compliance assessment in Saudi SMEs',
  facts: '203 rules · 31 external checks · 422 tests · Apache-2.0 · Zenodo DOI',
};

export function render({ variant = 'dark' } = {}) {
  const t = theme(variant);
  const run = createGlyphRun();
  const kicker = run.place(COPY.kicker, { font: 'mono', size: 12, letterSpacing: 2, x: PAD, y: 78 });
  const title = run.place(COPY.title, { font: 'serif', size: 72, x: PAD, y: 152 });
  const lines = wrapLines(COPY.summary, { font: 'mono', size: 17, maxWidth: W - PAD * 2, maxLines: 2 });
  const summary = lines.map((l, i) => run.place(l, { font: 'mono', size: 17, x: PAD, y: 198 + i * 26 }));
  const facts = run.place(COPY.facts, { font: 'mono-medium', size: 16, x: PAD + 18, y: 262 });
  const body = [
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="20" fill="${t.bg}" stroke="${t.line}"/>`,
    `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="19.5" fill="url(#vg)"/>`,
    `<g fill="${t.muted}">${kicker.uses}</g>`,
    `<g fill="${t.fg}">${title.uses}</g>`,
    `<g fill="${t.muted}">${summary.map((s) => s.uses).join('')}</g>`,
    `<circle cx="${PAD + 5}" cy="257" r="3.5" fill="${t.accent}"/>`,
    `<g fill="${t.fg}">${facts.uses}</g>`,
    `<rect x="${W - PAD - 220}" y="${r2(H / 2 - 1)}" width="220" height="2" fill="${t.accent}" opacity="0.9"/>`,
  ].join('');
  const defs =
    run.defs() +
    `<radialGradient id="vg" cx="30%" cy="40%" r="80%"><stop offset="0" stop-color="${t.lift}"/><stop offset="1" stop-color="${t.bg}"/></radialGradient>`;
  return svgDoc({ width: W, height: H, title: `${COPY.title}: ${COPY.summary}`, body, defs });
}

const outDir = process.argv[2];
if (outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const variant of ['dark', 'light']) fs.writeFileSync(path.join(outDir, `banner-${variant}.svg`), render({ variant }));
  console.log(`wrote banner-dark.svg and banner-light.svg to ${outDir}`);
}
