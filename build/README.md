# Build

Everything on the profile page is generated from this folder. Nothing is drawn by hand.

- `content.json` holds every word and number shown on the page.
- `npm run build` regenerates the SVG assets in `../assets` and `../README.md`.
- `npm test` runs the generator tests (layout rules, GitHub-safety checks, README structure).
- `node proof.mjs hero arena cards` renders still PNG proofs to `src/proofs/` for review.
- `node social-preview.mjs` renders the 1280×640 social-preview images.

Text is converted to outlines at build time (Instrument Serif and JetBrains Mono, both OFL, see `fonts/`),
so no web font is needed. Each image ships as a dark and light pair, with phone variants where the text
would otherwise shrink too far. Motion is CSS only and stops under `prefers-reduced-motion`.

The two activity graphics are produced daily by `.github/workflows/graphs.yml` and published to the
`output` branch; `activity.mjs` renders the "Year in ink" strip from the GitHub GraphQL contribution
calendar, and `conf/3d-contrib.json` colours the 3D graph.
