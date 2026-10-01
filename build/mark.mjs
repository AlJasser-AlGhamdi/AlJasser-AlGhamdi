// End-mark: a small raven on its amber perch, used as the README's closing signature.
import fs from 'node:fs';
import { svgDoc, theme, r2 } from './lib/svg.mjs';

const trace = JSON.parse(fs.readFileSync(new URL('./src/raven-trace.json', import.meta.url), 'utf8'));
const RAVEN_D = `${trace.subpaths[0].d} ${trace.subpaths[1].d}`;
const PERCH_CLIP = 'M0 0H460V460H200V176H165V240H128V460H0Z';
const PERCH_Y = 176;
const EYE = { x: 239, y: 94 };

export function render({ variant = 'dark' } = {}) {
  const t = theme(variant);
  const W = 160, H = 96, s = 0.38;
  const [x1, , x2] = trace.subpaths[0].bbox;
  const tx = W / 2 - ((x1 + x2) / 2) * s;
  const perchY = 64;
  const ty = perchY - PERCH_Y * s;
  const body =
    `<rect x="20" y="${perchY - 0.75}" width="${W - 40}" height="1.5" fill="${t.accent}" opacity="0.9"/>` +
    `<g transform="translate(${r2(tx)} ${r2(ty)}) scale(${s})">` +
    `<g clip-path="url(#perch)"><path d="${RAVEN_D}" fill="${t.fg}" fill-rule="evenodd" opacity="0.92"/></g>` +
    `<circle cx="${EYE.x}" cy="${EYE.y}" r="${r2(2.2 / s)}" fill="${t.accent}"/></g>`;
  const defs = `<clipPath id="perch"><path d="${PERCH_CLIP}"/></clipPath>`;
  return svgDoc({ width: W, height: H, title: 'Raven mark', body, defs });
}
