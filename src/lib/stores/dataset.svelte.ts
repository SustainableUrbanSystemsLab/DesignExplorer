import { parseCSV, getRowId } from '../data/csv-parser';
import { resolveUrl } from '../data/url-loader';
import type { DesignRow, ColumnMeta, DataSource } from '../types/data';

/**
 * Central dataset store — the single source of truth for loaded design data.
 */
class DatasetStore {
  rows = $state<DesignRow[]>([]);
  allRows = $state<DesignRow[]>([]);
  columns = $state<ColumnMeta[]>([]);
  source = $state<DataSource | null>(null);

  /** Map of filename → blob URL for ZIP-extracted assets */
  private _assets = $state<Map<string, string>>(new Map());

  get isLoaded(): boolean {
    return this.rows.length > 0;
  }

  get inputColumns(): ColumnMeta[] {
    return this.columns.filter((c) => c.classification === 'input');
  }

  get outputColumns(): ColumnMeta[] {
    return this.columns.filter((c) => c.classification === 'output');
  }

  get numericColumns(): ColumnMeta[] {
    return this.columns.filter((c) => c.isNumeric);
  }

  get imageColumns(): ColumnMeta[] {
    return this.columns.filter((c) => c.classification === 'image');
  }

  get threeDColumns(): ColumnMeta[] {
    return this.columns.filter((c) => c.classification === 'threeD');
  }

  get metaColumns(): ColumnMeta[] {
    return this.columns.filter((c) => c.classification === 'meta');
  }

  /** Hash of column headers — used to scope favorites per dataset */
  get studyId(): string {
    return this.columns.map((c) => c.originalName).join(',');
  }

  /**
   * Load CSV text into the store.
   */
  load(csvText: string, source: DataSource, assets?: Map<string, string>) {
    const { rows, columns } = parseCSV(csvText);
    this.rows = rows;
    this.allRows = [...rows];
    this.columns = columns;
    this.source = source;
    this._assets = assets ?? new Map();
  }

  /**
   * Resolve an image or 3D model path to a usable URL.
   * Checks ZIP assets first, then tries URL resolution.
   */
  resolveAssetUrl(path: string): string {
    if (!path) return '';

    // Check ZIP assets first
    const blobUrl = this._assets.get(path) || this._assets.get(path.split('/').pop() || '');
    if (blobUrl) return blobUrl;

    // Resolve against base URL
    return resolveUrl(path, this.source?.baseUrl);
  }

  /**
   * Get a deterministic ID for a row (based on input parameter values).
   */
  getRowId(row: DesignRow): string {
    return getRowId(row, this.inputColumns);
  }

  /**
   * Zoom to a subset of rows (hide everything else).
   */
  zoomToRows(indices: Set<number>) {
    this.rows = this.allRows.filter((r) => indices.has(r._index));
  }

  /**
   * Exclude rows from view.
   */
  excludeRows(indices: Set<number>) {
    this.rows = this.rows.filter((r) => !indices.has(r._index));
  }

  /**
   * Reset to show all rows.
   */
  reset() {
    this.rows = [...this.allRows];
  }

  /**
   * Clear all data.
   */
  clear() {
    // Revoke any blob URLs
    for (const url of this._assets.values()) {
      URL.revokeObjectURL(url);
    }
    this.rows = [];
    this.allRows = [];
    this.columns = [];
    this.source = null;
    this._assets = new Map();
  }
}

export const dataset = new DatasetStore();
