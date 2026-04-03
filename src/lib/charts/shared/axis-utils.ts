import { format } from 'd3';

/**
 * Smart number formatter that picks an appropriate precision.
 */
export function smartFormat(value: number): string {
  const abs = Math.abs(value);
  if (abs === 0) return '0';
  if (abs >= 1_000_000) return format('.2s')(value);
  if (abs >= 1000) return format(',.0f')(value);
  if (abs >= 1) return format('.2f')(value);
  if (abs >= 0.01) return format('.3f')(value);
  return format('.2e')(value);
}

/**
 * Truncate a label to a maximum number of characters.
 */
export function truncateLabel(label: string, maxLen: number = 20): string {
  return label.length > maxLen ? label.slice(0, maxLen - 1) + '\u2026' : label;
}
