// Text -> outlined SVG geometry. GitHub renders README images without web fonts,
// so every glyph is converted to vector outlines at build time.
//
// opentype.js is used only to parse the font (cmap, advances, kerning, glyph
// contours). Layout and path serialisation are done here: the shaper cannot parse
// a GSUB lookup in Instrument Serif, and its getPath() emitted NaN for some glyphs.
// Ligatures are therefore not applied, which is fine for display text.
//
// Two ways to emit text:
//   outline(text, opts)          -> one path string per run (simple, larger files)
//   createGlyphRun().place(...)  -> each distinct glyph defined once in <defs>, runs
//                                   become <use> elements (several times smaller)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const FACES = {
  'serif': 'InstrumentSerif-Regular.ttf',
  'serif-italic': 'InstrumentSerif-Italic.ttf',
  'mono': 'JetBrainsMono-Regular.ttf',
  'mono-medium': 'JetBrainsMono-Medium.ttf',
};
const FACE_PREFIX = { 'serif': 's', 'serif-italic': 'i', 'mono': 'm', 'mono-medium': 'n' };
const cache = new Map();

export function loadFont(name) {
  if (cache.has(name)) return cache.get(name);
  const file = FACES[name];
  if (!file) throw new Error(`unknown font face: ${name}`);
  const buf = fs.readFileSync(path.join(here, '..', 'fonts', file));
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  cache.set(name, font);
  return font;
}

const num = (n) => {
  const s = (Math.round(n * 100) / 100).toFixed(2);
  return s.replace(/\.?0+$/, '') || '0';
};

/** Serialise one glyph's contours at (x, y) baseline and the given size. */
function glyphPathData(glyph, x, y, size, upem, bbox) {
  const s = size / upem;
  const px = (v) => x + v * s;
  const py = (v) => y - v * s;
  const grow = (gx, gy) => {
    if (gx < bbox.x1) bbox.x1 = gx;
    if (gx > bbox.x2) bbox.x2 = gx;
    if (gy < bbox.y1) bbox.y1 = gy;
    if (gy > bbox.y2) bbox.y2 = gy;
  };
  const parts = [];
  for (const c of glyph.path.commands) {
    switch (c.type) {
      case 'M':
      case 'L': {
        const gx = px(c.x), gy = py(c.y);
        grow(gx, gy);
        parts.push(`${c.type}${num(gx)} ${num(gy)}`);
        break;
      }
      case 'Q': {
        const gx = px(c.x), gy = py(c.y);
        grow(gx, gy);
        parts.push(`Q${num(px(c.x1))} ${num(py(c.y1))} ${num(gx)} ${num(gy)}`);
        break;
      }
      case 'C': {
        const gx = px(c.x), gy = py(c.y);
        grow(gx, gy);
        parts.push(`C${num(px(c.x1))} ${num(py(c.y1))} ${num(px(c.x2))} ${num(py(c.y2))} ${num(gx)} ${num(gy)}`);
        break;
      }
      case 'Z':
        parts.push('Z');
        break;
      default:
        throw new Error(`unsupported path command ${c.type}`);
    }
  }
  return parts.join('');
}

/** Glyph contours in font units, y up (flipped by the <use> matrix). */
function glyphDefData(glyph) {
  const parts = [];
  for (const c of glyph.path.commands) {
    switch (c.type) {
      case 'M':
      case 'L':
        parts.push(`${c.type}${num(c.x)} ${num(c.y)}`);
        break;
      case 'Q':
        parts.push(`Q${num(c.x1)} ${num(c.y1)} ${num(c.x)} ${num(c.y)}`);
        break;
      case 'C':
        parts.push(`C${num(c.x1)} ${num(c.y1)} ${num(c.x2)} ${num(c.y2)} ${num(c.x)} ${num(c.y)}`);
        break;
      case 'Z':
        parts.push('Z');
        break;
      default:
        throw new Error(`unsupported path command ${c.type}`);
    }
  }
  return parts.join('');
}

/** Per-glyph positions (relative to 0) for a run. */
function layout(text, { font = 'serif', size = 16, letterSpacing = 0 } = {}) {
  const f = loadFont(font);
  const scale = size / f.unitsPerEm;
  const chars = [...text];
  const glyphs = [];
  let x = 0;
  for (let i = 0; i < chars.length; i += 1) {
    const g = f.charToGlyph(chars[i]);
    glyphs.push({ char: chars[i], glyph: g, x });
    x += (g.advanceWidth ?? 0) * scale;
    if (i < chars.length - 1) {
      let kern = 0;
      try { kern = f.getKerningValue(g, f.charToGlyph(chars[i + 1])) || 0; } catch { kern = 0; }
      x += kern * scale + letterSpacing;
    }
  }
  return { font: f, fontName: font, glyphs, width: x };
}

/** Advance width of a run, with optional extra tracking between glyphs (px). */
export function measure(text, opts = {}) {
  return layout(text, opts).width;
}

function startX(x, width, anchor) {
  return anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
}

const emptyBox = () => ({ x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity });

/**
 * Outline a run of text. Returns path data plus layout facts so callers can
 * place cursors, underlines and covers precisely.
 * anchor: 'start' | 'middle' | 'end' (same semantics as SVG text-anchor)
 */
export function outline(text, opts = {}) {
  const { size = 16, x = 0, y = 0, anchor = 'start' } = opts;
  const { font, glyphs, width } = layout(text, opts);
  const start = startX(x, width, anchor);
  const bbox = emptyBox();
  const d = glyphs.map((g) => glyphPathData(g.glyph, start + g.x, y, size, font.unitsPerEm, bbox)).join('');
  return { d, width, start, bbox };
}

/** Outline each character separately (for staggered per-letter animation). */
export function outlineLetters(text, opts = {}) {
  const { size = 16, x = 0, y = 0, anchor = 'start' } = opts;
  const { font, glyphs, width } = layout(text, opts);
  const start = startX(x, width, anchor);
  const letters = [];
  for (const g of glyphs) {
    const d = glyphPathData(g.glyph, start + g.x, y, size, font.unitsPerEm, emptyBox());
    if (d.length > 0) letters.push({ char: g.char, d, x: start + g.x });
  }
  return { letters, width, start };
}

/**
 * Per-document glyph registry. place() lays out a run and returns <use> markup;
 * defs() returns the <path> definitions collected so far (call it last).
 */
export function createGlyphRun() {
  const defs = new Map();
  function place(text, opts = {}) {
    const { size = 16, x = 0, y = 0, anchor = 'start', perLetter = false } = opts;
    const { font, fontName, glyphs, width } = layout(text, opts);
    const start = startX(x, width, anchor);
    const s = Number((size / font.unitsPerEm).toFixed(5));
    const prefix = FACE_PREFIX[fontName];
    const letters = [];
    for (const g of glyphs) {
      if (!g.glyph.path.commands.length) continue;
      const id = `${prefix}${g.glyph.index}`;
      if (!defs.has(id)) defs.set(id, glyphDefData(g.glyph));
      const gx = start + g.x;
      letters.push({ char: g.char, x: gx, use: `<use href="#${id}" transform="matrix(${s} 0 0 -${s} ${num(gx)} ${num(y)})"/>` });
    }
    return { uses: letters.map((l) => l.use).join(''), letters: perLetter ? letters : undefined, width, start };
  }
  function defsMarkup() {
    return [...defs].map(([id, d]) => `<path id="${id}" d="${d}"/>`).join('');
  }
  return { place, defs: defsMarkup };
}

/** Greedy word wrap. With maxLines, the last kept line is truncated with an ellipsis. */
export function wrapLines(text, { maxWidth, maxLines = Infinity, ...opts }) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (!cur || measure(cand, opts) <= maxWidth) cur = cand;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (measure(`${last}…`, opts) > maxWidth && last.includes(' ')) last = last.slice(0, last.lastIndexOf(' '));
  kept[maxLines - 1] = `${last}…`;
  return kept;
}
