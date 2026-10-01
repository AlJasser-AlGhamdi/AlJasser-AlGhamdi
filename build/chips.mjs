// Link chips: small monochrome pills with an icon and an outlined label.
import { createGlyphRun } from './lib/text.mjs';
import { svgDoc, theme } from './lib/svg.mjs';

// Icons live in a 16x16 box. Feather icons (MIT) for generic glyphs; the ORCID iD
// icon is the official mark and keeps its brand colours as ORCID's guidelines ask.
const ICONS = {
  linkedin: (t) =>
    `<g transform="scale(0.6667)" fill="none" stroke="${t.fg}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>` +
    `<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></g>`,
  email: (t) =>
    `<g transform="scale(0.6667)" fill="none" stroke="${t.fg}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">` +
    `<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6 12 13 2 6"/></g>`,
  orcid: () =>
    `<g transform="scale(0.0625)"><path fill="#A6CE39" d="M256,128c0,70.7-57.3,128-128,128C57.3,256,0,198.7,0,128C0,57.3,57.3,0,128,0C198.7,0,256,57.3,256,128z"/>` +
    `<path fill="#FFFFFF" d="M86.3,186.2H70.9V79.1h15.4v48.4V186.2z"/>` +
    `<path fill="#FFFFFF" d="M108.9,79.1h41.6c39.6,0,57,28.3,57,53.6c0,27.5-21.5,53.6-56.8,53.6h-41.8V79.1z M124.3,172.4h24.5c34.9,0,42.9-26.5,42.9-39.7c0-21.5-13.7-39.7-43.7-39.7h-23.7V172.4z"/>` +
    `<path fill="#FFFFFF" d="M88.7,56.8c0,5.5-4.5,10.1-10.1,10.1c-5.6,0-10.1-4.6-10.1-10.1c0-5.6,4.5-10.1,10.1-10.1C84.2,46.7,88.7,51.3,88.7,56.8z"/></g>`,
};

export function render(link, { variant = 'dark' } = {}) {
  const icon = ICONS[link.id];
  if (!icon) throw new Error(`no icon for link id "${link.id}"`);
  const t = theme(variant);
  const run = createGlyphRun();
  const H = 36, padX = 14, iconW = 16, gap = 9, size = 13;
  const label = run.place(link.label, { font: 'mono-medium', size, x: padX + iconW + gap, y: 22.5 });
  const W = Math.ceil(padX + iconW + gap + label.width + padX);
  const body =
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${(H - 1) / 2}" fill="${t.panel}" stroke="${t.line}"/>` +
    `<g class="icon" transform="translate(${padX} ${(H - iconW) / 2})">${icon(t)}</g>` +
    `<g class="label" fill="${t.fg}">${label.uses}</g>`;
  return svgDoc({ width: W, height: H, title: link.label, body, defs: run.defs() });
}
