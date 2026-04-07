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
  let showHelp = $state(false);

  async function handleUrl() {
    if (!urlInput.trim()) return;
    loading = true;
    error = '';

    try {
      const { csvText, baseUrl, resolvedUrl } = await loadFromUrl(urlInput.trim());
      dataset.load(csvText, { type: 'url', name: urlInput.trim(), baseUrl });
      favorites.init(dataset.studyId);

      // Update browser URL for sharing (use resolved URL so the link works)
      const params = new URLSearchParams(window.location.search);
      params.set('url', resolvedUrl);
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

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && open) onclose(); }} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
        <div>
          <h2 id="modal-title" class="text-lg font-semibold text-gray-900">Load Design Study</h2>
          <p class="text-sm text-gray-500 mt-0.5">
            Upload a CSV file or provide a URL to a hosted dataset
          </p>
        </div>
        <button
          onclick={onclose}
          class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors"
          aria-label="Close modal"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
            <label class="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-700 transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
              Browse Files
              <input
                type="file"
                accept=".csv,.zip"
                class="sr-only"
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
            {#if loading}
              <div class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mt-3">
                <div class="h-full bg-blue-600 rounded-full animate-loading-bar"></div>
              </div>
              <p class="text-xs text-gray-400 mt-1.5 text-center">Fetching dataset&hellip;</p>
            {/if}
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

        <!-- CSV format help -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <button
            onclick={() => (showHelp = !showHelp)}
            aria-expanded={showHelp}
            aria-controls="csv-help-content"
            class="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <span class="inline-block transition-transform {showHelp ? 'rotate-90' : ''}"
              style="font-size: 10px;">&#9654;</span>
            How to prepare your CSV
          </button>

          {#if showHelp}
            <div id="csv-help-content" class="mt-3 text-xs text-gray-600 space-y-3">
              <p>
                Each row represents one design iteration. Use column name prefixes to
                tell Design Explorer how to interpret your data:
              </p>

              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="py-1 pr-3 font-semibold text-gray-700">Prefix</th>
                    <th class="py-1 font-semibold text-gray-700">Meaning</th>
                  </tr>
                </thead>
                <tbody class="font-mono">
                  <tr class="border-b border-gray-100">
                    <td class="py-1 pr-3 text-blue-600">in:</td>
                    <td class="font-sans">Input parameter (e.g. <code class="bg-gray-100 px-1 rounded">in:Width</code>)</td>
                  </tr>
                  <tr class="border-b border-gray-100">
                    <td class="py-1 pr-3 text-green-600">out:</td>
                    <td class="font-sans">Output metric (e.g. <code class="bg-gray-100 px-1 rounded">out:Energy</code>)</td>
                  </tr>
                  <tr class="border-b border-gray-100">
                    <td class="py-1 pr-3 text-purple-600">img</td>
                    <td class="font-sans">Image path (e.g. <code class="bg-gray-100 px-1 rounded">img:Perspective</code>)</td>
                  </tr>
                  <tr>
                    <td class="py-1 pr-3 text-orange-600">threeD</td>
                    <td class="font-sans">3D model path (e.g. <code class="bg-gray-100 px-1 rounded">threeD:Model</code>)</td>
                  </tr>
                </tbody>
              </table>

              <div class="space-y-1.5">
                <p>
                  <strong class="text-gray-700">Units</strong> &mdash; Add units in square brackets:
                  <code class="bg-gray-100 px-1 rounded">in:Width[m]</code>,
                  <code class="bg-gray-100 px-1 rounded">out:Cooling[kWh]</code>
                </p>
                <p>
                  <strong class="text-gray-700">Images</strong> &mdash; Values can be relative paths
                  (resolved from the CSV location) or full URLs. Supported formats: PNG, JPG, SVG, WebP.
                </p>
                <p>
                  <strong class="text-gray-700">3D Models</strong> &mdash; Supported formats: glTF, GLB, STL, OBJ,
                  and Spectacles JSON (from Grasshopper).
                </p>
                <p>
                  <strong class="text-gray-700">No prefix?</strong> &mdash; Columns without a recognized prefix
                  are treated as general numeric data and appear in the parallel coordinates chart.
                </p>
              </div>

              <div class="bg-gray-50 rounded-lg p-3 overflow-x-auto">
                <p class="font-semibold text-gray-700 mb-1.5">Example CSV:</p>
                <pre class="text-[11px] leading-relaxed text-gray-600 whitespace-pre">in:Width[m],in:Height[m],out:Area[m2],out:Energy[kWh],img:Render,threeD:Model
5,3,15,120,renders/001.png,models/001.glb
8,4,32,210,renders/002.png,models/002.glb
10,3,30,180,renders/003.png,models/003.glb</pre>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
