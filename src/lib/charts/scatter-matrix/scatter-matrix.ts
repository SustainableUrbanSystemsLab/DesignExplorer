import {
  select,
  scaleLinear,
  type ScaleLinear,
  axisBottom,
  axisLeft,
} from 'd3';
import type { DesignRow, ColumnMeta } from '../../types/data';
import type { ColorScale } from '../shared/color-scale';
import { DEFAULT_COLOR, MUTED_COLOR } from '../shared/color-scale';
import { smartFormat } from '../shared/axis-utils';

export interface ScatterMatrixConfig {
  dimensions: ColumnMeta[];
  rows: DesignRow[];
  brushedIndices: Set<number>;
  highlighted: DesignRow | null;
  colorScale: ColorScale | null;
  onHighlight: (row: DesignRow | null) => void;
  /** Maximum dimensions to show (to avoid huge matrices) */
  maxDimensions?: number;
}

const CELL_PADDING = 4;

/**
 * Render a scatter plot matrix into an SVG element.
 */
export function renderScatterMatrix(
  svgElement: SVGSVGElement,
  config: ScatterMatrixConfig
) {
  const {
    dimensions,
    rows,
    brushedIndices,
    highlighted,
    colorScale,
    onHighlight,
    maxDimensions = 6,
  } = config;

  const dims = dimensions.slice(0, maxDimensions);
  if (dims.length < 2 || rows.length === 0) return;

  const svg = select(svgElement);
  svg.selectAll('*').remove();

  const rect = svgElement.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const n = dims.length;
  const margin = 30;
  const cellSize = Math.min(
    (width - margin * 2) / n,
    (height - margin * 2) / n
  );

  svg.attr('width', width).attr('height', height);

  // Create scales for each dimension
  const scales = new Map<string, ScaleLinear<number, number>>();
  for (const dim of dims) {
    scales.set(
      dim.originalName,
      scaleLinear<number, number>()
        .domain([dim.min ?? 0, dim.max ?? 1])
        .range([CELL_PADDING, cellSize - CELL_PADDING])
        .nice()
    );
  }

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin}, ${margin})`);

  // Draw cells
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const dimX = dims[j];
      const dimY = dims[i];
      const scaleX = scales.get(dimX.originalName)!;
      const scaleY = scales.get(dimY.originalName)!;

      const cellG = g
        .append('g')
        .attr('transform', `translate(${j * cellSize}, ${i * cellSize})`);

      // Cell background
      cellG
        .append('rect')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', '#fafafa')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 0.5);

      if (i === j) {
        // Diagonal: show dimension label
        cellG
          .append('text')
          .attr('x', cellSize / 2)
          .attr('y', cellSize / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('class', 'text-[10px] font-medium fill-gray-700')
          .text(dimX.displayName);
        continue;
      }

      // Scatter dots — muted first, then brushed
      const brushedRows: DesignRow[] = [];
      for (const row of rows) {
        const vx = row[dimX.originalName];
        const vy = row[dimY.originalName];
        if (typeof vx !== 'number' || typeof vy !== 'number') continue;

        if (!brushedIndices.has(row._index)) {
          cellG
            .append('circle')
            .attr('cx', scaleX(vx))
            .attr('cy', cellSize - scaleY(vy))
            .attr('r', 2)
            .attr('fill', MUTED_COLOR)
            .attr('stroke', 'none');
        } else {
          brushedRows.push(row);
        }
      }

      // Brushed dots on top
      for (const row of brushedRows) {
        const vx = row[dimX.originalName] as number;
        const vy = row[dimY.originalName] as number;
        const color = colorScale ? colorScale.getColor(row) : DEFAULT_COLOR;
        const isHighlighted = highlighted && row._index === highlighted._index;

        cellG
          .append('circle')
          .attr('cx', scaleX(vx))
          .attr('cy', cellSize - scaleY(vy))
          .attr('r', isHighlighted ? 5 : 2.5)
          .attr('fill', color)
          .attr('fill-opacity', isHighlighted ? 1 : 0.7)
          .attr('stroke', isHighlighted ? '#000' : 'none')
          .attr('stroke-width', isHighlighted ? 1.5 : 0)
          .attr('cursor', 'pointer')
          .on('mouseenter', () => onHighlight(row))
          .on('mouseleave', () => onHighlight(null));
      }
    }
  }

  // Axis labels on edges
  for (let i = 0; i < n; i++) {
    // Bottom labels
    g.append('text')
      .attr('x', i * cellSize + cellSize / 2)
      .attr('y', n * cellSize + 16)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[9px] fill-gray-500')
      .text(dims[i].displayName);

    // Left labels
    g.append('text')
      .attr('x', -8)
      .attr('y', i * cellSize + cellSize / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('class', 'text-[9px] fill-gray-500')
      .text(dims[i].displayName);
  }
}
