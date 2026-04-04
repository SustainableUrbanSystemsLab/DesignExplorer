<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { dataset } from '../../stores/dataset.svelte';
  import { selection } from '../../stores/selection.svelte';
  import {
    setupParallelCoords,
    drawLines,
    updateLabelColors,
    type ParallelCoordsState,
  } from './parallel-coords';
  import { createColorScale } from '../shared/color-scale';
  import type { ColorScale } from '../shared/color-scale';

  /** Outer scrollable container */
  let outerEl: HTMLDivElement;
  /** Inner chart div — sized to at least minChartWidth */
  let innerEl: HTMLDivElement;
  let svgEl: SVGSVGElement;
  let canvasEl: HTMLCanvasElement;

  /**
   * Persistent chart state — NOT $state to avoid reactive cascades.
   */
  let pcState: ParallelCoordsState | null = null;

  /** Track rendered SVG size to guard against spurious ResizeObserver fires */
  let lastSvgWidth = 0;
  let lastSvgHeight = 0;

  /** Minimum pixels per axis — drives horizontal scroll when needed */
  const MIN_AXIS_PX = 110;

  /** Reactive minimum chart width based on number of axes */
  let minChartWidth = $derived(
    Math.max(MIN_AXIS_PX * 2, dataset.numericColumns.length * MIN_AXIS_PX)
  );

  function getColorScale(): ColorScale | null {
    if (!selection.colorDimension) return null;
    const col = dataset.columns.find(
      (c) => c.originalName === selection.colorDimension
    );
    if (!col) return null;
    return createColorScale(col, dataset.rows);
  }

  function setup() {
    if (!svgEl || !canvasEl || !dataset.isLoaded) return;

    pcState = setupParallelCoords(svgEl, canvasEl, {
      dimensions: dataset.numericColumns,
      rows: dataset.rows,
      onBrush: (column, extent) => selection.setBrush(column, extent),
      onDimensionClick: (column) => selection.setColorDimension(column),
      onHighlight: (row) => selection.highlight(row),
    });

    if (pcState) {
      lastSvgWidth = pcState.width;
      lastSvgHeight = pcState.height;
    }
  }

  function redrawLines() {
    if (!canvasEl || !pcState) return;
    drawLines(canvasEl, pcState, {
      rows: dataset.rows,
      brushedIndices: selection.brushedIndices,
      highlighted: selection.highlighted,
      colorScale: getColorScale(),
    });
  }

  onMount(() => {
    // Watch outer container; rebuild when the SVG's actual rendered size changes
    const observer = new ResizeObserver(() => {
      if (!svgEl) return;
      const w = svgEl.clientWidth;
      const h = svgEl.clientHeight;
      if (w !== lastSvgWidth || h !== lastSvgHeight) {
        lastSvgWidth = w;
        lastSvgHeight = h;
        untrack(() => {
          setup();
          redrawLines();
        });
      }
    });
    observer.observe(outerEl);
    return () => observer.disconnect();
  });

  // Full setup when dataset changes (also fires on first load)
  $effect(() => {
    dataset.rows;
    dataset.columns;
    untrack(() => {
      setup();
      redrawLines();
    });
  });

  // Canvas-only redraw when selection changes
  $effect(() => {
    selection.brushes;
    selection.highlighted;
    selection.colorDimension;
    untrack(() => {
      redrawLines();
      if (svgEl) updateLabelColors(svgEl, selection.colorDimension);
    });
  });
</script>

<!-- Outer: scrollable horizontally, fills its grid cell -->
<div bind:this={outerEl} class="w-full h-full overflow-x-auto min-h-[200px]">
  <!-- Inner: expands to minChartWidth, canvas+svg overlay -->
  <div
    bind:this={innerEl}
    class="relative h-full"
    style="min-width: {minChartWidth}px; width: 100%;"
  >
    <canvas bind:this={canvasEl} class="absolute inset-0 w-full h-full"></canvas>
    <svg bind:this={svgEl} class="absolute inset-0 w-full h-full"></svg>
    {#if !dataset.isLoaded}
      <div class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
        Load a dataset to see parallel coordinates
      </div>
    {/if}
  </div>
</div>
