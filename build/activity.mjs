// "Year in ink": the contribution calendar as ink dots. Rendered by the
// activity workflow from GitHub's GraphQL contributionCalendar.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGlyphRun } from './lib/text.mjs';
import { svgDoc, theme, r2 } from './lib/svg.mjs';

export function normalizeCalendar(cal) {
  return {
    total: cal.totalContributions,
    weeks: cal.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))),
  };
}

export async function fetchCalendar({ login, token }) {
  const query = `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } } }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'raven-noir-activity' },
    body: JSON.stringify({ query, variables: { login } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GraphQL failed: ${res.status} ${JSON.stringify(json.errors ?? json)}`);
  return normalizeCalendar(json.data.user.contributionsCollection.contributionCalendar);
}

const LAYOUT = {
  desktop: { cell: 15, padX: 42, top: 76, bottom: 36, title: 30, meta: 15, rMin: 1.3, rMax: 6.2 },
  mobile: { cell: 7, padX: 10, top: 64, bottom: 16, title: 22, meta: 12, rMin: 0.7, rMax: 2.9 },
};

export function renderActivity(cal, { variant = 'dark', mobile = false } = {}) {
  const t = theme(variant);
  const L = mobile ? LAYOUT.mobile : LAYOUT.desktop;
  const cols = cal.weeks.length;
  const W = L.padX * 2 + cols * L.cell;
  const H = L.top + 7 * L.cell + L.bottom;
  const days = cal.weeks.flat();
  const max = Math.max(1, ...days.map((d) => d.count));
  const top5 = new Set(
    [...days].filter((d) => d.count > 0).sort((a, b) => b.count - a.count || a.date.localeCompare(b.date)).slice(0, 5).map((d) => d.date),
  );
  const radius = (c) => (c === 0 ? L.rMin : r2(L.rMin + (L.rMax - L.rMin) * Math.sqrt(c / max)));

  const dots = cal.weeks
    .map((week, w) => {
      const cx = r2(L.padX + w * L.cell + L.cell / 2);
      const circles = week
        .map((d, i) => {
          const cy = r2(L.top + i * L.cell + L.cell / 2);
          const amber = top5.has(d.date);
          const fill = amber ? t.accent : d.count === 0 ? t.muted : t.fg;
          const op = d.count === 0 ? ' opacity="0.35"' : '';
          return `<circle cx="${cx}" cy="${cy}" r="${radius(d.count)}" fill="${fill}"${op}${amber ? ' class="a"' : ''}/>`;
        })
        .join('');
      return `<g class="w" style="animation-delay:${r2(0.25 + w * 0.035)}s">${circles}</g>`;
    })
    .join('');

  const run = createGlyphRun();
  const title = run.place('Year in ink', { font: 'serif', size: L.title, x: L.padX, y: mobile ? 30 : 42 });
  const meta = `${cal.total.toLocaleString('en-US')} contributions in the last year`;
  const metaRun = mobile
    ? run.place(meta, { font: 'mono', size: L.meta, x: L.padX, y: 50 })
    : run.place(meta, { font: 'mono', size: L.meta, x: W - L.padX, y: 42, anchor: 'end' });

  const styles = [
    `.w{opacity:0;animation:ink .9s cubic-bezier(.2,.7,.2,1) forwards}`,
    `@keyframes ink{from{opacity:0}to{opacity:1}}`,
    `.a{animation:glow 3.2s ease-in-out infinite}`,
    `@keyframes glow{0%,100%{opacity:1}50%{opacity:.55}}`,
  ].join('');

  const body = [
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="${t.bg}" stroke="${t.line}"/>`,
    `<g fill="${t.fg}">${title.uses}</g>`,
    `<g fill="${t.muted}">${metaRun.uses}</g>`,
    dots,
  ].join('');

  return svgDoc({
    width: W,
    height: H,
    title: `Year in ink: ${meta}`,
    desc: 'Each dot is one day; its size follows the number of contributions that day. The five busiest days are amber.',
    body,
    styles,
    defs: run.defs(),
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const login = process.env.USERNAME_OVERRIDE || process.env.GITHUB_REPOSITORY_OWNER || 'AlJasser-AlGhamdi';
  const token = process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN or PROFILE_TOKEN is required');
  const outDir = process.argv[2] ?? 'dist';
  const cal = await fetchCalendar({ login, token });
  fs.mkdirSync(outDir, { recursive: true });
  for (const variant of ['dark', 'light']) {
    fs.writeFileSync(path.join(outDir, `activity-${variant}.svg`), renderActivity(cal, { variant }));
    fs.writeFileSync(path.join(outDir, `activity-mobile-${variant}.svg`), renderActivity(cal, { variant, mobile: true }));
  }
  console.log(`rendered ${cal.total} contributions over ${cal.weeks.length} weeks into ${outDir}/`);
}
