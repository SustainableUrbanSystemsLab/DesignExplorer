import { describe, it, expect } from 'vitest';
import { parseCSV, getRowId } from '../../src/lib/data/csv-parser';

const SAMPLE_CSV = `Description,in:width,in:length,in:height,out:surfaceArea,out:volume,img,threeD
1_1_1,1,1,1,24,8,img1.png,model1.glb
2_1_1,2,1,1,40,16,img2.png,model2.glb
3_3_3,3,3,3,120,108,img3.png,model3.glb`;

describe('parseCSV', () => {
  it('parses CSV text into rows and columns', () => {
    const { rows, columns } = parseCSV(SAMPLE_CSV);
    expect(rows).toHaveLength(3);
    expect(columns).toHaveLength(8);
  });

  it('classifies columns correctly', () => {
    const { columns } = parseCSV(SAMPLE_CSV);
    const byClass = (c: string) => columns.filter((col) => col.classification === c);

    expect(byClass('input')).toHaveLength(3);
    expect(byClass('output')).toHaveLength(2);
    expect(byClass('image')).toHaveLength(1);
    expect(byClass('threeD')).toHaveLength(1);
    expect(byClass('meta')).toHaveLength(1);
  });

  it('parses numeric values', () => {
    const { rows } = parseCSV(SAMPLE_CSV);
    expect(rows[0]['in:width']).toBe(1);
    expect(rows[2]['out:volume']).toBe(108);
    expect(typeof rows[0]['in:width']).toBe('number');
  });

  it('keeps image/3D paths as strings', () => {
    const { rows } = parseCSV(SAMPLE_CSV);
    expect(rows[0]['img']).toBe('img1.png');
    expect(rows[0]['threeD']).toBe('model1.glb');
    expect(typeof rows[0]['img']).toBe('string');
  });

  it('computes column statistics', () => {
    const { columns } = parseCSV(SAMPLE_CSV);
    const widthCol = columns.find((c) => c.originalName === 'in:width')!;
    expect(widthCol.isNumeric).toBe(true);
    expect(widthCol.min).toBe(1);
    expect(widthCol.max).toBe(3);
  });

  it('extracts display names', () => {
    const { columns } = parseCSV(SAMPLE_CSV);
    const widthCol = columns.find((c) => c.originalName === 'in:width')!;
    expect(widthCol.displayName).toBe('width');
  });

  it('throws on empty CSV', () => {
    expect(() => parseCSV('')).toThrow();
  });

  it('throws on headers-only CSV', () => {
    expect(() => parseCSV('a,b,c\n')).toThrow();
  });
});

describe('getRowId', () => {
  it('generates deterministic row IDs from input columns', () => {
    const { rows, columns } = parseCSV(SAMPLE_CSV);
    const inputCols = columns.filter((c) => c.classification === 'input');
    const id = getRowId(rows[0], inputCols);
    expect(id).toBe('1_1_1');
  });
});
