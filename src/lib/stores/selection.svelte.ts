import type { DesignRow, BrushExtent } from '../types/data';
import { dataset } from './dataset.svelte';

/**
 * Selection store — manages brush filtering, highlighting, and color encoding.
 */
class SelectionStore {
  /** Active brush filters on parallel coordinate axes */
  brushes = $state<BrushExtent[]>([]);

  /** Currently highlighted (hovered/clicked) design */
  highlighted = $state<DesignRow | null>(null);

  /** Column name used for color encoding */
  colorDimension = $state<string>('');

  /** Whether to show only favorites */
  showOnlyFavorites = $state<boolean>(false);

  /**
   * Indices of rows that pass all active brush filters.
   */
  get brushedIndices(): Set<number> {
    if (this.brushes.length === 0) {
      return new Set(dataset.rows.map((r) => r._index));
    }

    const indices = new Set<number>();
    for (const row of dataset.rows) {
      let passes = true;
      for (const brush of this.brushes) {
        const value = row[brush.column];
        if (typeof value !== 'number') {
          passes = false;
          break;
        }
        if (value < brush.extent[0] || value > brush.extent[1]) {
          passes = false;
          break;
        }
      }
      if (passes) {
        indices.add(row._index);
      }
    }
    return indices;
  }

  /**
   * Rows that pass all filters (brush + favorites if active).
   */
  get filteredRows(): DesignRow[] {
    const brushed = this.brushedIndices;
    return dataset.rows.filter((r) => brushed.has(r._index));
  }

  /**
   * Number of designs passing current filters.
   */
  get filteredCount(): number {
    return this.filteredRows.length;
  }

  /**
   * Set or update a brush on a dimension.
   */
  setBrush(column: string, extent: [number, number] | null) {
    // Remove existing brush for this column
    this.brushes = this.brushes.filter((b) => b.column !== column);

    // Add new brush if extent is provided
    if (extent) {
      this.brushes = [...this.brushes, { column, extent }];
    }
  }

  /**
   * Clear all brushes.
   */
  clearBrushes() {
    this.brushes = [];
  }

  /**
   * Highlight a specific design.
   */
  highlight(row: DesignRow | null) {
    this.highlighted = row;
  }

  /**
   * Set which dimension drives color encoding.
   */
  setColorDimension(column: string) {
    this.colorDimension = column;
  }
}

export const selection = new SelectionStore();
