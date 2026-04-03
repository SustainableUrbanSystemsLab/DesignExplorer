<script lang="ts">
  import { dataset } from '../../stores/dataset.svelte';
  import { selection } from '../../stores/selection.svelte';
  import { createColorScale } from '../../charts/shared/color-scale';

  let colorScale = $derived.by(() => {
    if (!selection.colorDimension) return null;
    const col = dataset.columns.find(
      (c) => c.originalName === selection.colorDimension
    );
    if (!col) return null;
    return createColorScale(col, dataset.rows);
  });

  let gradientStops = $derived.by(() => {
    if (!colorScale || !colorScale.isNumeric) return [];
    const [min, max] = colorScale.domain as [number, number];
    const stops: { offset: string; color: string }[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const val = min + t * (max - min);
      const mockRow = { _index: 0, [colorScale.column]: val } as import('../../types/data').DesignRow;
      stops.push({
        offset: `${t * 100}%`,
        color: colorScale.getColor(mockRow),
      });
    }
    return stops;
  });
</script>

{#if colorScale}
  <div class="p-3">
    <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
      Color: {dataset.columns.find((c) => c.originalName === colorScale!.column)?.displayName ?? ''}
    </h3>

    {#if colorScale.isNumeric}
      <!-- Continuous gradient legend -->
      {@const [min, max] = colorScale.domain as [number, number]}
      <div class="h-3 rounded-full overflow-hidden"
        style="background: linear-gradient(to right, {gradientStops.map(s => s.color).join(', ')})">
      </div>
      <div class="flex justify-between text-[10px] text-gray-500 mt-0.5">
        <span>{min.toFixed(1)}</span>
        <span>{max.toFixed(1)}</span>
      </div>
    {:else}
      <!-- Categorical legend -->
      <div class="space-y-1 max-h-32 overflow-y-auto">
        {#each colorScale.domain as string[] as value}
          {@const mockRow = { _index: 0, [colorScale!.column]: value } as import('../../types/data').DesignRow}
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 rounded-full flex-shrink-0"
              style="background: {colorScale!.getColor(mockRow)}"
            ></div>
            <span class="text-xs text-gray-600 truncate">{value}</span>
          </div>
        {/each}
      </div>
    {/if}

    <button
      class="mt-2 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
      onclick={() => selection.setColorDimension('')}
    >
      Clear color encoding
    </button>
  </div>
{:else if dataset.isLoaded}
  <div class="p-3">
    <p class="text-xs text-gray-400">
      Click a dimension label in the parallel coordinates to color by that dimension.
    </p>
  </div>
{/if}
