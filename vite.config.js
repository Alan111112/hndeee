import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // relative, so the built site works from a subfolder like /hndeee/
  base: './',
  build: {
    // GitHub Pages serves this folder straight off the main branch
    // (Settings -> Pages -> Branch: main, Folder: /docs), so the compiled
    // site has to be committed, not just built locally.
    outDir: 'docs',
    emptyOutDir: true,
  },
});
