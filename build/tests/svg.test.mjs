import { test } from 'node:test';
import assert from 'node:assert/strict';
import { svgDoc, picture, theme, PALETTE, esc } from '../lib/svg.mjs';

test('svgDoc wraps body with xmlns, viewBox, title and a reduced-motion rule', () => {
  const s = svgDoc({ width: 100, height: 50, title: 'T', body: '<rect/>' });
  assert.match(s, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(s, /viewBox="0 0 100 50"/);
  assert.match(s, /<title>T<\/title>/);
  assert.match(s, /prefers-reduced-motion: reduce/);
  assert.match(s, /<rect\/>/);
});

test('theme returns inverse ink/bone for dark and light with the same accent', () => {
  const d = theme('dark'), l = theme('light');
  assert.equal(d.bg, PALETTE.ink); assert.equal(d.fg, PALETTE.bone);
  assert.equal(l.bg, PALETTE.bone); assert.equal(l.fg, PALETTE.ink);
  assert.equal(d.accent, PALETTE.amber); assert.equal(l.accent, PALETTE.amber);
});

test('picture emits a dark source, a light img with alt, and wraps in a link when href given', () => {
  const p = picture({ dark: 'a-d.svg', light: 'a-l.svg', alt: 'Hero', href: 'https://x' });
  assert.match(p, /<a href="https:\/\/x">/);
  assert.match(p, /<source media="\(prefers-color-scheme: dark\)" srcset="a-d\.svg">/);
  assert.match(p, /<img[^>]*alt="Hero"[^>]*src="a-l\.svg"/);
});

test('picture lists mobile sources before desktop ones', () => {
  const p = picture({ dark: 'desk-dark.svg', light: 'desk-light.svg', mobileDark: 'mob-dark.svg', mobileLight: 'mob-light.svg', alt: 'x' });
  const i = (s) => p.indexOf(`srcset="${s}"`);
  assert.ok(i('mob-dark.svg') > -1 && i('mob-light.svg') > -1 && i('desk-dark.svg') > -1);
  assert.ok(i('mob-dark.svg') < i('desk-dark.svg') && i('mob-light.svg') < i('desk-dark.svg'));
  assert.match(p, /media="\(max-width: 600px\) and \(prefers-color-scheme: dark\)" srcset="mob-dark\.svg"/);
  assert.match(p, /media="\(max-width: 600px\)" srcset="mob-light\.svg"/);
});

test('esc escapes xml specials', () => {
  assert.equal(esc('a<b&c"'), 'a&lt;b&amp;c&quot;');
});
