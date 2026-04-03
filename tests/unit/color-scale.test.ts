import { describe, it, expect } from 'vitest';
import { createColorScale, DEFAULT_COLOR } from '../../src/lib/charts/shared/color-scale';
import type { ColumnMeta, DesignRow } from '../../src/lib/types/data';

describe('createColorScale', () => {
  const numericCol: ColumnMeta = {
    originalName: 'out:energy',
    displayName: 'energy',
    classification: 'output',
    isNumeric: true,
    min: 0,
    max: 100,
  };

  const categoricalCol: ColumnMeta = {
    originalName: 'Description',
    displayName: 'Description',
    classification: 'meta',
    isNumeric: false,
  };

  const rows: DesignRow[] = [
    { _index: 0, 'out:energy': 0, Description: 'A' },
    { _index: 1, 'out:energy': 50, Description: 'B' },
    { _index: 2, 'out:energy': 100, Description: 'A' },
  ];

  it('creates numeric color scale', () => {
    const scale = createColorScale(numericCol, rows);
    expect(scale.isNumeric).toBe(true);
    expect(scale.column).toBe('out:energy');

    const color0 = scale.getColor(rows[0]);
    const color100 = scale.getColor(rows[2]);
    expect(color0).not.toBe(color100);
  });

  it('creates categorical color scale', () => {
    const scale = createColorScale(categoricalCol, rows);
    expect(scale.isNumeric).toBe(false);

    const colorA = scale.getColor(rows[0]);
    const colorB = scale.getColor(rows[1]);
    expect(colorA).not.toBe(colorB);

    // Same category should get same color
    expect(scale.getColor(rows[0])).toBe(scale.getColor(rows[2]));
  });

  it('returns default color for non-numeric values in numeric scale', () => {
    const scale = createColorScale(numericCol, rows);
    const badRow: DesignRow = { _index: 99, 'out:energy': 'N/A' as unknown as number };
    expect(scale.getColor(badRow)).toBe(DEFAULT_COLOR);
  });
});
