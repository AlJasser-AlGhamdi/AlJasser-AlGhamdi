// Guards every generated SVG against things GitHub's image pipeline cannot render.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLValidator } from 'fast-xml-parser';

export function checkSvg(svg, { maxBytes = 300_000 } = {}) {
  const problems = [];
  const bytes = Buffer.byteLength(svg, 'utf8');
  if (bytes > maxBytes) problems.push(`size ${bytes} B exceeds ${maxBytes} B`);
  const v = XMLValidator.validate(svg);
  if (v !== true) problems.push(`xml not well-formed: ${v.err?.msg ?? 'unknown'}`);
  if (/<text[\s>/]/i.test(svg)) problems.push('<text> element present; text must be outlined');
  if (/<script[\s>/]/i.test(svg)) problems.push('<script> element present');
  if (/<foreignObject[\s>/]/i.test(svg)) problems.push('<foreignObject> present');
  if (/(?:href|src)\s*=\s*"(?:https?:)?\/\//i.test(svg)) problems.push('external reference (href/src to another host)');
  if (/@import|url\(\s*["']?(?:https?:)?\/\//i.test(svg)) problems.push('external css/url reference');
  return problems;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const target = process.argv[2] ?? '../assets';
  const files = fs.statSync(target).isDirectory()
    ? fs.readdirSync(target, { recursive: true }).filter((f) => f.endsWith('.svg')).map((f) => path.join(target, f))
    : [target];
  let bad = 0;
  for (const f of files) {
    const problems = checkSvg(fs.readFileSync(f, 'utf8'));
    if (problems.length) {
      bad += 1;
      console.log(`FAIL ${f}\n  - ${problems.join('\n  - ')}`);
    }
  }
  console.log(`${files.length - bad}/${files.length} svg files clean`);
  process.exit(bad ? 1 : 0);
}
