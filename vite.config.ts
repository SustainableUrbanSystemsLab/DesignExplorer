import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  base: '/DesignExplorer/',
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});
