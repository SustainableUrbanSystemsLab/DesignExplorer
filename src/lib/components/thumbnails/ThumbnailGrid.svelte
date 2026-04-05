<script lang="ts">
  import { dataset } from '../../stores/dataset.svelte';
  import { selection } from '../../stores/selection.svelte';
  import { favorites } from '../../stores/favorites.svelte';
  import { createColorScale } from '../../charts/shared/color-scale';
  import { DEFAULT_COLOR } from '../../charts/shared/color-scale';

  /** Column to sort thumbnails by */
  let sortColumn = $state<string>('');
  let sortAscending = $state<boolean>(true);

  let filteredRows = $derived(selection.filteredRows);

  let sortedRows = $derived.by(() => {
    if (!sortColumn) return filteredRows;
    const col = dataset.columns.find((c) => c.originalName === sortColumn);
    if (!col) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const va = a[sortColumn];
      const vb = b[sortColumn];
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortAscending ? va - vb : vb - va;
      }
      return sortAscending
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  });

  function getImageUrl(row: Record<string, unknown>): string {
    const imgCols = dataset.imageColumns;
    if (imgCols.length === 0) return '';
    const path = row[imgCols[0].originalName];
    if (typeof path !== 'string') return '';
    return dataset.resolveAssetUrl(path);
  }

  function getColor(row: Record<string, unknown>): string {
    if (!selection.colorDimension) return DEFAULT_COLOR;
    const col = dataset.columns.find((c) => c.originalName === selection.colorDimension);
    if (!col) return DEFAULT_COLOR;
    const scale = createColorScale(col, dataset.rows);
    return scale.getColor(row as import('../../types/data').DesignRow);
  }

  function toggleSort(colName: string) {
    if (sortColumn === colName) {
      sortAscending = !sortAscending;
    } else {
      sortColumn = colName;
      sortAscending = true;
    }
  }
</script>

<div class="flex flex-col h-full">
  <!-- Sort controls -->
  <div
    class="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200 overflow-x-auto"
  >
    <span class="text-xs text-gray-500 whitespace-nowrap">Sort by:</span>
    {#each dataset.numericColumns as col}
      <button
        class="px-2 py-0.5 text-xs rounded-full border whitespace-nowrap transition-colors
          {sortColumn === col.originalName
          ? 'bg-blue-100 border-blue-300 text-blue-800'
          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'}"
        onclick={() => toggleSort(col.originalName)}
      >
        {col.displayName}
        {#if sortColumn === col.originalName}
          <span>{sortAscending ? '\u2191' : '\u2193'}</span>
        {/if}
      </button>
    {/each}
    <span class="ml-auto text-xs text-gray-400">
      {filteredRows.length} / {dataset.rows.length} designs
    </span>
  </div>

  <!-- Thumbnail grid -->
  <div class="flex-1 overflow-auto p-2">
    <div class="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
      {#each sortedRows as row (row._index)}
        {@const imgUrl = getImageUrl(row)}
        {@const color = getColor(row)}
        {@const isHighlighted = selection.highlighted?._index === row._index}
        {@const isFav = favorites.isFavorite(dataset.getRowId(row))}

        <button
          class="relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
            {isHighlighted ? 'ring-2 ring-orange-400 scale-105' : ''}"
          style="border-color: {color}"
          onclick={() => selection.highlight(row)}
          onmouseenter={() => selection.highlight(row)}
          aria-label="Select design #{row._index}"
          aria-current={isHighlighted ? 'true' : undefined}
        >
          {#if imgUrl}
            <img src={imgUrl} alt="" class="w-full h-full object-cover" loading="lazy" />
          {:else}
            <div
              class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs"
            >
              #{row._index}
            </div>
          {/if}

          {#if isFav}
            <div
              class="absolute top-0.5 right-0.5 text-red-500 text-sm drop-shadow"
              aria-hidden="true"
            >
              &#9829;
            </div>
          {/if}
        </button>
      {/each}
    </div>
  </div>
</div>
