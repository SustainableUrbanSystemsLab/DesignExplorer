/** Classification of a CSV column based on its prefix */
export type ColumnClassification = 'input' | 'output' | 'image' | 'threeD' | 'meta';

/** Metadata about a single column in the dataset */
export interface ColumnMeta {
  /** Original column header from CSV */
  originalName: string;
  /** Display name (prefix stripped) */
  displayName: string;
  /** Column classification based on prefix */
  classification: ColumnClassification;
  /** Whether values are numeric */
  isNumeric: boolean;
  /** Min value (for numeric columns) */
  min?: number;
  /** Max value (for numeric columns) */
  max?: number;
  /** Unit string extracted from header, e.g. "kWh" from "out:Cooling[kWh]" */
  unit?: string;
  /** Unique sorted values (for categorical columns or slider ticks) */
  uniqueValues?: (string | number)[];
}

/** A single design row parsed from CSV */
export interface DesignRow {
  /** Auto-generated unique index */
  _index: number;
  /** All original values keyed by original column name */
  [key: string]: string | number;
}

/** Information about the data source */
export interface DataSource {
  type: 'file' | 'url';
  /** Original filename or URL */
  name: string;
  /** Base URL for resolving relative image/3D paths */
  baseUrl?: string;
}

/** Filter state for a single parallel coordinates axis */
export interface BrushExtent {
  column: string;
  /** [min, max] range of the brush */
  extent: [number, number];
}

/** Complete dataset state */
export interface DatasetState {
  rows: DesignRow[];
  columns: ColumnMeta[];
  source: DataSource | null;
}

/** Supported 3D model formats */
export type ModelFormat = 'gltf' | 'glb' | 'stl' | 'obj';

/** Detect model format from filename */
export function detectModelFormat(filename: string): ModelFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'gltf':
      return 'gltf';
    case 'glb':
      return 'glb';
    case 'stl':
      return 'stl';
    case 'obj':
      return 'obj';
    default:
      return null;
  }
}
