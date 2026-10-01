// Project cards: 390x170 at intrinsic size (no percentage widths in the README), so
// two sit side by side in GitHub's desktop column and each wraps to its own line on
// a phone. Title in serif, two wrapped description lines, a metric, and a small tag
// ("open source" in amber for public code, "code private" muted).
import { createGlyphRun, wrapLines } from './lib/text.mjs';
import { svgDoc, theme, r2 } from './lib/svg.mjs';

const W = 390, H = 170, PAD = 22;

export function render(project, { variant = 'dark', still = false } = {}) {
  const t = theme(variant);
  const run = createGlyphRun();
  const isPrivate = Boolean(project.private);

  const tagText = (isPrivate ? 'code private' : project.tag ?? 'open source').toUpperCase();
  const tag = run.place(tagText, { font: 'mono', size: 8.5, letterSpacing: 1.3, x: W - PAD - 9, y: 28.5, anchor: 'end' });
  const tagW = tag.width + 18;
  const tagColor = isPrivate ? t.muted : t.accent;

  const title = run.place(project.title, { font: 'serif', size: 28, x: PAD, y: 64 });
  const lines = wrapLines(project.line, { font: 'mono', size: 13, maxWidth: W - PAD * 2, maxLines: 2 });
  const lineRuns = lines.map((l, i) => run.place(l, { font: 'mono', size: 13, x: PAD, y: 92 + i * 20 }));
  const metric = run.place(project.metric, { font: 'mono-medium', size: 14, x: PAD + 14, y: 148 });

  const arrow = isPrivate
    ? ''
    : `<path class="arrow" d="M${W - PAD - 20} 143 h20 m-7 -7 l7 7 l-7 7" fill="none" stroke="${t.fg}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`;

  const body = [
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="${t.panel}" stroke="${t.line}"/>`,
    `<g class="tag ${isPrivate ? 'private' : 'public'}">` +
      `<rect x="${r2(W - PAD - tagW)}" y="17" width="${r2(tagW)}" height="17" rx="8.5" fill="none" stroke="${tagColor}" stroke-opacity="0.7"/>` +
      `<g fill="${tagColor}">${tag.uses}</g></g>`,
    `<g class="title" fill="${t.fg}">${title.uses}</g>`,
    ...lineRuns.map((r) => `<g class="line" fill="${t.muted}">${r.uses}</g>`),
    `<circle cx="${PAD + 3.5}" cy="143.5" r="2.8" fill="${isPrivate ? t.muted : t.accent}"/>`,
    `<g class="metric" fill="${t.fg}">${metric.uses}</g>`,
    arrow,
  ].join('');

  const styles = still
    ? ''
    : '.title,.line,.metric,.tag,.arrow{opacity:0;animation:in .7s cubic-bezier(.2,.7,.2,1) forwards}' +
      '.title{animation-delay:.05s}.line{animation-delay:.2s}.metric{animation-delay:.35s}.tag,.arrow{animation-delay:.45s}' +
      '@keyframes in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
  const reduced = '.title,.line,.metric,.tag,.arrow{opacity:1;transform:none}';
  const desc = `${project.line}. ${project.metric}.${isPrivate ? ' Code is private.' : ''}`;
  return svgDoc({ width: W, height: H, title: project.title, desc, body, styles, reduced, defs: run.defs() });
}
