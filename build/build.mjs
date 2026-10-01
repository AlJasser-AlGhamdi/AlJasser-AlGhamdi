// Builds every committed asset into ../assets and emits ../README.md.
// Deterministic: same content.json + fonts + trace => identical files.
import fs from 'node:fs';
import path from 'node:path';
import { checkSvg } from './check.mjs';
import * as hero from './hero.mjs';
import * as highlights from './highlights.mjs';
import * as certs from './certs.mjs';
import * as cards from './cards.mjs';
import * as chips from './chips.mjs';
import * as arena from './arena.mjs';
import * as mark from './mark.mjs';
import { renderReadme } from './render-readme.mjs';

const OUT = path.resolve('../assets');
const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));
fs.mkdirSync(path.join(OUT, 'cards'), { recursive: true });

const written = [];
function emit(name, svg) {
  const problems = checkSvg(svg);
  if (problems.length) throw new Error(`${name}: ${problems.join('; ')}`);
  const file = path.join(OUT, name);
  fs.writeFileSync(file, svg);
  written.push({ name, bytes: Buffer.byteLength(svg) });
}

for (const variant of ['dark', 'light']) {
  emit(`hero-${variant}.svg`, hero.render(content, { variant }));
  emit(`hero-mobile-${variant}.svg`, hero.render(content, { variant, mobile: true }));
  emit(`highlights-${variant}.svg`, highlights.render(content, { variant }));
  emit(`highlights-mobile-${variant}.svg`, highlights.render(content, { variant, mobile: true }));
  emit(`arena-${variant}.svg`, arena.render(content, { variant }));
  emit(`arena-mobile-${variant}.svg`, arena.render(content, { variant, mobile: true }));
  emit(`mark-${variant}.svg`, mark.render({ variant }));
  for (const link of content.links) emit(`chip-${link.id}-${variant}.svg`, chips.render(link, { variant }));
  for (const group of content.certGroups) emit(`certs-${group.id}-${variant}.svg`, certs.render(group, { variant }));
  for (const project of content.projects) emit(`cards/${project.id}-${variant}.svg`, cards.render(project, { variant }));
}

const generated = fs.existsSync('generated.json') ? JSON.parse(fs.readFileSync('generated.json', 'utf8')) : null;
fs.writeFileSync('../README.md', renderReadme(content, { generated }));

const total = written.reduce((s, w) => s + w.bytes, 0);
const biggest = [...written].sort((a, b) => b.bytes - a.bytes).slice(0, 3).map((w) => `${w.name} ${(w.bytes / 1024).toFixed(0)} KB`);
console.log(`${written.length} svg files, ${(total / 1024).toFixed(0)} KB total; largest: ${biggest.join(', ')}`);
console.log(`README.md written ${generated ? 'with' : 'without'} generated graphs`);
