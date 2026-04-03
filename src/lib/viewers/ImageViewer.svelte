<script lang="ts">
  import { dataset } from '../stores/dataset.svelte';
  import { selection } from '../stores/selection.svelte';

  /** Which image column to display (when multiple exist) */
  let activeImageCol = $state<string>('');

  $effect(() => {
    const imgCols = dataset.imageColumns;
    if (imgCols.length > 0 && !activeImageCol) {
      activeImageCol = imgCols[0].originalName;
    }
  });

  let imageUrl = $derived.by(() => {
    if (!selection.highlighted || !activeImageCol) return '';
    const path = selection.highlighted[activeImageCol];
    if (typeof path !== 'string' || !path) return '';
    return dataset.resolveAssetUrl(path);
  });
</script>

<div class="w-full h-full flex flex-col bg-gray-900">
  <!-- Image column selector (if multiple) -->
  {#if dataset.imageColumns.length > 1}
    <div class="flex gap-1 p-1 bg-gray-800">
      {#each dataset.imageColumns as col}
        <button
          class="px-2 py-0.5 text-xs rounded transition-colors
            {activeImageCol === col.originalName
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'}"
          onclick={() => (activeImageCol = col.originalName)}
        >
          {col.displayName}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Image display -->
  <div class="flex-1 flex items-center justify-center overflow-hidden">
    {#if imageUrl}
      <img
        src={imageUrl}
        alt="Design visualization"
        class="max-w-full max-h-full object-contain"
      />
    {:else if selection.highlighted}
      <p class="text-gray-500 text-sm">No image available</p>
    {:else}
      <p class="text-gray-600 text-sm">Hover or click a design to preview</p>
    {/if}
  </div>
</div>
