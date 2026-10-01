import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measure, outline, loadFont, wrapLines, createGlyphRun } from '../lib/text.mjs';

test('loadFont knows the four faces', () => {
  for (const f of ['serif', 'serif-italic', 'mono', 'mono-medium']) {
    assert.ok(loadFont(f).unitsPerEm > 0, `${f} loads`);
  }
});

test('measure scales linearly with font size', () => {
  const w20 = measure('Raven', { font: 'serif', size: 20 });
  const w40 = measure('Raven', { font: 'serif', size: 40 });
  assert.ok(w20 > 0);
  assert.ok(Math.abs(w40 - 2 * w20) < 0.01 * w40);
});

test('outline returns only path commands and no text element', () => {
  const { d } = outline('Raven', { font: 'serif', size: 40, x: 0, y: 40 });
  assert.match(d, /^[MLCQZ0-9.\-\s]+$/i);
  assert.ok(d.length > 50);
});

test('outline with anchor middle starts half the advance left of x', () => {
  const r = outline('Raven', { font: 'serif', size: 40, x: 300, y: 40, anchor: 'middle' });
  assert.ok(Math.abs(r.start - (300 - r.width / 2)) < 1e-6);
});

test('outline with anchor end ends at x', () => {
  const r = outline('Raven', { font: 'serif', size: 40, x: 300, y: 40, anchor: 'end' });
  assert.ok(Math.abs(r.start + r.width - 300) < 1e-6);
});

test('wrapLines breaks on spaces so no line exceeds maxWidth, keeping word order', () => {
  const text = 'Static APK analysis for insecure storage, exposed components and weak cryptography';
  const lines = wrapLines(text, { font: 'mono', size: 14, maxWidth: 300 });
  assert.ok(lines.length >= 2);
  for (const l of lines) assert.ok(measure(l, { font: 'mono', size: 14 }) <= 300, `too wide: ${l}`);
  assert.equal(lines.join(' '), text);
});

test('wrapLines caps the line count and marks truncation with an ellipsis', () => {
  const text = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen';
  const lines = wrapLines(text, { font: 'mono', size: 14, maxWidth: 120, maxLines: 2 });
  assert.equal(lines.length, 2);
  assert.ok(lines[1].endsWith('…'));
});

test('outline never emits NaN coordinates for common glyphs', () => {
  for (const face of ['serif', 'serif-italic', 'mono', 'mono-medium']) {
    const { d } = outline('The quick brown fox jumps over the lazy dog 0123456789 · & %', { font: face, size: 24, x: 0, y: 24 });
    assert.doesNotMatch(d, /NaN/, face);
  }
});

test('glyphRun defines each distinct glyph once and references it with <use>', () => {
  const run = createGlyphRun();
  const a = run.place('aaa', { font: 'mono', size: 20, x: 0, y: 20 });
  assert.equal((run.defs().match(/<path /g) ?? []).length, 1);
  assert.equal((a.uses.match(/<use /g) ?? []).length, 3);
  assert.ok(Math.abs(a.width - measure('aaa', { font: 'mono', size: 20 })) < 1e-6);
  run.place('ab', { font: 'mono', size: 12, x: 0, y: 0 });
  assert.equal((run.defs().match(/<path /g) ?? []).length, 2, 'size does not create new defs');
});

test('glyphRun transforms encode position and scale in font units, flipping y', () => {
  const run = createGlyphRun();
  const r = run.place('A', { font: 'serif', size: 50, x: 10, y: 60 });
  const s = Number((50 / loadFont('serif').unitsPerEm).toFixed(5));
  assert.ok(r.uses.includes(`transform="matrix(${s} 0 0 -${s} 10 60)"`), r.uses);
  assert.match(run.defs(), /<path id="s\d+" d="M/);
});

test('glyphRun per-letter mode yields one use per visible glyph with its x position', () => {
  const run = createGlyphRun();
  const r = run.place('Al Ja', { font: 'serif', size: 50, x: 0, y: 50, perLetter: true });
  assert.equal(r.letters.length, 4);
  assert.ok(r.letters.every((l) => /^<use /.test(l.use) && typeof l.x === 'number'));
  assert.ok(r.letters[1].x > r.letters[0].x);
});

test('glyphRun honours anchor like outline does', () => {
  const run = createGlyphRun();
  const r = run.place('Raven', { font: 'serif', size: 40, x: 300, y: 40, anchor: 'middle' });
  const o = outline('Raven', { font: 'serif', size: 40, x: 300, y: 40, anchor: 'middle' });
  assert.ok(Math.abs(r.start - o.start) < 1e-6 && Math.abs(r.width - o.width) < 1e-6);
});

test('letterSpacing widens the run by (n-1)*spacing', () => {
  const base = measure('Raven', { font: 'mono', size: 20 });
  const spaced = measure('Raven', { font: 'mono', size: 20, letterSpacing: 3 });
  assert.ok(Math.abs(spaced - (base + 4 * 3)) < 1e-6);
});
