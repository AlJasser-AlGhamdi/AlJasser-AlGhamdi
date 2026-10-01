import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkSvg } from '../check.mjs';
import { PALETTE } from '../lib/svg.mjs';
import * as arena from '../arena.mjs';
import * as mark from '../mark.mjs';

const content = JSON.parse(fs.readFileSync(new URL('../content.json', import.meta.url), 'utf8'));
const count = (s, re) => (s.match(re) ?? []).length;

test('arena: one row per entry, GitHub-safe, in two desktop columns and one mobile column', () => {
  const d = arena.render(content, { variant: 'dark' });
  const m = arena.render(content, { variant: 'light', mobile: true });
  assert.deepEqual(checkSvg(d), []);
  assert.deepEqual(checkSvg(m), []);
  assert.equal(count(d, /<g class="row/g), content.arena.length);
  assert.equal(count(m, /<g class="row/g), content.arena.length);
  assert.match(d, /viewBox="0 0 1200 \d+"/);
  assert.match(m, /viewBox="0 0 390 \d+"/);
});

test('arena: first places are marked as wins in amber, other ranks are not', () => {
  const d = arena.render(content, { variant: 'dark' });
  const wins = content.arena.filter((e) => /^1st/.test(e.rank)).length;
  assert.equal(count(d, /<g class="row win"/g), wins);
  assert.ok(count(d, new RegExp(`fill="${PALETTE.amber}"`, 'g')) >= wins);
});

test('arena: rows reveal with staggered delays and have reduced-motion final states', () => {
  const d = arena.render(content, { variant: 'dark' });
  assert.ok(count(d, /animation-delay/g) >= content.arena.length);
  assert.match(d, /prefers-reduced-motion: reduce\)\{[^}]*\}\.row\{opacity:1/);
});

test('mark: a small raven end-mark exists in both variants and is clipped free of the monogram', () => {
  for (const variant of ['dark', 'light']) {
    const s = mark.render({ variant });
    assert.deepEqual(checkSvg(s), [], variant);
    assert.match(s, /<clipPath id="perch">/);
    assert.match(s, /viewBox="0 0 \d+ \d+"/);
  }
});
