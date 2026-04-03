# CLAUDE.md

## Project Overview
Design Explorer is a Svelte 5 + TypeScript web app for exploring parametric design spaces.
Architects use it to compare design alternatives from Grasshopper/Rhino parametric studies.

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build (outputs to `dist/`)
- `npm test` — Run unit tests (vitest)
- `npm run check` — Type check (svelte-check + tsc)
- `npm run lint` — ESLint + Prettier check

## Architecture
- `src/lib/types/` — TypeScript type definitions
- `src/lib/stores/` — Svelte 5 rune-based stores (dataset, selection, favorites)
- `src/lib/data/` — CSV parsing, file loading, URL loading
- `src/lib/charts/` — D3 v7 chart rendering (parallel-coords, scatter-matrix)
- `src/lib/viewers/` — Image and Three.js 3D viewers
- `src/lib/components/` — UI components (layout, thumbnails, controls, favorites)
- `tests/unit/` — Vitest unit tests

## Key Conventions
- CSV columns use `in:` prefix for inputs, `out:` for outputs, `img` for images, `threeD` for 3D models
- Svelte 5 runes ($state, $derived, $effect) — no legacy stores
- D3 renders directly to SVG/Canvas, not through Svelte's DOM
- Tailwind CSS 4 for all styling, no separate CSS files except app.css
- GitHub Pages deployment via GitHub Actions (base path: `/DesignExplorer/`)
