<script lang="ts">
  import { onMount } from 'svelte';
  import Navbar from './lib/components/layout/Navbar.svelte';
  import Legend from './lib/components/layout/Legend.svelte';
  import InputSliders from './lib/components/controls/InputSliders.svelte';
  import FavoritesPanel from './lib/components/favorites/FavoritesPanel.svelte';
  import DataLoadModal from './lib/components/data-loading/DataLoadModal.svelte';
  import ParallelCoordinates from './lib/charts/parallel-coords/ParallelCoordinates.svelte';
  import ScatterMatrix from './lib/charts/scatter-matrix/ScatterMatrix.svelte';
  import ViewerPanel from './lib/viewers/ViewerPanel.svelte';
  import ThumbnailGrid from './lib/components/thumbnails/ThumbnailGrid.svelte';
  import DataTable from './lib/components/data-table/DataTable.svelte';
  import { dataset } from './lib/stores/dataset.svelte';
  import { favorites } from './lib/stores/favorites.svelte';
  import { loadFromUrl } from './lib/data/url-loader';

  let showLoadModal = $state(false);
  let showDataTable = $state(false);
  let sidebarOpen = $state(true);

  // Check for URL parameter on mount
  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get('url');
    if (url) {
      try {
        const { csvText, baseUrl } = await loadFromUrl(url);
        dataset.load(csvText, { type: 'url', name: url, baseUrl });
        favorites.init(dataset.studyId);
      } catch (e) {
        console.error('Failed to load from URL parameter:', e);
        showLoadModal = true;
      }
    } else {
      showLoadModal = true;
    }
  });
</script>

<div class="h-screen flex flex-col bg-gray-100 overflow-hidden">
  <!-- Navbar -->
  <Navbar onLoadData={() => (showLoadModal = true)} />

  <!-- Main content area -->
  <div class="flex-1 flex min-h-0">
    <!-- Sidebar -->
    {#if sidebarOpen && dataset.isLoaded}
      <aside class="w-64 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
        <div class="flex items-center justify-between px-3 py-2 border-b border-gray-200">
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Controls</span>
          <button
            class="text-gray-400 hover:text-gray-600 text-xs"
            onclick={() => (sidebarOpen = false)}
            title="Close sidebar"
          >&#10005;</button>
        </div>

        <InputSliders />

        <div class="border-t border-gray-200">
          <Legend />
        </div>

        <div class="border-t border-gray-200">
          <FavoritesPanel />
        </div>

        <!-- Data table toggle -->
        <div class="border-t border-gray-200 mt-auto p-3">
          <label class="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={showDataTable}
              class="rounded border-gray-300"
            />
            Show data table
          </label>
        </div>
      </aside>
    {/if}

    <!-- Sidebar toggle (when closed) -->
    {#if !sidebarOpen && dataset.isLoaded}
      <button
        class="flex-shrink-0 w-6 flex items-center justify-center bg-white border-r border-gray-200
          text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        onclick={() => (sidebarOpen = true)}
        title="Open sidebar"
      >&#9654;</button>
    {/if}

    <!-- Main grid area -->
    <main class="flex-1 min-w-0 flex flex-col">
      {#if dataset.isLoaded}
        <!-- Top: Parallel Coordinates -->
        <div class="h-[35%] min-h-[180px] border-b border-gray-200 bg-white">
          <ParallelCoordinates />
        </div>

        <!-- Middle: Viewer + Scatter Matrix -->
        <div class="h-[40%] min-h-[200px] flex border-b border-gray-200">
          <div class="w-1/2 min-w-[200px] border-r border-gray-200">
            <ViewerPanel />
          </div>
          <div class="w-1/2 min-w-[200px] bg-white">
            <ScatterMatrix />
          </div>
        </div>

        <!-- Bottom: Thumbnails or Data Table -->
        <div class="flex-1 min-h-[120px] bg-white">
          {#if showDataTable}
            <DataTable />
          {:else}
            <ThumbnailGrid />
          {/if}
        </div>
      {:else}
        <!-- Empty state -->
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center max-w-md">
            <div class="text-6xl mb-4">&#128200;</div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">
              Design Explorer
            </h2>
            <p class="text-gray-500 mb-6">
              Explore multi-dimensional parametric design spaces. Load a CSV
              dataset to visualize and compare design alternatives.
            </p>
            <button
              onclick={() => (showLoadModal = true)}
              class="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium
                hover:bg-blue-700 transition-colors shadow-sm"
            >
              Load a Dataset
            </button>
            <div class="mt-8 flex justify-center">
              <a
                href="https://github.com/kastnerp"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200
                  hover:border-gray-300 hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900"
              >
                <img
                  src="https://github.com/kastnerp.png"
                  alt="kastnerp"
                  class="w-6 h-6 rounded-full"
                />
                <span class="text-xs font-medium">kastnerp</span>
              </a>
            </div>
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>

<DataLoadModal open={showLoadModal} onclose={() => (showLoadModal = false)} />
