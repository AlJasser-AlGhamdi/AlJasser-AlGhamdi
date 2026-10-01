// One-off tool: vectorise the raven mark from the GitHub avatar.
// Output: src/raven-trace.json (subpaths with bounding boxes) + src/raven-trace.png (proof for review).
import fs from 'node:fs';
import potrace from 'potrace';
import Jimp from 'jimp';
import { Resvg } from '@resvg/resvg-js';

const SRC = 'src/avatar.png';
const img = await Jimp.read(SRC);
const { width: W, height: H } = img.bitmap;
const corner = img.getPixelColor(0, 0) >>> 0;
const lum = (c) => ((c >>> 24) & 255) * 0.299 + ((c >>> 16) & 255) * 0.587 + ((c >>> 8) & 255) * 0.114;
console.log(`avatar ${W}x${H}, corner luminance ${lum(corner).toFixed(0)}, alpha ${corner & 255}`);

// The mark is white on a black disc. Anything outside the inscribed circle is
// forced to black so corners (if light or transparent) never get traced.
const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 1;
img.scan(0, 0, W, H, (x, y, idx) => {
  const d = Math.hypot(x - cx, y - cy);
  const a = img.bitmap.data[idx + 3];
  if (d > r || a < 128) {
    img.bitmap.data[idx] = 0; img.bitmap.data[idx + 1] = 0; img.bitmap.data[idx + 2] = 0; img.bitmap.data[idx + 3] = 255;
  }
});
const masked = await img.getBufferAsync(Jimp.MIME_PNG);

const tracer = new potrace.Potrace({
  blackOnWhite: false, // trace the LIGHT pixels (the raven and the JA monogram)
  threshold: 140,
  turdSize: 12,
  optTolerance: 0.3,
  alphaMax: 1,
  turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY,
});
await new Promise((res, rej) => tracer.loadImage(masked, (e) => (e ? rej(e) : res())));
const tag = tracer.getPathTag('#F2F0EA');
const d = tag.match(/ d="([^"]+)"/)[1];

// Split into subpaths and compute bounding boxes so the letters can be told apart from the bird.
const subpaths = d.split(/(?=M)/).filter(Boolean).map((sp) => {
  const nums = sp.match(/-?\d+(?:\.\d+)?/g).map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0), ys = nums.filter((_, i) => i % 2 === 1);
  return { d: sp.trim(), bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
});
fs.writeFileSync('src/raven-trace.json', JSON.stringify({ width: W, height: H, subpaths }, null, 1));
console.log(`${subpaths.length} subpaths`);
subpaths.forEach((s, i) => console.log(`  #${i} bbox=[${s.bbox.map((n) => n.toFixed(0)).join(', ')}] len=${s.d.length}`));

// Proof render: masked source vs trace, side by side on ink.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W * 2 + 30} ${H + 20}">
<rect width="100%" height="100%" fill="#0B0B0D"/>
<image href="data:image/png;base64,${masked.toString('base64')}" x="10" y="10" width="${W}" height="${H}"/>
<g transform="translate(${W + 20} 10)">${subpaths.map((s, i) => `<path d="${s.d}" fill="${i % 2 ? '#D9A441' : '#F2F0EA'}"/>`).join('')}</g>
</svg>`;
fs.writeFileSync('src/raven-trace.svg', svg);
fs.writeFileSync('src/raven-trace.png', new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
console.log('wrote src/raven-trace.{json,svg,png}');
