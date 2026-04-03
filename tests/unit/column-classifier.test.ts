import { describe, it, expect } from 'vitest';
import { classifyColumn } from '../../src/lib/data/column-classifier';

describe('classifyColumn', () => {
  it('classifies input columns', () => {
    const result = classifyColumn('in:Depth [ft]');
    expect(result.classification).toBe('input');
    expect(result.displayName).toBe('Depth');
    expect(result.unit).toBe('ft');
  });

  it('classifies output columns', () => {
    const result = classifyColumn('out:Cooling[kWh]');
    expect(result.classification).toBe('output');
    expect(result.displayName).toBe('Cooling');
    expect(result.unit).toBe('kWh');
  });

  it('classifies image columns', () => {
    expect(classifyColumn('img').classification).toBe('image');
    expect(classifyColumn('img:perspective').classification).toBe('image');
  });

  it('classifies threeD columns', () => {
    expect(classifyColumn('threeD').classification).toBe('threeD');
    expect(classifyColumn('threeD:model').classification).toBe('threeD');
  });

  it('classifies meta columns', () => {
    expect(classifyColumn('Description').classification).toBe('meta');
    expect(classifyColumn('Name').classification).toBe('meta');
  });

  it('is case-insensitive for prefixes', () => {
    expect(classifyColumn('IN:width').classification).toBe('input');
    expect(classifyColumn('OUT:energy').classification).toBe('output');
    expect(classifyColumn('IMG').classification).toBe('image');
    expect(classifyColumn('ThreeD').classification).toBe('threeD');
  });

  it('extracts units from brackets', () => {
    expect(classifyColumn('in:Height [m]').unit).toBe('m');
    expect(classifyColumn('out:DA [%]').unit).toBe('%');
    expect(classifyColumn('in:width').unit).toBeUndefined();
  });

  it('strips units from display names', () => {
    const result = classifyColumn('out:Cooling[kWh]');
    expect(result.displayName).toBe('Cooling');
  });
});
