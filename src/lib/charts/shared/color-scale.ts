import { scaleSequential, scaleOrdinal } from 'd3';
import { interpolateViridis, schemeTableau10 } from 'd3';
import type { DesignRow, ColumnMeta } from '../../types/data';

export interface ColorScale {
  /** Get color for a row */
  getColor(row: DesignRow): string;
  /** The column this scale is based on */
  column: string;
  /** Whether the scale is numeric (continuous) or categorical */
  isNumeric: boolean;
  /** Domain for legend rendering */
  domain: [number, number] | string[];
}

/**
 * Default color when no dimension is selected for coloring.
 */
export const DEFAULT_COLOR = '#4a90d9';

/**
 * Muted color for rows that are outside the brush filter.
 */
export const MUTED_COLOR = 'rgba(200, 200, 200, 0.15)';

/**
 * Create a color scale for a given column.
 */
export function createColorScale(
  column: ColumnMeta,
  rows: DesignRow[]
): ColorScale {
  if (column.isNumeric) {
    const scale = scaleSequential(interpolateViridis).domain([
      column.min ?? 0,
      column.max ?? 1,
    ]);

    return {
      getColor(row: DesignRow): string {
        const val = row[column.originalName];
        if (typeof val !== 'number') return DEFAULT_COLOR;
        return scale(val);
      },
      column: column.originalName,
      isNumeric: true,
      domain: [column.min ?? 0, column.max ?? 1],
    };
  }

  // Categorical scale
  const uniqueValues = [...new Set(rows.map((r) => String(r[column.originalName])))];
  const scale = scaleOrdinal(schemeTableau10).domain(uniqueValues);

  return {
    getColor(row: DesignRow): string {
      return scale(String(row[column.originalName]));
    },
    column: column.originalName,
    isNumeric: false,
    domain: uniqueValues,
  };
}
