// Hero: the raven (traced from the avatar, clipped free of the monogram) perched on an
// amber rule, the name rising letter by letter, and a typewriter line cycling roles.
// All motion is CSS (opacity/transform/stroke) so reduced-motion and still renders work.
import fs from 'node:fs';
import { createGlyphRun, measure } from './lib/text.mjs';
import { svgDoc, theme, r2 } from './lib/svg.mjs';

const trace = JSON.parse(fs.readFileSync(new URL('./src/raven-trace.json', import.meta.url), 'utf8'));
const RAVEN_D = `${trace.subpaths[0].d} ${trace.subpaths[1].d}`;
const PERCH_CLIP = 'M0 0H460V460H200V176H165V240H128V460H0Z'; // keeps the bird and the serif it stands on
const PERCH_Y = 176; // underside of the serif, in trace units
const EYE = { x: 239, y: 94 }; // in trace units

const T = { base: 2.6, type: 1.15, hold: 2.7, fade: 0.35, gap: 0.2 };
const COORDS = 'JEDDAH, SAUDI ARABIA · 21.54° N, 39.17° E';

const LAYOUT = {
  desktop: {
    W: 1200, H: 420, ravenScale: 1.55, ravenRight: 1130, perchY: 300, ruleX1: 70, ruleX2: 1130,
    name: { x: 70, y: 250, size: 88, lines: 1 }, meta: { x: 72, y: 170, size: 13.5, anchor: 'start' },
    role: { x: 70, y: 352, size: 22, cursorH: 24 }, cursorW: 11,
  },
  mobile: {
    W: 390, H: 470, ravenScale: 0.95, ravenCenter: 195, perchY: 190, ruleX1: 24, ruleX2: 366,
    name: { x: 195, y: 292, size: 50, lines: 2, anchor: 'middle' }, meta: { x: 195, y: 446, size: 10.5, anchor: 'middle' },
    role: { x: 24, y: 392, size: 15, cursorH: 17 }, cursorW: 8,
  },
};

const pct = (sec, cycle) => r2((sec / cycle) * 100);

function roles({ run, roles, L, t, still }) {
  const n = roles.length;
  const slot = T.type + T.hold + T.fade + T.gap;
  const cycle = n * slot;
  const x0 = L.role.x + 20, y = L.role.y, size = L.role.size;
  const visibleEnd = pct(T.type + T.hold, cycle), hiddenAt = pct(T.type + T.hold + T.fade, cycle);
  const chevron = `<path class="prompt" d="M${L.role.x} ${y - size * 0.62} l6 6 l-6 6" fill="none" stroke="${t.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  const groups = [];
  const keyframes = [];
  let firstWidth = 0;
  roles.forEach((text, i) => {
    const { letters } = run.place(text, { font: 'mono-medium', size, x: x0, y, perLetter: true });
    const width = measure(text, { font: 'mono-medium', size });
    const chars = [...text].length;
    const delay = T.base + i * slot;
    if (i === 0) firstWidth = width;
    const paths = letters
      .map((l, j) => `<g class="c" fill="${t.fg}" style="animation-delay:${r2(delay + (j / chars) * T.type)}s">${l.use}</g>`)
      .join('');
    // Still renders (resvg, previews) ignore CSS transforms, so park the cursor after the text by attribute.
    const cursor = `<rect class="cur" x="${r2(still ? x0 + width : x0)}" y="${r2(y - L.role.cursorH + 4)}" width="${L.cursorW}" height="${L.role.cursorH}" fill="${t.accent}"${still ? '' : ` style="animation:cur${i} ${r2(cycle)}s linear ${r2(delay)}s infinite"`}/>`;
    groups.push(`<g class="role r${i}" style="animation-delay:${r2(delay)}s">${paths}${cursor}</g>`);
    // Cursor: step across the text while typing (jump-start so it leads each typed
    // character), blink while holding, then vanish.
    const kf = [`0%{transform:translateX(0);opacity:1;animation-timing-function:steps(${chars},start)}`, `${pct(T.type, cycle)}%{transform:translateX(${r2(width)}px);opacity:1;animation-timing-function:step-end}`];
    for (let b = 0.5; b < T.hold; b += 0.5) {
      kf.push(`${pct(T.type + b, cycle)}%{transform:translateX(${r2(width)}px);opacity:${Math.round(b * 2) % 2 ? 0 : 1};animation-timing-function:step-end}`);
    }
    kf.push(`${hiddenAt}%{transform:translateX(${r2(width)}px);opacity:0}`, `100%{transform:translateX(${r2(width)}px);opacity:0}`);
    keyframes.push(`@keyframes cur${i}{${kf.join('')}}`);
  });
  const styles = still
    ? ''
    : `.role{opacity:0;animation:role ${r2(cycle)}s linear infinite}` +
      `@keyframes role{0%{opacity:1}${visibleEnd}%{opacity:1}${hiddenAt}%{opacity:0}100%{opacity:0}}` +
      `.c{opacity:0;animation:show ${r2(cycle)}s step-end infinite}` +
      `@keyframes show{0%{opacity:0}.3%{opacity:1}${hiddenAt}%{opacity:1}${r2(hiddenAt + 0.3)}%{opacity:0}100%{opacity:0}}` +
      `.cur{opacity:0}` +
      `.prompt{opacity:0;animation:fade .6s ease-out ${T.base - 0.3}s forwards}` +
      keyframes.join('');
  const reduced = `.role{opacity:0}.r0{opacity:1}.c{opacity:1}.cur{opacity:0;animation:none}.r0 .cur{opacity:1;transform:translateX(${r2(still ? 0 : firstWidth)}px)}.prompt{opacity:1}`;
  return { body: chevron + groups.join(''), styles, reduced };
}

export function render(content, { variant = 'dark', mobile = false, still = false } = {}) {
  const t = theme(variant);
  const L = mobile ? LAYOUT.mobile : LAYOUT.desktop;
  const run = createGlyphRun();
  const s = L.ravenScale;
  const ravenLeft = trace.subpaths[0].bbox[0], ravenRight = trace.subpaths[0].bbox[2];
  const tx = mobile ? L.ravenCenter - ((ravenLeft + ravenRight) / 2) * s : L.ravenRight - ravenRight * s;
  const ty = L.perchY - PERCH_Y * s;

  // Name, one <g> per letter so each can rise on its own delay.
  const nameParts = L.name.lines === 2 ? content.name.split(' ') : [content.name];
  let letterIndex = 0;
  const nameBody = nameParts
    .map((part, li) => {
      const { letters } = run.place(part, { font: 'serif', size: L.name.size, x: L.name.x, y: L.name.y + li * L.name.size * 0.98, anchor: L.name.anchor ?? 'start', perLetter: true });
      return letters.map((l) => `<g class="L" fill="${t.fg}" style="animation-delay:${r2(0.25 + letterIndex++ * 0.045)}s">${l.use}</g>`).join('');
    })
    .join('');

  const meta = run.place(COORDS, { font: 'mono', size: L.meta.size, letterSpacing: 1.8, x: L.meta.x, y: L.meta.y, anchor: L.meta.anchor });
  const rolePart = roles({ run, roles: content.roles, L, t, still });

  const body = [
    `<rect x="0.5" y="0.5" width="${L.W - 1}" height="${L.H - 1}" rx="20" fill="${t.bg}" stroke="${t.line}"/>`,
    `<rect x="1" y="1" width="${L.W - 2}" height="${L.H - 2}" rx="19.5" fill="url(#vg)"/>`,
    `<rect class="rule" x="${L.ruleX1}" y="${L.perchY - 1}" width="${L.ruleX2 - L.ruleX1}" height="2" fill="${t.accent}"/>`,
    `<g class="meta" fill="${t.muted}">${meta.uses}</g>`,
    nameBody,
    `<g transform="translate(${r2(tx)} ${r2(ty)}) scale(${s})">` +
      `<g clip-path="url(#perch)"><path class="raven" d="${RAVEN_D}" fill="${t.fg}" fill-rule="evenodd" pathLength="1"/></g>` +
      `<circle class="eye" cx="${EYE.x}" cy="${EYE.y}" r="${r2(3.2 / s)}" fill="${t.accent}"/></g>`,
    rolePart.body,
  ].join('');

  const defs =
    run.defs() +
    `<radialGradient id="vg" cx="38%" cy="42%" r="78%"><stop offset="0" stop-color="${t.lift}"/><stop offset="1" stop-color="${t.bg}"/></radialGradient>` +
    `<clipPath id="perch"><path d="${PERCH_CLIP}"/></clipPath>`;

  const styles = still
    ? ''
    : '.L{opacity:0;transform:translateY(18px);animation:rise .8s cubic-bezier(.2,.7,.2,1) forwards}' +
      '@keyframes rise{to{opacity:1;transform:none}}' +
      `.raven{fill-opacity:0;stroke:${t.fg};stroke-width:${r2(1.2 / s)};stroke-dasharray:1;stroke-dashoffset:1;animation:draw 2.2s ease-in-out .2s forwards,fillin .9s ease-out 2s forwards}` +
      '@keyframes draw{to{stroke-dashoffset:0}}@keyframes fillin{to{fill-opacity:1}}' +
      `.rule{transform:scaleX(0);transform-origin:${L.ruleX1}px ${L.perchY}px;animation:sweep 1.1s cubic-bezier(.6,0,.2,1) 1.3s forwards}` +
      '@keyframes sweep{to{transform:scaleX(1)}}' +
      '.eye{opacity:.15;animation:pulse 2.8s ease-in-out 3s infinite}@keyframes pulse{0%,100%{opacity:.15}50%{opacity:1}}' +
      '.meta{opacity:0;animation:fade 1s ease-out 1.6s forwards}@keyframes fade{to{opacity:1}}' +
      rolePart.styles;
  const reduced = '.L,.meta{opacity:1;transform:none}.raven{fill-opacity:1;stroke-dashoffset:0}.rule{transform:none}.eye{opacity:1}' + rolePart.reduced;
  const stillStyles = still ? reduced : '';

  return svgDoc({
    width: L.W,
    height: L.H,
    title: `${content.name}: ${content.roles.join(', ')}`,
    desc: `${COORDS}. A raven perched on an amber rule beside the name.`,
    body,
    styles: styles + stillStyles,
    defs,
    reduced,
  });
}
