import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderActivity, normalizeCalendar } from '../activity.mjs';
import { checkSvg } from '../check.mjs';
import { PALETTE } from '../lib/svg.mjs';

// Three weeks, 21 days, counts chosen so the top five are unambiguous.
function fixture() {
  const weeks = [];
  let n = 0;
  for (let w = 0; w < 3; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const count = [0, 0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 0, 1, 1, 2, 4, 9, 0, 0, 7, 6][n];
      days.push({ date: `2026-09-${String(n + 1).padStart(2, '0')}`, count });
      n += 1;
    }
    weeks.push(days);
  }
  return { total: 175, weeks };
}

test('normalizeCalendar flattens the GraphQL shape into weeks of {date,count}', () => {
  const gql = {
    totalContributions: 3,
    weeks: [{ contributionDays: [{ date: '2026-01-04', contributionCount: 1 }, { date: '2026-01-05', contributionCount: 2 }] }],
  };
  const cal = normalizeCalendar(gql);
  assert.equal(cal.total, 3);
  assert.deepEqual(cal.weeks, [[{ date: '2026-01-04', count: 1 }, { date: '2026-01-05', count: 2 }]]);
});

test('renders one circle per day', () => {
  const svg = renderActivity(fixture(), { variant: 'dark' });
  assert.equal((svg.match(/<circle /g) ?? []).length, 21);
});

test('zero days get the minimum radius and the busiest day the maximum', () => {
  const svg = renderActivity(fixture(), { variant: 'dark' });
  const radii = [...svg.matchAll(/<circle [^>]*r="([\d.]+)"/g)].map((m) => Number(m[1]));
  const min = Math.min(...radii), max = Math.max(...radii);
  assert.ok(min > 0 && max > min * 3, `min ${min} max ${max}`);
  assert.equal(radii.filter((r) => r === min).length, 5); // five zero-count days in the fixture
  assert.equal(radii.filter((r) => r === max).length, 1); // the single 55-count day
});

test('exactly the five busiest days are drawn in amber', () => {
  const svg = renderActivity(fixture(), { variant: 'dark' });
  const amber = [...svg.matchAll(/<circle [^>]*fill="([^"]+)"/g)].filter((m) => m[1].toLowerCase() === PALETTE.amber.toLowerCase());
  assert.equal(amber.length, 5);
});

test('shows the total as outlined glyphs and passes the GitHub-safety check', () => {
  const svg = renderActivity(fixture(), { variant: 'dark' });
  assert.deepEqual(checkSvg(svg), []);
  assert.doesNotMatch(svg, /<text/);
  assert.ok(svg.includes('<path'), 'has outlined glyph paths');
});

test('dark and light variants use inverse backgrounds', () => {
  const d = renderActivity(fixture(), { variant: 'dark' });
  const l = renderActivity(fixture(), { variant: 'light' });
  assert.match(d, new RegExp(`<rect [^>]*fill="${PALETTE.ink}"`));
  assert.match(l, new RegExp(`<rect [^>]*fill="${PALETTE.bone}"`));
});

test('output is deterministic for the same input', () => {
  assert.equal(renderActivity(fixture(), { variant: 'dark' }), renderActivity(fixture(), { variant: 'dark' }));
});
