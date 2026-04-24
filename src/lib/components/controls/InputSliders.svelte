<script lang="ts">
  import { dataset } from '../../stores/dataset.svelte';
  import { selection } from '../../stores/selection.svelte';

  /**
   * For each input dimension, find the closest design to the current slider values.
   */
  function findClosestDesign(
    targetValues: Record<string, number>,
  ): import('../../types/data').DesignRow | null {
    const inputCols = dataset.inputColumns.filter((c) => c.isNumeric);
    if (inputCols.length === 0) return null;

    let bestRow: import('../../types/data').DesignRow | null = null;
    let bestDist = Infinity;

    for (const row of dataset.rows) {
      let dist = 0;
      for (const col of inputCols) {
        const target = targetValues[col.originalName];
        const value = row[col.originalName];
        if (typeof value !== 'number' || target === undefined) continue;

        // Normalize by range to make distances comparable
        const range = (col.max ?? 1) - (col.min ?? 0) || 1;
        const d = (value - target) / range;
        dist += d * d;
      }
      if (dist < bestDist) {
        bestDist = dist;
        bestRow = row;
      }
    }
    return bestRow;
  }

  function handleSliderChange(colName: string, value: number) {
    const currentValues: Record<string, number> = {};
    for (const col of dataset.inputColumns) {
      if (!col.isNumeric) continue;
      if (col.originalName === colName) {
        currentValues[col.originalName] = value;
      } else if (selection.highlighted) {
        const v = selection.highlighted[col.originalName];
        currentValues[col.originalName] = typeof v === 'number' ? v : (col.min ?? 0);
      } else {
        currentValues[col.originalName] = col.min ?? 0;
      }
    }
    const closest = findClosestDesign(currentValues);
    if (closest) selection.highlight(closest);
  }
</script>

{#if dataset.inputColumns.length > 0}
  <div class="space-y-3 p-3">
    <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Input Parameters</h3>

    {#each dataset.inputColumns.filter((c) => c.isNumeric) as col}
      {@const value = selection.highlighted
        ? (selection.highlighted[col.originalName] as number)
        : (col.min ?? 0)}
      {@const step =
        col.uniqueValues && col.uniqueValues.length > 1
          ? Math.abs(Number(col.uniqueValues[1]) - Number(col.uniqueValues[0]))
          : ((col.max ?? 1) - (col.min ?? 0)) / 20}
      {@const sliderId = `slider-${col.originalName}`}

      <div>
        <div class="flex items-center justify-between mb-1">
          <label for={sliderId} class="text-xs font-medium text-gray-700">
            {col.displayName}
            {#if col.unit}
              <span class="text-gray-400 font-normal">[{col.unit}]</span>
            {/if}
          </label>
          <span class="text-xs font-mono text-blue-600">
            {typeof value === 'number' ? value.toFixed(2) : value}
          </span>
        </div>
        <input
          id={sliderId}
          type="range"
          min={col.min ?? 0}
          max={col.max ?? 1}
          {step}
          value={typeof value === 'number' ? value : (col.min ?? 0)}
          oninput={(e) =>
            handleSliderChange(col.originalName, Number((e.target as HTMLInputElement).value))}
          class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer
            accent-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        />
        <div class="flex justify-between text-[10px] text-gray-400 mt-0.5">
          <span>{col.min?.toFixed(1)}</span>
          <span>{col.max?.toFixed(1)}</span>
        </div>
      </div>
    {/each}
  </div>
{/if}
