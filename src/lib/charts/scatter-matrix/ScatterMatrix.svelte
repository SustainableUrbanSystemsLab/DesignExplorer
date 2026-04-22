<script lang="ts">
  import { onMount } from 'svelte';
  import { dataset } from '../../stores/dataset.svelte';
  import { selection } from '../../stores/selection.svelte';
  import { renderScatterMatrix } from './scatter-matrix';
  import { createColorScale } from '../shared/color-scale';
  import type { ColorScale } from '../shared/color-scale';

  let svgEl: SVGSVGElement;
  let containerEl: HTMLDivElement;

  /** Which columns to show in the scatter matrix (originalName keys) */
  let selectedDimensions = $state<string[]>([]);

  /**
   * Default selection: prefer output columns; if none, use first 5 numeric.
   * Capped at 5 to keep cells readable.
   */
  const MAX_DEFAULT = 5;

  $effect(() => {
    // Only auto-select on first dataset load (when nothing is selected yet)
    if (selectedDimensions.length > 0) return;
    const outputs = dataset.outputColumns.filter((c) => c.isNumeric);
    const candidates = outputs.length >= 2 ? outputs : dataset.numericColumns;
    selectedDimensions = candidates.slice(0, MAX_DEFAULT).map((c) => c.originalName);
  });

  function getColorScale(): ColorScale | null {
    if (!selection.colorDimension) return null;
    const col = dataset.columns.find((c) => c.originalName === selection.colorDimension);
    if (!col) return null;
    return createColorScale(col, dataset.rows);
  }

  function draw() {
    if (!svgEl || !dataset.isLoaded) return;

    const allNumeric = dataset.numericColumns;
    const dims =
      selectedDimensions.length > 0
        ? allNumeric.filter((c) => selectedDimensions.includes(c.originalName))
        : allNumeric.slice(0, MAX_DEFAULT);

    renderScatterMatrix(svgEl, {
      dimensions: dims,
      rows: dataset.rows,
      brushedIndices: selection.brushedIndices,
      highlighted: selection.highlighted,
      colorScale: getColorScale(),
      onHighlight: (row) => selection.highlight(row),
    });
  }

  onMount(() => {
    const observer = new ResizeObserver(() => draw());
    observer.observe(containerEl);
    return () => observer.disconnect();
  });

  $effect(() => {
    dataset.rows;
    dataset.columns;
    selection.brushedIndices;
    selection.highlighted;
    selection.colorDimension;
    selectedDimensions;
    draw();
  });

  function toggleDimension(colName: string) {
    if (selectedDimensions.includes(colName)) {
      selectedDimensions = selectedDimensions.filter((d) => d !== colName);
    } else {
      selectedDimensions = [...selectedDimensions, colName];
    }
  }
</script>

<div bind:this={containerEl} class="flex flex-col w-full h-full min-h-[200px]">
  <!-- Dimension selector — fixed max height with scroll to not crush the chart -->
  {#if dataset.isLoaded}
    <div
      class="flex-shrink-0 max-h-[56px] overflow-y-auto border-b border-gray-200 bg-gray-50 px-2 py-1.5"
    >
      <div class="flex flex-wrap gap-1">
        {#each dataset.numericColumns as col}
          <button
            class="px-2 py-0.5 text-xs rounded-full border transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              {selectedDimensions.includes(col.originalName)
              ? 'bg-blue-100 border-blue-300 text-blue-800'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100'}"
            onclick={() => toggleDimension(col.originalName)}
            aria-pressed={selectedDimensions.includes(col.originalName)}
          >
            {col.displayName}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <div class="flex-1 relative min-h-0">
    <svg bind:this={svgEl} class="w-full h-full"></svg>
    {#if !dataset.isLoaded}
      <div class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
        Load a dataset to see scatter matrix
      </div>
    {/if}
  </div>
</div>
