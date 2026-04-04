import {
  select,
  scaleLinear,
  scalePoint,
  axisLeft,
  brushY,
  type Selection,
  type ScaleLinear,
} from 'd3';
import type { DesignRow, ColumnMeta } from '../../types/data';
import type { ColorScale } from '../shared/color-scale';
import { DEFAULT_COLOR, MUTED_COLOR } from '../shared/color-scale';
import { smartFormat, truncateLabel } from '../shared/axis-utils';

export interface ParallelCoordsConfig {
  dimensions: ColumnMeta[];
  rows: DesignRow[];
  onBrush: (column: string, extent: [number, number] | null) => void;
  onDimensionClick: (column: string) => void;
  onHighlight: (row: DesignRow | null) => void;
}

export interface ParallelCoordsDrawConfig {
  rows: DesignRow[];
  brushedIndices: Set<number>;
  highlighted: DesignRow | null;
  colorScale: ColorScale | null;
}

interface DimensionState {
  column: ColumnMeta;
  scale: ScaleLinear<number, number>;
}

const MARGIN = { top: 40, right: 20, bottom: 10, left: 20 };
const AXIS_PADDING = 60;

/** Persistent state held between setup and draw calls */
export interface ParallelCoordsState {
  xScale: (name: string) => number | undefined;
  dimStates: Map<string, DimensionState>;
  numericDims: ColumnMeta[];
  width: number;
  height: number;
}

/**
 * Set up the SVG layer (axes, labels, brushes). Called once when data changes.
 * Returns state needed by drawLines().
 */
export function setupParallelCoords(
  svgElement: SVGSVGElement,
  canvasElement: HTMLCanvasElement,
  config: ParallelCoordsConfig
): ParallelCoordsState | null {
  const { dimensions, rows, onBrush, onDimensionClick, onHighlight } = config;

  if (dimensions.length === 0 || rows.length === 0) return null;

  const rect = svgElement.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  // X scale
  const xScale = scalePoint<string>()
    .domain(dimensions.map((d) => d.originalName))
    .range([MARGIN.left + AXIS_PADDING, width - MARGIN.right - AXIS_PADDING]);

  // Y scales
  const dimStates: Map<string, DimensionState> = new Map();
  for (const dim of dimensions) {
    if (!dim.isNumeric) continue;
    const scale = scaleLinear()
      .domain([dim.min ?? 0, dim.max ?? 1])
      .range([innerHeight + MARGIN.top, MARGIN.top])
      .nice();
    dimStates.set(dim.originalName, { column: dim, scale });
  }

  const numericDims = dimensions.filter((d) => d.isNumeric);

  // Build SVG (axes, labels, brushes)
  const svg = select(svgElement);
  svg.selectAll('*').remove();
  svg.attr('width', width).attr('height', height);

  const g = svg.append('g');

  for (const dim of numericDims) {
    const state = dimStates.get(dim.originalName);
    if (!state) continue;

    const x = xScale(dim.originalName) ?? 0;
    const axisGroup = g.append('g').attr('transform', `translate(${x}, 0)`);

    // Axis ticks
    axisGroup
      .call(axisLeft(state.scale).ticks(6).tickFormat((d) => smartFormat(d as number)))
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('fill', '#6b7280');

    // Dimension label
    axisGroup
      .append('text')
      .attr('y', MARGIN.top - 16)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('cursor', 'pointer')
      .attr('fill', '#374151')
      .attr('class', 'pc-dim-label')
      .attr('data-dim', dim.originalName)
      .text(truncateLabel(dim.displayName + (dim.unit ? ` [${dim.unit}]` : '')))
      .on('click', () => onDimensionClick(dim.originalName))
      .append('title')
      .text(dim.displayName + (dim.unit ? ` [${dim.unit}]` : ''));

    // Brush
    const brush = brushY()
      .extent([
        [-14, MARGIN.top],
        [14, innerHeight + MARGIN.top],
      ])
      .on('brush end', (event) => {
        if (!event.selection) {
          onBrush(dim.originalName, null);
          return;
        }
        const [y0, y1] = event.selection as [number, number];
        const v0 = state.scale.invert(y0);
        const v1 = state.scale.invert(y1);
        onBrush(dim.originalName, [Math.min(v0, v1), Math.max(v0, v1)]);
      });

    axisGroup.append('g').attr('class', 'pc-brush').call(brush);
  }

  // Set up canvas hover
  canvasElement.onmousemove = (event: MouseEvent) => {
    const cr = canvasElement.getBoundingClientRect();
    const mx = event.clientX - cr.left;
    const my = event.clientY - cr.top;

    let closest: DesignRow | null = null;
    let minDist = 20;

    for (const row of rows) {
      let totalDist = 0;
      let validDims = 0;

      for (const dim of numericDims) {
        const ds = dimStates.get(dim.originalName);
        if (!ds) continue;
        const x = xScale(dim.originalName) ?? 0;
        const val = row[dim.originalName];
        if (typeof val !== 'number') continue;
        const y = ds.scale(val);
        const dx = mx - x;
        const dy = my - y;
        totalDist += Math.sqrt(dx * dx + dy * dy);
        validDims++;
      }

      if (validDims > 0) {
        const avgDist = totalDist / validDims;
        if (avgDist < minDist) {
          minDist = avgDist;
          closest = row;
        }
      }
    }

    onHighlight(closest);
  };

  canvasElement.onmouseleave = () => onHighlight(null);

  return { xScale, dimStates, numericDims, width, height };
}

/**
 * Draw/redraw just the canvas lines. Called whenever brush/highlight/color changes.
 * Does NOT touch the SVG layer (preserving brush selections).
 */
export function drawLines(
  canvasElement: HTMLCanvasElement,
  pcState: ParallelCoordsState,
  config: ParallelCoordsDrawConfig
) {
  const { rows, brushedIndices, highlighted, colorScale } = config;
  const { xScale, dimStates, numericDims, width, height } = pcState;

  const dpr = window.devicePixelRatio;
  const targetW = Math.round(width * dpr);
  const targetH = Math.round(height * dpr);

  // Only resize canvas backing store when dimensions actually changed
  if (canvasElement.width !== targetW || canvasElement.height !== targetH) {
    canvasElement.width = targetW;
    canvasElement.height = targetH;
    canvasElement.style.width = width + 'px';
    canvasElement.style.height = height + 'px';
  }

  const ctx = canvasElement.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // Muted lines (non-brushed)
  ctx.globalAlpha = 0.1;
  ctx.lineWidth = 1;
  for (const row of rows) {
    if (brushedIndices.has(row._index)) continue;
    drawLine(ctx, row, numericDims, xScale, dimStates, MUTED_COLOR);
  }

  // Brushed lines
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.5;
  for (const row of rows) {
    if (!brushedIndices.has(row._index)) continue;
    const color = colorScale ? colorScale.getColor(row) : DEFAULT_COLOR;
    drawLine(ctx, row, numericDims, xScale, dimStates, color);
  }

  // Highlighted line on top
  if (highlighted && brushedIndices.has(highlighted._index)) {
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    const color = colorScale ? colorScale.getColor(highlighted) : '#ff6b35';
    drawLine(ctx, highlighted, numericDims, xScale, dimStates, color);
  }

  ctx.globalAlpha = 1;
}

/**
 * Update dimension label colors when the color-encoding dimension changes.
 */
export function updateLabelColors(svgElement: SVGSVGElement, colorDimension: string) {
  select(svgElement)
    .selectAll('.pc-dim-label')
    .attr('fill', function () {
      const dim = select(this).attr('data-dim');
      return dim === colorDimension ? '#f97316' : '#374151';
    });
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  row: DesignRow,
  dimensions: ColumnMeta[],
  xScale: (name: string) => number | undefined,
  dimStates: Map<string, DimensionState>,
  color: string
) {
  ctx.beginPath();
  ctx.strokeStyle = color;

  let first = true;
  for (const dim of dimensions) {
    const state = dimStates.get(dim.originalName);
    if (!state) continue;
    const x = xScale(dim.originalName) ?? 0;
    const val = row[dim.originalName];
    if (typeof val !== 'number') continue;
    const y = state.scale(val);

    if (first) {
      ctx.moveTo(x, y);
      first = false;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}
