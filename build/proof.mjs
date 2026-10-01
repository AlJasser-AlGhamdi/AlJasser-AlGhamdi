// Renders generators in "still" mode (final animation state, no motion) to PNG
// contact sheets for visual review: node proof.mjs chips certs cards highlights hero
import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { PALETTE } from './lib/svg.mjs';

const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));

async function items(name) {
  const mod = await import(`./${name}.mjs`);
  switch (name) {
    case 'chips': return content.links.map((l) => ({ label: l.id, make: (o) => mod.render(l, o) }));
    case 'certs': return content.certGroups.map((g) => ({ label: g.id, make: (o) => mod.render(g, o) }));
    case 'cards': return content.projects.map((p) => ({ label: p.id, make: (o) => mod.render(p, o) }));
    case 'highlights': return [
      { label: 'desktop', make: (o) => mod.render(content, o) },
      { label: 'mobile', make: (o) => mod.render(content, { ...o, mobile: true }) },
    ];
    case 'hero':
    case 'arena': return [
      { label: 'desktop', make: (o) => mod.render(content, o) },
      { label: 'mobile', make: (o) => mod.render(content, { ...o, mobile: true }) },
    ];
    case 'mark': return [{ label: 'mark', make: (o) => mod.render(o) }];
    default: throw new Error(`unknown generator ${name}`);
  }
}

const size = (svg) => {
  const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  return { w: Number(m[1]), h: Number(m[2]) };
};

for (const name of process.argv.slice(2)) {
  const list = await items(name);
  const gap = 24;
  let y = gap;
  let maxW = 0;
  const placed = [];
  for (const it of list) {
    for (const variant of ['dark', 'light']) {
      const svg = it.make({ variant, still: true });
      const { w, h } = size(svg);
      placed.push({ svg, w, h, y, variant });
      y += h + gap;
      maxW = Math.max(maxW, w);
    }
  }
  const W = maxW + gap * 2, H = y;
  const sheet =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="#3a3a3f"/>` +
    placed
      .map((p) => {
        const bg = p.variant === 'dark' ? '#0d1117' : '#ffffff';
        const b64 = Buffer.from(p.svg).toString('base64');
        return `<rect x="${gap / 2}" y="${p.y - gap / 2}" width="${W - gap}" height="${p.h + gap}" fill="${bg}"/>` +
          `<image x="${gap}" y="${p.y}" width="${p.w}" height="${p.h}" href="data:image/svg+xml;base64,${b64}"/>`;
      })
      .join('') +
    `</svg>`;
  const scale = Math.min(1600 / W, 2);
  const png = new Resvg(sheet, { fitTo: { mode: 'width', value: Math.round(W * scale) } }).render().asPng();
  fs.mkdirSync('src/proofs', { recursive: true });
  fs.writeFileSync(`src/proofs/${name}.png`, png);
  console.log(`src/proofs/${name}.png (${placed.length} renders, ${W}x${H})`);
}
void PALETTE;
