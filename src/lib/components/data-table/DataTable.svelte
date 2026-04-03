<script lang="ts">
  import { dataset } from '../../stores/dataset.svelte';
  import { selection } from '../../stores/selection.svelte';

  let filteredRows = $derived(selection.filteredRows);
  let displayColumns = $derived(
    dataset.columns.filter(
      (c) => c.classification !== 'image' && c.classification !== 'threeD'
    )
  );
</script>

<div class="w-full h-full overflow-auto">
  <table class="w-full text-xs border-collapse">
    <thead class="sticky top-0 bg-gray-50 z-10">
      <tr>
        <th class="px-2 py-1.5 text-left font-semibold text-gray-600 border-b border-gray-200">#</th>
        {#each displayColumns as col}
          <th class="px-2 py-1.5 text-left font-semibold border-b border-gray-200
            {col.classification === 'input' ? 'text-blue-600' : ''}
            {col.classification === 'output' ? 'text-emerald-600' : ''}
            {col.classification === 'meta' ? 'text-gray-600' : ''}">
            {col.displayName}
            {#if col.unit}
              <span class="font-normal text-gray-400"> [{col.unit}]</span>
            {/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each filteredRows as row (row._index)}
        <tr
          class="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors
            {selection.highlighted?._index === row._index ? 'bg-orange-50' : ''}"
          onclick={() => selection.highlight(row)}
          onmouseenter={() => selection.highlight(row)}
        >
          <td class="px-2 py-1 text-gray-400">{row._index}</td>
          {#each displayColumns as col}
            <td class="px-2 py-1 text-gray-700">
              {typeof row[col.originalName] === 'number'
                ? (row[col.originalName] as number).toFixed(2)
                : row[col.originalName]}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
