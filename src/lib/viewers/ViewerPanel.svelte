<script lang="ts">
  import ImageViewer from './ImageViewer.svelte';
  import ThreeDViewer from './ThreeDViewer.svelte';
  import { dataset } from '../stores/dataset.svelte';
  import { selection } from '../stores/selection.svelte';
  import { favorites } from '../stores/favorites.svelte';

  type ViewMode = '2d' | '3d';
  let viewMode = $state<ViewMode>('2d');

  let hasImages = $derived(dataset.imageColumns.length > 0);
  let has3D = $derived(dataset.threeDColumns.length > 0);

  // Auto-switch to available mode
  $effect(() => {
    if (viewMode === '2d' && !hasImages && has3D) viewMode = '3d';
    if (viewMode === '3d' && !has3D && hasImages) viewMode = '2d';
  });

  // Favorites
  let isFavorited = $derived.by(() => {
    if (!selection.highlighted) return false;
    const rowId = dataset.getRowId(selection.highlighted);
    return favorites.isFavorite(rowId);
  });

  function toggleFavorite() {
    if (!selection.highlighted) return;
    const rowId = dataset.getRowId(selection.highlighted);
    favorites.toggle(selection.highlighted._index, rowId);
  }

  // Info about highlighted design
  let highlightedInfo = $derived.by(() => {
    if (!selection.highlighted) return null;
    const row = selection.highlighted;
    const inputs = dataset.inputColumns.map((c) => ({
      label: c.displayName + (c.unit ? ` [${c.unit}]` : ''),
      value: row[c.originalName],
    }));
    const outputs = dataset.outputColumns.map((c) => ({
      label: c.displayName + (c.unit ? ` [${c.unit}]` : ''),
      value: row[c.originalName],
    }));
    return { inputs, outputs, index: row._index };
  });
</script>

<div class="w-full h-full flex flex-col bg-white overflow-hidden">
  <!-- Header with mode toggle and favorite button -->
  <div class="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200">
    <div class="flex items-center gap-1">
      {#if hasImages}
        <button
          class="px-2 py-0.5 text-xs rounded transition-colors
            {viewMode === '2d' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}"
          onclick={() => (viewMode = '2d')}
        >
          2D
        </button>
      {/if}
      {#if has3D}
        <button
          class="px-2 py-0.5 text-xs rounded transition-colors
            {viewMode === '3d' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}"
          onclick={() => (viewMode = '3d')}
        >
          3D
        </button>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      {#if selection.highlighted}
        <span class="text-xs text-gray-500">
          Design #{highlightedInfo?.index}
        </span>
        <button
          onclick={toggleFavorite}
          class="text-lg transition-colors hover:scale-110"
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {#if isFavorited}
            <span class="text-red-500">&#9829;</span>
          {:else}
            <span class="text-gray-400">&#9825;</span>
          {/if}
        </button>
      {/if}
    </div>
  </div>

  <!-- Viewer area -->
  <div class="flex-1 min-h-0">
    {#if viewMode === '2d'}
      <ImageViewer />
    {:else}
      <ThreeDViewer />
    {/if}
  </div>

  <!-- Design info bar -->
  {#if highlightedInfo}
    <div class="px-3 py-1.5 bg-gray-50 border-t border-gray-200 overflow-x-auto">
      <div class="flex gap-4 text-xs">
        {#each highlightedInfo.inputs as param}
          <span class="whitespace-nowrap">
            <span class="text-blue-600 font-medium">{param.label}:</span>
            <span class="text-gray-700">{typeof param.value === 'number' ? param.value.toFixed(2) : param.value}</span>
          </span>
        {/each}
        {#each highlightedInfo.outputs as param}
          <span class="whitespace-nowrap">
            <span class="text-emerald-600 font-medium">{param.label}:</span>
            <span class="text-gray-700">{typeof param.value === 'number' ? param.value.toFixed(2) : param.value}</span>
          </span>
        {/each}
      </div>
    </div>
  {/if}
</div>
