// Palette tokens, theme variants and small emitters shared by every generator.
export const PALETTE = {
  ink: '#0B0B0D',
  graphite: '#1C1C21',
  smoke: '#55555C',
  mist: '#8E8E95',
  ash: '#C9C7C0',
  bone: '#F2F0EA',
  amber: '#D9A441',
};

export function theme(variant) {
  if (variant === 'dark') {
    return { variant, bg: PALETTE.ink, fg: PALETTE.bone, muted: PALETTE.mist, line: PALETTE.graphite, panel: PALETTE.graphite, lift: '#17171C', accent: PALETTE.amber };
  }
  if (variant === 'light') {
    return { variant, bg: PALETTE.bone, fg: PALETTE.ink, muted: PALETTE.smoke, line: PALETTE.ash, panel: '#E8E6DF', lift: '#FAF9F5', accent: PALETTE.amber };
  }
  throw new Error(`unknown variant: ${variant}`);
}

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Standalone SVG document. All motion is CSS so the reduced-motion rule can stop it;
 * `reduced` holds the final-state rules applied when motion is off, so nothing that
 * starts hidden stays hidden.
 */
export function svgDoc({ width, height, title, desc = '', body, styles = '', defs = '', reduced = '' }) {
  const reducedMotion = `@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}${reduced}}`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">`,
    `<title>${esc(title)}</title>`,
    desc ? `<desc>${esc(desc)}</desc>` : '',
    `<style>${styles}${reducedMotion}</style>`,
    defs ? `<defs>${defs}</defs>` : '',
    body,
    `</svg>`,
  ].join('');
}

/** Markdown-safe <picture> block with dark/light (and optional mobile) variants. */
export function picture({ dark, light, mobileDark, mobileLight, alt, width, href }) {
  const w = width ? ` width="${width}"` : '';
  const sources = [];
  if (mobileDark) sources.push(`  <source media="(max-width: 600px) and (prefers-color-scheme: dark)" srcset="${mobileDark}">`);
  if (mobileLight) sources.push(`  <source media="(max-width: 600px)" srcset="${mobileLight}">`);
  sources.push(`  <source media="(prefers-color-scheme: dark)" srcset="${dark}">`);
  const img = `  <img alt="${esc(alt)}" src="${light}"${w}>`;
  const pic = `<picture>\n${sources.join('\n')}\n${img}\n</picture>`;
  return href ? `<a href="${href}">\n${pic}\n</a>` : pic;
}

/** Round to 2 decimals for compact attribute output. */
export const r2 = (n) => Math.round(n * 100) / 100;
