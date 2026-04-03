# AGENT.md — Project State Summary

> Auto-generated summary of the Design Explorer v3 rewrite status.

## Current State: MVP Complete

The project has been fully rewritten from a legacy jQuery/Bootstrap/D3v3 static site to a modern Svelte 5 + TypeScript + Vite application.

### What's Working
- **Data loading**: Drag & drop CSV/ZIP files, paste URL, sample dataset, `?url=` query param
- **Parallel coordinates**: D3 v7, canvas-rendered lines, SVG axes/labels, brushable filtering, click-to-color-encode
- **Scatter matrix**: D3 v7, selectable dimensions, colored dots, hover highlighting
- **Image viewer**: Multi-image column support, lazy loading
- **3D viewer**: Three.js with glTF/GLB, STL, OBJ support, orbit controls, auto-centering
- **Thumbnail grid**: Sortable, color-bordered, lazy-loaded, favoritable
- **Input sliders**: Nearest-design matching when slider values change
- **Favorites**: Heart toggle, localStorage persistence, JSON/CSV export/import, filter-to-favorites
- **Data table**: Sortable, filterable, highlighted row tracking
- **Navbar**: Reset, zoom-in, exclude, export CSV controls
- **CI/CD**: GitHub Actions for linting/testing on PRs, auto-deploy to GitHub Pages on push to `main`

### Architecture
```
src/
  lib/
    types/       — TypeScript interfaces (DesignRow, ColumnMeta, FavoriteEntry, etc.)
    stores/      — Svelte 5 rune-based stores (dataset, selection, favorites)
    data/        — CSV parser, column classifier, URL loader, ZIP file loader
    charts/      — D3 v7 rendering (parallel-coords, scatter-matrix, shared color/axis utils)
    viewers/     — ImageViewer, ThreeDViewer, ViewerPanel (2D/3D toggle)
    components/  — UI components (Navbar, Sidebar, DataLoadModal, ThumbnailGrid, etc.)
```

### Test Coverage
- 28 unit tests (all passing) covering:
  - CSV parsing and column classification
  - URL resolution
  - Color scale creation
- No E2E tests yet (Playwright scaffolded but no test files)

### Known Limitations / Future Work
- **Bundle size**: 758KB (210KB gzipped) due to Three.js — should code-split with dynamic `import()`
- **No E2E tests**: Playwright is configured but no test files written
- **No ESLint config**: ESLint is in `package.json` but no `eslint.config.js` created yet
- **Parallel coords hover**: The nearest-line detection is approximate (average distance) — could be improved with per-segment distance
- **No dimension reordering**: The original app supported drag-to-reorder parallel coordinate axes
- **No axis flip**: The original app supported double-click to invert an axis
- **No settings persistence**: Study settings (scales, flips, hidden dims) aren't saved between sessions
- **Sample dataset is small**: Only 10 rows from the Red Box dataset (original had 125)

### Branch Strategy
- `dev` (default) — development, PRs target here
- `main` — production, auto-deploys to GitHub Pages
- `gh-pages` — legacy, can be deleted
- `master` — legacy, can be deleted

### Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| svelte | ^5.53 | UI framework |
| d3 | ^7.9 | Charts |
| three | ^0.170 | 3D viewer |
| fflate | ^0.8 | ZIP extraction |
| tailwindcss | ^4.1 | CSS |
| vite | ^8.0 | Build |
| vitest | ^3.2 | Tests |
