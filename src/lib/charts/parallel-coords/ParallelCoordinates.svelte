<script lang="ts">
  import { onMount } from 'svelte';
  import { dataset } from '../../stores/dataset.svelte';
  import { selection } from '../../stores/selection.svelte';
  import { renderParallelCoords } from './parallel-coords';
  import { createColorScale } from '../shared/color-scale';
  import type { ColorScale } from '../shared/color-scale';

  let svgEl: SVGSVGElement;
  let canvasEl: HTMLCanvasElement;
  let containerEl: HTMLDivElement;

  function getColorScale(): ColorScale | null {
    if (!selection.colorDimension) return null;
    const col = dataset.columns.find(
      (c) => c.originalName === selection.colorDimension
    );
    if (!col) return null;
    return createColorScale(col, dataset.rows);
  }

  function draw() {
    if (!svgEl || !canvasEl || !dataset.isLoaded) return;

    const dimensions = dataset.numericColumns;
    renderParallelCoords(svgEl, canvasEl, {
      dimensions,
      rows: dataset.rows,
      brushedIndices: selection.brushedIndices,
      highlighted: selection.highlighted,
      colorScale: getColorScale(),
      onBrush: (column, extent) => selection.setBrush(column, extent),
      onDimensionClick: (column) => selection.setColorDimension(column),
      onHighlight: (row) => selection.highlight(row),
    });
  }

  onMount(() => {
    const observer = new ResizeObserver(() => draw());
    observer.observe(containerEl);
    return () => observer.disconnect();
  });

  // Reactively redraw when data or selection changes
  $effect(() => {
    // Touch reactive dependencies
    dataset.rows;
    dataset.columns;
    selection.brushedIndices;
    selection.highlighted;
    selection.colorDimension;

    draw();
  });
</script>

<div bind:this={containerEl} class="relative w-full h-full min-h-[200px]">
  <canvas
    bind:this={canvasEl}
    class="absolute inset-0 w-full h-full"
  ></canvas>
  <svg
    bind:this={svgEl}
    class="absolute inset-0 w-full h-full"
  ></svg>
  {#if !dataset.isLoaded}
    <div class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
      Load a dataset to see parallel coordinates
    </div>
  {/if}
</div>
