<script lang="ts">
  import { dataset } from '../../stores/dataset.svelte';
  import { selection } from '../../stores/selection.svelte';

  interface Props {
    onLoadData: () => void;
  }

  let { onLoadData }: Props = $props();

  let linkCopied = $state(false);

  function handleReset() {
    dataset.reset();
    selection.clearBrushes();
    selection.highlight(null);
  }

  function handleExportCSV() {
    const rows = selection.filteredRows;
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
    a.download = 'design-explorer-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleZoomToSelection() {
    dataset.zoomToRows(selection.brushedIndices);
    selection.clearBrushes();
  }

  function handleExcludeSelection() {
    const brushed = selection.brushedIndices;
    dataset.excludeRows(brushed);
    selection.clearBrushes();
  }

  /** Build a shareable deep link and copy to clipboard. */
  async function handleCopyLink() {
    const params = new URLSearchParams(window.location.search);
    const csvUrl = params.get('url');
    if (!csvUrl) return;

    const deepLink = `${window.location.origin}${window.location.pathname}?url=${encodeURIComponent(csvUrl)}`;

    try {
      await navigator.clipboard.writeText(deepLink);
      linkCopied = true;
      setTimeout(() => (linkCopied = false), 2000);
    } catch {
      // Fallback for insecure contexts
      const input = document.createElement('input');
      input.value = deepLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      linkCopied = true;
      setTimeout(() => (linkCopied = false), 2000);
    }
  }

  /** Whether the current dataset was loaded from a URL (shareable). */
  let hasShareableUrl = $derived(
    dataset.isLoaded &&
      dataset.source?.type === 'url' &&
      new URLSearchParams(window.location.search).has('url'),
  );
</script>

<nav
  class="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm"
>
  <!-- Left: Brand -->
  <div class="flex items-center gap-3">
    <h1 class="text-lg font-bold text-gray-900 tracking-tight">Design Explorer</h1>
    {#if dataset.isLoaded}
      <span class="text-xs text-gray-400 hidden sm:inline truncate max-w-[200px]">
        {dataset.source?.name ?? 'Untitled Study'}
      </span>
    {/if}
  </div>

  <!-- Center: Action buttons -->
  <div class="flex items-center gap-1">
    <button
      onclick={onLoadData}
      class="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg
        hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      Load Data
    </button>

    {#if dataset.isLoaded}
      <div class="w-px h-5 bg-gray-200 mx-1"></div>

      <button
        onclick={handleReset}
        class="px-2.5 py-1.5 text-xs text-gray-600 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        title="Reset filters and show all designs"
      >
        Reset
      </button>

      <button
        onclick={handleZoomToSelection}
        class="px-2.5 py-1.5 text-xs text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        title={selection.brushes.length === 0
          ? 'Select designs in the parallel coordinates chart before zooming'
          : 'Zoom to currently filtered designs'}
        disabled={selection.brushes.length === 0}
      >
        Zoom In
      </button>

      <button
        onclick={handleExcludeSelection}
        class="px-2.5 py-1.5 text-xs text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        title={selection.brushes.length === 0
          ? 'Select designs in the parallel coordinates chart before excluding'
          : 'Exclude currently filtered designs'}
        disabled={selection.brushes.length === 0}
      >
        Exclude
      </button>

      <div class="w-px h-5 bg-gray-200 mx-1"></div>

      <button
        onclick={handleExportCSV}
        class="px-2.5 py-1.5 text-xs text-gray-600 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        title="Export filtered designs as CSV"
      >
        Export CSV
      </button>

      {#if hasShareableUrl}
        <button
          onclick={handleCopyLink}
          class="px-2.5 py-1.5 text-xs rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
            {linkCopied ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}"
          title="Copy shareable link to clipboard"
        >
          {linkCopied ? 'Copied!' : 'Copy Link'}
        </button>
      {/if}
    {/if}
  </div>

  <!-- Right: Status -->
  <div class="flex items-center gap-2">
    {#if dataset.isLoaded}
      <span class="text-xs text-gray-500">
        <span class="font-semibold text-gray-700">{selection.filteredCount}</span>
        / {dataset.rows.length} designs
      </span>
    {/if}
    <span class="text-[10px] text-gray-300 font-mono">v{__APP_VERSION__}</span>
    <a
      href="https://github.com/SustainableUrbanSystemsLab/DesignExplorer"
      target="_blank"
      rel="noopener noreferrer"
      class="text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
      title="View on GitHub"
      aria-label="View on GitHub"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path
          d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
        />
      </svg>
    </a>
  </div>
</nav>
