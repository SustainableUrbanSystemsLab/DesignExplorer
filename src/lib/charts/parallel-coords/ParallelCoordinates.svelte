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

  let svgEl: SVGSVGElement;
  let canvasEl: HTMLCanvasElement;
  let containerEl: HTMLDivElement;

  /**
   * Persistent chart state (axes, scales) — NOT reactive ($state) to avoid
   * triggering effect cascades. Only mutated by setup(), read by redrawLines().
   */
  let pcState: ParallelCoordsState | null = null;

  /** Track container size to detect real resizes vs. canvas-triggered ones */
  let lastContainerWidth = 0;
  let lastContainerHeight = 0;

  function getColorScale(): ColorScale | null {
    if (!selection.colorDimension) return null;
    const col = dataset.columns.find(
      (c) => c.originalName === selection.colorDimension
    );
    if (!col) return null;
    return createColorScale(col, dataset.rows);
  }

  /**
   * Full setup: rebuild SVG axes/brushes.
   */
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
      lastContainerWidth = pcState.width;
      lastContainerHeight = pcState.height;
    }
  }

  /**
   * Canvas-only redraw (preserves SVG brush state).
   */
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
    const observer = new ResizeObserver(() => {
      if (!containerEl) return;
      const w = containerEl.clientWidth;
      const h = containerEl.clientHeight;

      // Only rebuild axes if the container actually resized
      if (w !== lastContainerWidth || h !== lastContainerHeight) {
        lastContainerWidth = w;
        lastContainerHeight = h;
        untrack(() => {
          setup();
          redrawLines();
        });
      }
    });
    observer.observe(containerEl);
    return () => observer.disconnect();
  });

  // Full setup when dataset changes
  $effect(() => {
    // Track dataset identity
    dataset.rows;
    dataset.columns;

    // Run setup and redraw without tracking internal reads
    untrack(() => {
      setup();
      redrawLines();
    });
  });

  // Canvas-only redraw when selection changes
  $effect(() => {
    // Track selection properties
    selection.brushes;
    selection.highlighted;
    selection.colorDimension;

    // Redraw without tracking dataset.rows (already handled by the effect above)
    untrack(() => {
      redrawLines();
      if (svgEl) {
        updateLabelColors(svgEl, selection.colorDimension);
      }
    });
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
