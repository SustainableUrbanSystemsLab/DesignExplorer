import type { ColumnClassification, ColumnMeta } from '../types/data';

/**
 * Extract unit from column name, e.g. "out:Cooling[kWh]" → "kWh"
 */
function extractUnit(name: string): string | undefined {
  const match = name.match(/\[([^\]]+)\]/);
  return match ? match[1] : undefined;
}

/**
 * Extract display name by stripping prefix and unit.
 * e.g. "in:Depth [ft]" → "Depth"
 * e.g. "out:Cooling[kWh]" → "Cooling"
 */
function extractDisplayName(name: string, prefix: string): string {
  let display = name;

  // Remove prefix
  if (prefix) {
    display = display.replace(new RegExp(`^${prefix}:?`, 'i'), '');
  }

  // Remove unit in brackets
  display = display.replace(/\s*\[[^\]]*\]/, '');

  return display.trim();
}

/**
 * Classify a column by its header prefix.
 *
 * Convention from Design Explorer CSV format:
 * - `in:` → input parameter
 * - `out:` → output metric
 * - `img` (with optional `:suffix`) → image path
 * - `threeD` (with optional `:suffix`) → 3D model path
 * - anything else → meta (e.g. "Description")
 */
export function classifyColumn(
  originalName: string
): Pick<ColumnMeta, 'originalName' | 'displayName' | 'classification' | 'unit'> {
  const trimmed = originalName.trim();
  const lower = trimmed.toLowerCase();

  let classification: ColumnClassification;
  let displayName: string;
  let unit: string | undefined;

  if (lower.startsWith('in:')) {
    classification = 'input';
    unit = extractUnit(trimmed);
    displayName = extractDisplayName(trimmed, 'in');
  } else if (lower.startsWith('out:')) {
    classification = 'output';
    unit = extractUnit(trimmed);
    displayName = extractDisplayName(trimmed, 'out');
  } else if (lower === 'img' || lower.startsWith('img:')) {
    classification = 'image';
    displayName = lower === 'img' ? 'Image' : trimmed.substring(4);
  } else if (lower === 'threed' || lower.startsWith('threed:')) {
    classification = 'threeD';
    displayName = lower === 'threed' ? '3D Model' : trimmed.substring(7);
  } else {
    classification = 'meta';
    unit = extractUnit(trimmed);
    displayName = trimmed.replace(/\s*\[[^\]]*\]/, '').trim();
  }

  return { originalName: trimmed, displayName, classification, unit };
}
