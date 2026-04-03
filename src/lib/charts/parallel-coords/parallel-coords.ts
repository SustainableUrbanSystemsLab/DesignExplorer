import {
  select,
  scaleLinear,
  scalePoint,
  axisLeft,
  brushY,
  type Selection,
  type ScaleLinear,
  line,
} from 'd3';
import type { DesignRow, ColumnMeta, BrushExtent } from '../../types/data';
import type { ColorScale } from '../shared/color-scale';
import { DEFAULT_COLOR, MUTED_COLOR } from '../shared/color-scale';
import { smartFormat, truncateLabel } from '../shared/axis-utils';

export interface ParallelCoordsConfig {
  /** Column metadata for dimensions to render */
  dimensions: ColumnMeta[];
  /** All data rows */
  rows: DesignRow[];
  /** Indices of rows passing current brush filters */
  brushedIndices: Set<number>;
  /** Currently highlighted row */
  highlighted: DesignRow | null;
  /** Color scale (optional) */
  colorScale: ColorScale | null;
  /** Callback when brush changes on an axis */
  onBrush: (column: string, extent: [number, number] | null) => void;
  /** Callback when a dimension label is clicked (for color encoding) */
  onDimensionClick: (column: string) => void;
  /** Callback when a row is highlighted by hovering a line */
  onHighlight: (row: DesignRow | null) => void;
}

interface DimensionState {
  column: ColumnMeta;
  scale: ScaleLinear<number, number>;
  flipped: boolean;
}

const MARGIN = { top: 40, right: 20, bottom: 10, left: 20 };
const AXIS_PADDING = 60;

/**
 * Render a parallel coordinates chart into an SVG element.
 * Uses SVG for axes/labels and draws lines directly for interactivity.
 */
export function renderParallelCoords(
  svgElement: SVGSVGElement,
  canvasElement: HTMLCanvasElement,
  config: ParallelCoordsConfig
) {
  const { dimensions, rows, brushedIndices, highlighted, colorScale, onBrush, onDimensionClick, onHighlight } = config;

  if (dimensions.length === 0 || rows.length === 0) return;

  const rect = svgElement.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  // Set canvas size to match
  canvasElement.width = width * window.devicePixelRatio;
  canvasElement.height = height * window.devicePixelRatio;
  canvasElement.style.width = width + 'px';
  canvasElement.style.height = height + 'px';

  const ctx = canvasElement.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

  // X scale: evenly space dimensions
  const xScale = scalePoint<string>()
    .domain(dimensions.map((d) => d.originalName))
    .range([MARGIN.left + AXIS_PADDING, width - MARGIN.right - AXIS_PADDING]);

  // Y scales: one per dimension
  const dimStates: Map<string, DimensionState> = new Map();
  for (const dim of dimensions) {
    if (!dim.isNumeric) continue;
    const scale = scaleLinear()
      .domain([dim.min ?? 0, dim.max ?? 1])
      .range([innerHeight + MARGIN.top, MARGIN.top])
      .nice();

    dimStates.set(dim.originalName, { column: dim, scale, flipped: false });
  }

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw lines on canvas
  const numericDims = dimensions.filter((d) => d.isNumeric);

  // Draw muted lines (non-brushed) first
  ctx.globalAlpha = 0.1;
  ctx.lineWidth = 1;
  for (const row of rows) {
    if (brushedIndices.has(row._index)) continue;
    drawLine(ctx, row, numericDims, xScale, dimStates, MUTED_COLOR);
  }

  // Draw brushed lines
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.5;
  for (const row of rows) {
    if (!brushedIndices.has(row._index)) continue;
    const color = colorScale ? colorScale.getColor(row) : DEFAULT_COLOR;
    drawLine(ctx, row, numericDims, xScale, dimStates, color);
  }

  // Draw highlighted line on top
  if (highlighted && brushedIndices.has(highlighted._index)) {
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    const color = colorScale ? colorScale.getColor(highlighted) : '#ff6b35';
    drawLine(ctx, highlighted, numericDims, xScale, dimStates, color);
  }

  ctx.globalAlpha = 1;

  // SVG: axes, labels, brushes
  const svg = select(svgElement);
  svg.selectAll('*').remove();
  svg.attr('width', width).attr('height', height);

  const g = svg.append('g');

  // Render each axis
  for (const dim of numericDims) {
    const state = dimStates.get(dim.originalName);
    if (!state) continue;

    const x = xScale(dim.originalName) ?? 0;

    const axisGroup = g.append('g').attr('transform', `translate(${x}, 0)`);

    // Axis line and ticks
    axisGroup
      .call(axisLeft(state.scale).ticks(6).tickFormat((d) => smartFormat(d as number)))
      .selectAll('text')
      .attr('class', 'text-xs fill-gray-600');

    // Dimension label (clickable for color encoding)
    axisGroup
      .append('text')
      .attr('y', MARGIN.top - 16)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs font-semibold cursor-pointer select-none')
      .attr('fill', colorScale?.column === dim.originalName ? '#f97316' : '#374151')
      .text(truncateLabel(dim.displayName + (dim.unit ? ` [${dim.unit}]` : '')))
      .on('click', () => onDimensionClick(dim.originalName))
      .append('title')
      .text(dim.displayName + (dim.unit ? ` [${dim.unit}]` : ''));

    // Brush
    const brush = brushY()
      .extent([
        [-12, MARGIN.top],
        [12, innerHeight + MARGIN.top],
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

    axisGroup.append('g').attr('class', 'brush').call(brush);
  }

  // Hover interaction on canvas
  canvasElement.onmousemove = (event: MouseEvent) => {
    const rect = canvasElement.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    let closest: DesignRow | null = null;
    let minDist = 20; // pixel threshold

    for (const row of rows) {
      if (!brushedIndices.has(row._index)) continue;
      let totalDist = 0;
      let validDims = 0;

      for (const dim of numericDims) {
        const state = dimStates.get(dim.originalName);
        if (!state) continue;
        const x = xScale(dim.originalName) ?? 0;
        const val = row[dim.originalName];
        if (typeof val !== 'number') continue;
        const y = state.scale(val);
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

  canvasElement.onmouseleave = () => {
    onHighlight(null);
  };
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
