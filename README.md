# Design Explorer

Interactive multi-dimensional parametric design space explorer for architects and urban designers. Visualize, filter, and compare hundreds of design alternatives generated from parametric studies in tools like Grasshopper/Rhino.

**[Live Demo](https://sustainableurbansystemslab.github.io/DesignExplorer/)**

## Features

- **Parallel Coordinates** — Filter multi-dimensional design data with brushable axes. Click dimension labels to color-encode by that metric.
- **Scatter Matrix** — Analyze correlations between output parameters with selectable dimensions.
- **2D/3D Viewer** — Preview design images and 3D models (glTF/GLB, STL, OBJ) with orbit controls.
- **Thumbnail Grid** — Browse and sort all design solutions visually.
- **Input Sliders** — Navigate the design space by adjusting input parameters; the closest matching design is highlighted automatically.
- **Favorites** — Mark designs with a heart, filter to favorites only, export as JSON or CSV.
- **Flexible Data Loading** — Drag & drop CSV/ZIP files, or paste a URL to a hosted dataset.
- **Shareable Links** — `?url=<csv-url>` query parameter for direct linking to studies.

## CSV Format

Design Explorer expects a CSV with column-name conventions:

| Prefix | Meaning | Example |
|--------|---------|---------|
| `in:` | Input parameter | `in:Depth [ft]`, `in:WWR [%]` |
| `out:` | Output metric | `out:Cooling[kWh]`, `out:DA [%]` |
| `img` | Image path (relative or absolute URL) | `img`, `img:perspective` |
| `threeD` | 3D model path (glTF, STL, OBJ) | `threeD`, `threeD:massing` |
| *(none)* | Metadata | `Description`, `Name` |

Units in `[brackets]` are extracted and displayed automatically.

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type check
npm run check
```

## Tech Stack

- **Svelte 5** + TypeScript
- **Vite** for builds
- **D3 v7** for parallel coordinates and scatter plots
- **Three.js** for 3D model viewing
- **Tailwind CSS 4** for styling
- **Vitest** for unit tests
- **GitHub Actions** for CI/CD and GitHub Pages deployment

## Deployment

Pushes to `main` automatically build and deploy to GitHub Pages via the `.github/workflows/deploy.yml` workflow.

## License

MIT License. See [LICENSE](LICENSE) for details.

Built by the [Sustainable Urban Systems Lab](https://www.sus-lab.com).
