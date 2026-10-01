// Emits README.md from content.json so copy and image references never drift.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { picture, esc } from './lib/svg.mjs';

const A = 'assets';

function heroBlock(content) {
  return picture({
    dark: `${A}/hero-dark.svg`,
    light: `${A}/hero-light.svg`,
    mobileDark: `${A}/hero-mobile-dark.svg`,
    mobileLight: `${A}/hero-mobile-light.svg`,
    alt: `${content.name}: ${content.tagline}`,
    width: '100%',
  });
}

function chips(content) {
  const items = content.links.map((l) =>
    picture({ dark: `${A}/chip-${l.id}-dark.svg`, light: `${A}/chip-${l.id}-light.svg`, alt: l.label, href: l.href }),
  );
  return `<p align="center">\n${items.join('\n&nbsp;&nbsp;\n')}\n</p>`;
}

function highlights(content) {
  return picture({
    dark: `${A}/highlights-dark.svg`,
    light: `${A}/highlights-light.svg`,
    mobileDark: `${A}/highlights-mobile-dark.svg`,
    mobileLight: `${A}/highlights-mobile-light.svg`,
    alt: (content.highlights ?? []).map((h) => `${h.value} ${h.label}`).join('; ') || 'Highlights',
    width: '100%',
  });
}

function table(rows) {
  return ['| Event | Result | Field |', '|---|---|---|', ...rows.map((e) => `| ${e.event} | ${e.result} | ${e.scale} |`)].join('\n');
}

function arena(content) {
  let out = `## Arena\n\n${table(content.arena)}`;
  if (content.arenaMore?.length) {
    out += `\n\n<details>\n<summary>More honours</summary>\n\n${table(content.arenaMore)}\n\n</details>`;
  }
  return out;
}

function credentials(content) {
  const groups = content.certGroups.map((g) =>
    picture({
      dark: `${A}/certs-${g.id}-dark.svg`,
      light: `${A}/certs-${g.id}-light.svg`,
      alt: `${g.label}: ${g.items.map((i) => `${i.code} (${i.issuer})`).join(', ')}`,
      href: g.href,
    }),
  );
  return `## Credentials\n\n<p align="center">\n${groups.join('\n')}\n</p>`;
}

function projects(content) {
  const cards = content.projects.map((p) =>
    picture({
      dark: `${A}/cards/${p.id}-dark.svg`,
      light: `${A}/cards/${p.id}-light.svg`,
      alt: `${p.title}: ${p.line} (${p.metric})${p.private ? ', code private' : ''}`,
      href: p.href,
    }),
  );
  return `## Projects\n\n<p align="center">\n${cards.join('\n')}\n</p>`;
}

function activity(generated) {
  if (!generated) return '';
  const blocks = [];
  if (generated.threeD?.dark && generated.threeD?.light) {
    blocks.push(picture({ dark: generated.threeD.dark, light: generated.threeD.light, alt: 'Contribution calendar rendered as an isometric 3D graph, regenerated daily', width: '100%' }));
  }
  if (generated.activity?.dark && generated.activity?.light) {
    blocks.push(
      picture({
        dark: generated.activity.dark,
        light: generated.activity.light,
        mobileDark: generated.activity.mobileDark,
        mobileLight: generated.activity.mobileLight,
        alt: 'Year in ink: one dot per day, sized by contributions, regenerated daily',
        width: '100%',
      }),
    );
  }
  if (!blocks.length) return '';
  return `## Activity\n\n${blocks.join('\n\n')}`;
}

export function renderReadme(content, { generated = null } = {}) {
  const parts = [
    heroBlock(content),
    chips(content),
    `<p align="center">${esc(content.tagline)}</p>`,
    `> [!NOTE]\n> ${content.collaboration}`,
    highlights(content),
    arena(content),
    credentials(content),
    projects(content),
    activity(generated),
    `<p align="center"><sub>${esc(content.location)}</sub></p>`,
  ].filter(Boolean);
  return parts.join('\n\n') + '\n';
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));
  const generated = fs.existsSync('generated.json') ? JSON.parse(fs.readFileSync('generated.json', 'utf8')) : null;
  fs.writeFileSync('../README.md', renderReadme(content, { generated }));
  console.log(`wrote ../README.md (${generated ? 'with' : 'without'} generated graphs)`);
}
