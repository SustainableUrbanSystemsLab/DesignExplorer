<script lang="ts">
  import { dataset } from '../../stores/dataset.svelte';
  import { selection } from '../../stores/selection.svelte';
  import { favorites } from '../../stores/favorites.svelte';

  let showPanel = $state(false);

  function handleExportJSON() {
    const json = favorites.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'favorites.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      favorites.importJSON(text);
    };
    input.click();
  }

  function handleExportCSV() {
    const favIndices = favorites.favoriteIndices;
    const rows = dataset.allRows.filter((r) => favIndices.has(r._index));
    if (rows.length === 0) return;

    const headers = dataset.columns.map((c) => c.originalName);
    const csvRows = rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = String(val ?? '');
          return str.includes(',') ? `"${str}"` : str;
        })
        .join(','),
    );
    const csv = [headers.join(','), ...csvRows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'favorites.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function navigateToFavorite(rowIndex: number) {
    const row = dataset.allRows.find((r) => r._index === rowIndex);
    if (row) selection.highlight(row);
  }
</script>

<div class="flex flex-col">
  <button
    class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
    onclick={() => (showPanel = !showPanel)}
    aria-expanded={showPanel}
    aria-controls="favorites-panel-content"
  >
    <span>
      <span class="text-red-500 mr-1" aria-hidden="true">&#9829;</span>
      Favorites ({favorites.count})
    </span>
    <span class="text-xs text-gray-400" aria-hidden="true">{showPanel ? '\u25B2' : '\u25BC'}</span>
  </button>

  {#if showPanel}
    <div id="favorites-panel-content" class="px-3 pb-3 space-y-2">
      <!-- Filter toggle -->
      <label class="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={selection.showOnlyFavorites}
          class="rounded border-gray-300"
        />
        Show only favorites
      </label>

      <!-- Favorites list -->
      {#if favorites.count > 0}
        <div class="max-h-40 overflow-y-auto space-y-1">
          {#each favorites.entries as entry}
            <button
              class="w-full text-left px-2 py-1 text-xs rounded hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500
                {selection.highlighted?._index === entry.rowIndex ? 'bg-blue-100' : ''}"
              onclick={() => navigateToFavorite(entry.rowIndex)}
            >
              <span class="font-medium">Design #{entry.rowIndex}</span>
              {#if entry.note}
                <span class="text-gray-400 ml-1">- {entry.note}</span>
              {/if}
            </button>
          {/each}
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-1 pt-1">
          <button
            onclick={handleExportJSON}
            class="px-2 py-0.5 text-[10px] bg-gray-100 rounded hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Export JSON
          </button>
          <button
            onclick={handleImportJSON}
            class="px-2 py-0.5 text-[10px] bg-gray-100 rounded hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Import JSON
          </button>
          <button
            onclick={handleExportCSV}
            class="px-2 py-0.5 text-[10px] bg-gray-100 rounded hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Export CSV
          </button>
          <button
            onclick={() => favorites.clearAll()}
            class="px-2 py-0.5 text-[10px] bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Clear All
          </button>
        </div>
      {:else}
        <p class="text-xs text-gray-400">
          Click the heart icon on a design to add it to your favorites.
        </p>
      {/if}
    </div>
  {/if}
</div>
