import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkSvg } from '../check.mjs';
import { PALETTE } from '../lib/svg.mjs';
import * as hero from '../hero.mjs';
import * as highlights from '../highlights.mjs';
import * as certs from '../certs.mjs';
import * as cards from '../cards.mjs';
import * as chips from '../chips.mjs';

const content = JSON.parse(fs.readFileSync(new URL('../content.json', import.meta.url), 'utf8'));
const count = (s, re) => (s.match(re) ?? []).length;

// ---- hero -----------------------------------------------------------------
test('hero: desktop and mobile variants are GitHub-safe and sized as designed', () => {
  const d = hero.render(content, { variant: 'dark' });
  const m = hero.render(content, { variant: 'light', mobile: true });
  assert.deepEqual(checkSvg(d), []);
  assert.deepEqual(checkSvg(m), []);
  assert.match(d, /viewBox="0 0 1200 400"/);
  assert.match(m, /viewBox="0 0 390 \d+"/);
});

test('hero: raven is clipped free of the monogram and perched on an amber rule', () => {
  const d = hero.render(content, { variant: 'dark' });
  assert.match(d, /<clipPath id="perch">/);
  assert.match(d, /class="raven"/);
  assert.ok(d.includes(`stroke="${PALETTE.amber}"`) || d.includes(`fill="${PALETTE.amber}"`), 'amber accent present');
});

test('hero: the name rises letter by letter and every role gets its own typewriter line', () => {
  const d = hero.render(content, { variant: 'dark' });
  const letters = count(d, /<g class="L"/g);
  assert.ok(letters >= content.name.replace(/\s/g, '').length, `letters outlined: ${letters}`);
  assert.equal(count(d, /<g class="role r\d+"/g), content.roles.length);
  assert.match(d, /steps\(/, 'typewriter uses step timing');
  assert.match(d, /animation-delay/);
});

test('hero: carries no location or coordinates line', () => {
  const d = hero.render(content, { variant: 'dark' });
  assert.doesNotMatch(d, /class="meta"/);
  assert.doesNotMatch(d, /JEDDAH|Jeddah|21\.54/);
});

test('hero: dark and light use inverse panels', () => {
  const d = hero.render(content, { variant: 'dark' });
  const l = hero.render(content, { variant: 'light' });
  assert.match(d, new RegExp(`<rect[^>]*fill="${PALETTE.ink}"`));
  assert.match(l, new RegExp(`<rect[^>]*fill="${PALETTE.bone}"`));
});

// ---- highlights -----------------------------------------------------------
test('highlights: one tile per item, staggered, in desktop and 2-column mobile layouts', () => {
  const d = highlights.render(content, { variant: 'dark' });
  const m = highlights.render(content, { variant: 'dark', mobile: true });
  assert.deepEqual(checkSvg(d), []);
  assert.deepEqual(checkSvg(m), []);
  assert.equal(count(d, /<g class="tile"/g), content.highlights.length);
  assert.equal(count(m, /<g class="tile"/g), content.highlights.length);
  assert.match(d, /viewBox="0 0 1200 \d+"/);
  assert.match(m, /viewBox="0 0 390 \d+"/);
  assert.ok(count(d, /animation-delay/g) >= content.highlights.length);
});

// ---- certs ----------------------------------------------------------------
test('certs: a group renders one chip per credential with its group label', () => {
  for (const g of content.certGroups) {
    const s = certs.render(g, { variant: 'light' });
    assert.deepEqual(checkSvg(s), [], g.id);
    assert.equal(count(s, /<g class="chip"/g), g.items.length, g.id);
    assert.match(s, /class="group-label"/);
  }
});

// ---- cards ----------------------------------------------------------------
test('cards: private projects carry a tag, public ones do not, and all are the same size', () => {
  const pub = cards.render(content.projects[0], { variant: 'dark' });
  const priv = cards.render(content.projects[1], { variant: 'dark' });
  assert.deepEqual(checkSvg(pub), []);
  assert.deepEqual(checkSvg(priv), []);
  assert.match(priv, /class="tag private"/);
  assert.doesNotMatch(pub, /class="tag private"/);
  assert.match(pub, /viewBox="0 0 390 170"/);
  assert.match(priv, /viewBox="0 0 390 170"/);
});

test('cards: long description lines wrap instead of overflowing the card', () => {
  const s = cards.render(content.projects[2], { variant: 'light' });
  assert.ok(count(s, /<g class="line"/g) >= 2, 'description split over at least two lines');
});

// ---- chips ----------------------------------------------------------------
test('chips: every link renders a labelled chip with an icon', () => {
  for (const l of content.links) {
    const s = chips.render(l, { variant: 'dark' });
    assert.deepEqual(checkSvg(s), [], l.id);
    assert.match(s, /class="icon"/, l.id);
    assert.match(s, /class="label"/, l.id);
  }
});

test('chips: unknown link ids fail loudly', () => {
  assert.throws(() => chips.render({ id: 'myspace', label: 'MySpace', href: 'https://x' }, { variant: 'dark' }), /icon/);
});
