// Social preview images (1280x640 PNG) for the profile repo and scan-to-controls.
// Static by design: GitHub serves these as plain images.
import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { outline, wrapLines } from './lib/text.mjs';
import { theme, r2 } from './lib/svg.mjs';
import * as hero from './hero.mjs';

const W = 1280, H = 640;

function png(svg) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
}

/** Profile repo: the still hero panel centred on ink. */
export function profilePreview(content) {
  const heroSvg = hero.render(content, { variant: 'dark', still: true });
  const b64 = Buffer.from(heroSvg).toString('base64');
  const t = theme('dark');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${t.bg}"/>` +
    `<image x="40" y="110" width="1200" height="420" href="data:image/svg+xml;base64,${b64}"/></svg>`;
  return png(svg);
}

/** scan-to-controls: title, one-line summary, key facts, authors. */
export function repoPreview({ title, summary, facts, authors }) {
  const t = theme('dark');
  const pad = 96;
  const kicker = outline('CODE AND DATA BEHIND THE PAPER', { font: 'mono', size: 18, letterSpacing: 2.4, x: pad, y: 150 });
  const titleRun = outline(title, { font: 'serif', size: 96, x: pad, y: 262 });
  const lines = wrapLines(summary, { font: 'mono', size: 24, maxWidth: W - pad * 2, maxLines: 2 });
  const summaryRuns = lines.map((l, i) => outline(l, { font: 'mono', size: 24, x: pad, y: 330 + i * 36 }));
  const factRuns = outline(facts, { font: 'mono-medium', size: 24, x: pad + 24, y: 470 });
  const authorRun = outline(authors, { font: 'mono', size: 18, x: pad, y: 560 });
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${t.bg}"/>` +
    `<rect x="${pad}" y="${H - 44}" width="${W - pad * 2}" height="2" fill="${t.accent}" opacity="0.8"/>` +
    `<path d="${kicker.d}" fill="${t.muted}"/>` +
    `<path d="${titleRun.d}" fill="${t.fg}"/>` +
    summaryRuns.map((r) => `<path d="${r.d}" fill="${t.muted}"/>`).join('') +
    `<circle cx="${pad + 6}" cy="462" r="5" fill="${t.accent}"/>` +
    `<path d="${factRuns.d}" fill="${t.fg}"/>` +
    `<path d="${authorRun.d}" fill="${t.muted}"/>` +
    `<rect x="0.5" y="0.5" width="${r2(W - 1)}" height="${r2(H - 1)}" fill="none" stroke="${t.line}"/></svg>`;
  return png(svg);
}

if (process.argv[1] && process.argv[1].endsWith('social-preview.mjs')) {
  const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));
  fs.mkdirSync('../assets', { recursive: true });
  fs.writeFileSync('../assets/social-preview.png', profilePreview(content));
  fs.writeFileSync(
    '../assets/social-preview-scan-to-controls.png',
    repoPreview({
      title: 'scan-to-controls',
      summary: 'An automated tiered-evidence toolkit for cybersecurity compliance assessment in Saudi SMEs',
      facts: '203 rules · 31 external checks · 422 tests · Apache-2.0 · Zenodo DOI',
      authors: 'AlJasser AlGhamdi, Miada Almasre, Norah Al-Malki · King Abdulaziz University',
    }),
  );
  console.log('wrote ../assets/social-preview.png and ../assets/social-preview-scan-to-controls.png');
}
