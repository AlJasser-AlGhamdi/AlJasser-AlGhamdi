// Project cards: 580x200, title in serif, two wrapped description lines, a metric,
// and a small tag ("open source" in amber for public code, "code private" muted).
import { createGlyphRun, wrapLines } from './lib/text.mjs';
import { svgDoc, theme, r2 } from './lib/svg.mjs';

const W = 580, H = 200, PAD = 28;

export function render(project, { variant = 'dark', still = false } = {}) {
  const t = theme(variant);
  const run = createGlyphRun();
  const isPrivate = Boolean(project.private);

  const tagText = (isPrivate ? 'code private' : project.tag ?? 'open source').toUpperCase();
  const tag = run.place(tagText, { font: 'mono', size: 9.5, letterSpacing: 1.5, x: W - PAD - 10, y: 32.5, anchor: 'end' });
  const tagW = tag.width + 20;
  const tagColor = isPrivate ? t.muted : t.accent;

  const title = run.place(project.title, { font: 'serif', size: 36, x: PAD, y: 72 });
  const lines = wrapLines(project.line, { font: 'mono', size: 15, maxWidth: W - PAD * 2, maxLines: 2 });
  const lineRuns = lines.map((l, i) => run.place(l, { font: 'mono', size: 15, x: PAD, y: 106 + i * 23 }));
  const metric = run.place(project.metric, { font: 'mono-medium', size: 16, x: PAD + 16, y: 174 });

  const arrow = isPrivate
    ? ''
    : `<path class="arrow" d="M${W - PAD - 22} 160 h22 m-8 -8 l8 8 l-8 8" fill="none" stroke="${t.fg}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;

  const body = [
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="${t.panel}" stroke="${t.line}"/>`,
    `<g class="tag ${isPrivate ? 'private' : 'public'}">` +
      `<rect x="${r2(W - PAD - tagW)}" y="20" width="${r2(tagW)}" height="19" rx="9.5" fill="none" stroke="${tagColor}" stroke-opacity="0.7"/>` +
      `<g fill="${tagColor}">${tag.uses}</g></g>`,
    `<g class="title" fill="${t.fg}">${title.uses}</g>`,
    ...lineRuns.map((r) => `<g class="line" fill="${t.muted}">${r.uses}</g>`),
    `<circle cx="${PAD + 4}" cy="168" r="3" fill="${isPrivate ? t.muted : t.accent}"/>`,
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
