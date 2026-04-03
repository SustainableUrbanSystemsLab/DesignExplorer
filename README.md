# Design Explorer

[![Deploy](https://github.com/SustainableUrbanSystemsLab/DesignExplorer/actions/workflows/deploy.yml/badge.svg)](https://github.com/SustainableUrbanSystemsLab/DesignExplorer/actions/workflows/deploy.yml)
[![CI](https://github.com/SustainableUrbanSystemsLab/DesignExplorer/actions/workflows/ci.yml/badge.svg)](https://github.com/SustainableUrbanSystemsLab/DesignExplorer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Interactive parametric design space explorer. Visualize, filter, and compare design alternatives from Grasshopper/Rhino parametric studies using parallel coordinates, scatter plots, and 2D/3D viewers.

**[Live Demo](https://sustainableurbansystemslab.github.io/DesignExplorer/)**

## Quick Start

```bash
npm install
npm run dev
```

## CSV Format

| Prefix | Meaning | Example |
|--------|---------|---------|
| `in:` | Input parameter | `in:Depth [ft]` |
| `out:` | Output metric | `out:Cooling[kWh]` |
| `img` | Image path | `img`, `img:perspective` |
| `threeD` | 3D model (glTF/STL/OBJ) | `threeD` |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests |
| `npm run check` | Type check |

## Tech Stack

Svelte 5 &bull; TypeScript &bull; D3 v7 &bull; Three.js &bull; Tailwind CSS 4 &bull; Vite

## License

MIT &mdash; [Sustainable Urban Systems Lab](https://www.sus-lab.com)
