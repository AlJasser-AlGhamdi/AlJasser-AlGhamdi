import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderReadme } from '../render-readme.mjs';

const content = {
  name: 'AlJasser AlGhamdi',
  tagline: 'Cybersecurity and AI researcher in Jeddah.',
  collaboration: 'Open to research collaboration in ML security.',
  links: [
    { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/x' },
    { id: 'orcid', label: 'ORCID', href: 'https://orcid.org/0000' },
  ],
  arena: [
    { event: 'KAUST Academy CTF', result: '1st place', scale: '50 participants' },
    { event: 'Black Hat MEA CTF', result: 'Top 5 Saudi team', scale: 'national finals' },
  ],
  arenaMore: [{ event: 'Dean of Student Affairs', result: 'Certificate of Excellence', scale: 'award' }],
  certGroups: [
    { id: 'offensive', label: 'Offensive', items: [{ code: 'eCPPT', issuer: 'INE' }, { code: 'eWPTX', issuer: 'INE' }] },
    { id: 'defense', label: 'Defense & DFIR', items: [{ code: 'eCTHP', issuer: 'INE' }] },
  ],
  projects: [
    { id: 'scan-to-controls', title: 'scan-to-controls', line: 'Compliance toolkit', metric: '422 tests', href: 'https://github.com/x/scan-to-controls' },
    { id: 'phishing', title: 'Phishing Detection System', line: 'Email classifier', metric: 'F1 0.92', private: true },
    { id: 'yolo', title: 'Stolen Vehicle Detection', line: 'YOLOv8 pipeline', metric: '94.3% at 28 fps', private: true },
  ],
  location: 'Jeddah, Saudi Arabia',
};
const generated = { threeD: { dark: 'https://raw.example/3d-dark.svg', light: 'https://raw.example/3d-light.svg' }, activity: { dark: 'https://raw.example/a-dark.svg', light: 'https://raw.example/a-light.svg' } };

test('hero picture block comes first, with mobile and dark sources', () => {
  const md = renderReadme(content, { generated });
  const hero = md.indexOf('assets/hero-dark.svg');
  assert.ok(hero > -1 && hero < 400, 'hero near the top');
  assert.match(md, /srcset="assets\/hero-mobile-dark\.svg"/);
  assert.match(md, /<img alt="[^"]+" src="assets\/hero-light\.svg"/);
});

test('every link becomes a linked chip picture', () => {
  const md = renderReadme(content, { generated });
  for (const l of content.links) {
    assert.ok(md.includes(`<a href="${l.href}">`), `${l.id} linked`);
    assert.ok(md.includes(`assets/chip-${l.id}-dark.svg`), `${l.id} chip`);
  }
});

test('arena table lists every event and hides the long tail in details', () => {
  const md = renderReadme(content, { generated });
  for (const e of content.arena) assert.ok(md.includes(`| ${e.event} | ${e.result} | ${e.scale} |`), e.event);
  const details = md.indexOf('<details>');
  assert.ok(details > -1 && md.indexOf('Dean of Student Affairs') > details);
});

test('project cards use intrinsic size (no percentage width) and private ones are not linked to a repo', () => {
  const md = renderReadme(content, { generated });
  assert.ok(md.includes('<a href="https://github.com/x/scan-to-controls">'));
  assert.equal((md.match(/assets\/cards\/[a-z0-9-]+-light\.svg">/g) ?? []).length, 3);
  assert.doesNotMatch(md, /cards\/[a-z0-9-]+-light\.svg" width=/);
  assert.doesNotMatch(md, /<a href="[^"]*phishing/);
});

test('credential groups describe their items in alt text', () => {
  const md = renderReadme(content, { generated });
  assert.ok(md.includes('alt="Offensive: eCPPT (INE), eWPTX (INE)"'));
  assert.doesNotMatch(md, /object Object/);
});

test('generated graphs are referenced from the output branch urls given', () => {
  const md = renderReadme(content, { generated });
  assert.ok(md.includes(generated.threeD.dark) && md.includes(generated.threeD.light));
  assert.ok(md.includes(generated.activity.dark) && md.includes(generated.activity.light));
});

test('has the collaboration note, the location line, and no research section', () => {
  const md = renderReadme(content, { generated });
  assert.match(md, /> \[!NOTE\]\n> Open to research collaboration/);
  const loc = md.lastIndexOf('Jeddah, Saudi Arabia');
  assert.ok(loc > md.length * 0.9, 'location line sits at the very end');
  assert.doesNotMatch(md, /## Research/i);
});

test('graph sections are omitted when no generated urls exist yet', () => {
  const md = renderReadme(content, { generated: null });
  assert.doesNotMatch(md, /raw\.example/);
  assert.doesNotMatch(md, /<picture>\n\s*<source[^>]*srcset=""/);
});
