<script lang="ts">
  import { dataset } from '../../stores/dataset.svelte';
  import { favorites } from '../../stores/favorites.svelte';
  import { loadFromUrl } from '../../data/url-loader';
  import { loadFile } from '../../data/file-loader';

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  let activeTab = $state<'url' | 'file'>('file');
  let urlInput = $state('');
  let dragOver = $state(false);
  let loading = $state(false);
  let error = $state('');

  async function handleUrl() {
    if (!urlInput.trim()) return;
    loading = true;
    error = '';

    try {
      const { csvText, baseUrl } = await loadFromUrl(urlInput.trim());
      dataset.load(csvText, { type: 'url', name: urlInput.trim(), baseUrl });
      favorites.init(dataset.studyId);

      // Update browser URL for sharing
      const params = new URLSearchParams(window.location.search);
      params.set('url', urlInput.trim());
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);

      onclose();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load URL';
    } finally {
      loading = false;
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    loading = true;
    error = '';

    try {
      const file = files[0];
      const result = await loadFile(file);
      dataset.load(
        result.csvText,
        { type: 'file', name: file.name },
        result.assets
      );
      favorites.init(dataset.studyId);
      onclose();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load file';
    } finally {
      loading = false;
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    handleFiles(event.dataTransfer?.files ?? null);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }

  async function loadSample() {
    loading = true;
    error = '';
    try {
      const base = import.meta.env.BASE_URL;
      const { csvText, baseUrl } = await loadFromUrl(
        `${window.location.origin}${base}sample-data/red-box/LittleRedBox.csv`
      );
      dataset.load(csvText, { type: 'url', name: 'Sample: Red Box', baseUrl });
      favorites.init(dataset.studyId);
      onclose();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load sample';
    } finally {
      loading = false;
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Load Design Study</h2>
        <p class="text-sm text-gray-500 mt-0.5">
          Upload a CSV file or provide a URL to a hosted dataset
        </p>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200">
        <button
          class="flex-1 px-4 py-2 text-sm font-medium transition-colors
            {activeTab === 'file'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'}"
          onclick={() => (activeTab = 'file')}
        >
          Upload File
        </button>
        <button
          class="flex-1 px-4 py-2 text-sm font-medium transition-colors
            {activeTab === 'url'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'}"
          onclick={() => (activeTab = 'url')}
        >
          From URL
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        {#if activeTab === 'file'}
          <!-- Drag and drop zone -->
          <div
            class="border-2 border-dashed rounded-xl p-8 text-center transition-colors
              {dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}"
            ondrop={handleDrop}
            ondragover={handleDragOver}
            ondragleave={() => (dragOver = false)}
          >
            <div class="text-4xl mb-3">&#128194;</div>
            <p class="text-sm text-gray-600 mb-2">
              Drag & drop a <strong>.csv</strong> or <strong>.zip</strong> file here
            </p>
            <p class="text-xs text-gray-400 mb-3">or</p>
            <label class="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
              Browse Files
              <input
                type="file"
                accept=".csv,.zip"
                class="hidden"
                onchange={(e) => handleFiles((e.target as HTMLInputElement).files)}
              />
            </label>
          </div>
        {:else}
          <!-- URL input -->
          <div class="space-y-3">
            <div>
              <label for="csv-url" class="block text-sm font-medium text-gray-700 mb-1">
                CSV URL
              </label>
              <input
                id="csv-url"
                type="url"
                bind:value={urlInput}
                placeholder="https://example.com/study/data.csv"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                onkeydown={(e) => { if (e.key === 'Enter') handleUrl(); }}
              />
            </div>
            <p class="text-xs text-gray-400">
              Images referenced in the CSV with relative paths will be resolved relative to this URL.
            </p>
            <button
              onclick={handleUrl}
              disabled={loading || !urlInput.trim()}
              class="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg
                hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Load Dataset'}
            </button>
          </div>
        {/if}

        {#if error}
          <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        {/if}

        <!-- Sample data -->
        <div class="mt-6 pt-4 border-t border-gray-200">
          <p class="text-xs text-gray-500 mb-2">Or try a sample dataset:</p>
          <button
            onclick={loadSample}
            disabled={loading}
            class="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg
              hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Red Box Parametric Study (125 designs)
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
