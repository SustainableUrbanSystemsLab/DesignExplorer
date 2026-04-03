<script lang="ts">
  import { onMount } from 'svelte';
  import { dataset } from '../../stores/dataset.svelte';
  import { selection } from '../../stores/selection.svelte';
  import { renderScatterMatrix } from './scatter-matrix';
  import { createColorScale } from '../shared/color-scale';
  import type { ColorScale } from '../shared/color-scale';

  let svgEl: SVGSVGElement;
  let containerEl: HTMLDivElement;

  /** Which columns to show in the scatter matrix */
  let selectedDimensions = $state<string[]>([]);

  function getColorScale(): ColorScale | null {
    if (!selection.colorDimension) return null;
    const col = dataset.columns.find(
      (c) => c.originalName === selection.colorDimension
    );
    if (!col) return null;
    return createColorScale(col, dataset.rows);
  }

  function draw() {
    if (!svgEl || !dataset.isLoaded) return;

    const allNumeric = dataset.numericColumns;
    const dims =
      selectedDimensions.length > 0
        ? allNumeric.filter((c) => selectedDimensions.includes(c.originalName))
        : allNumeric.slice(0, 6);

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
  <!-- Dimension selector -->
  {#if dataset.isLoaded}
    <div class="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 overflow-x-auto">
      {#each dataset.numericColumns as col}
        <button
          class="px-2 py-0.5 text-xs rounded-full border transition-colors
            {selectedDimensions.includes(col.originalName) || selectedDimensions.length === 0
              ? 'bg-blue-100 border-blue-300 text-blue-800'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100'}"
          onclick={() => toggleDimension(col.originalName)}
        >
          {col.displayName}
        </button>
      {/each}
    </div>
  {/if}

  <div class="flex-1 relative">
    <svg bind:this={svgEl} class="w-full h-full"></svg>
    {#if !dataset.isLoaded}
      <div class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
        Load a dataset to see scatter matrix
      </div>
    {/if}
  </div>
</div>
