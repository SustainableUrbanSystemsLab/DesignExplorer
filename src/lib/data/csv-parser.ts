import { csvParse } from 'd3';
import type { DesignRow, ColumnMeta } from '../types/data';
import { classifyColumn } from './column-classifier';

/**
 * Parse CSV text into typed DesignRows and column metadata.
 *
 * Handles the Design Explorer CSV format where columns are prefixed:
 * - `in:` for input parameters
 * - `out:` for output metrics
 * - `img` for image paths (can have suffix like `img:perspective`)
 * - `threeD` for 3D model paths
 * - Everything else is metadata (e.g., "Description")
 */
export function parseCSV(csvText: string): { rows: DesignRow[]; columns: ColumnMeta[] } {
  const raw = csvParse(csvText.trim());

  if (!raw.columns || raw.columns.length === 0) {
    throw new Error('CSV has no columns. Check that the file is comma-separated.');
  }

  if (raw.length === 0) {
    throw new Error('CSV has headers but no data rows.');
  }

  // Build column metadata
  const columns: ColumnMeta[] = raw.columns.map((name) => {
    const meta = classifyColumn(name);
    return {
      ...meta,
      isNumeric: false,
      uniqueValues: [],
    };
  });

  // Parse rows and detect numeric columns
  const rows: DesignRow[] = raw.map((rawRow, index) => {
    const row: DesignRow = { _index: index };

    for (const col of columns) {
      const rawValue = rawRow[col.originalName] ?? '';
      const trimmed = rawValue.trim();

      if (col.classification === 'image' || col.classification === 'threeD') {
        // Image and 3D paths are always strings
        row[col.originalName] = trimmed;
      } else {
        // Try to parse as number
        const num = Number(trimmed);
        row[col.originalName] = trimmed !== '' && !isNaN(num) ? num : trimmed;
      }
    }

    return row;
  });

  // Compute column statistics
  for (const col of columns) {
    if (col.classification === 'image' || col.classification === 'threeD') {
      col.isNumeric = false;
      continue;
    }

    const values = rows.map((r) => r[col.originalName]);
    const numericValues = values.filter((v): v is number => typeof v === 'number');

    col.isNumeric = numericValues.length === values.length && numericValues.length > 0;

    if (col.isNumeric) {
      col.min = Math.min(...numericValues);
      col.max = Math.max(...numericValues);
      col.uniqueValues = [...new Set(numericValues)].sort((a, b) => a - b);
    } else {
      const stringValues = values.map((v) => String(v));
      col.uniqueValues = [...new Set(stringValues)].sort();
    }
  }

  return { rows, columns };
}

/**
 * Generate a deterministic row ID from its input parameter values.
 * Used for favorites persistence across sessions.
 */
export function getRowId(row: DesignRow, inputColumns: ColumnMeta[]): string {
  return inputColumns.map((col) => String(row[col.originalName])).join('_');
}
