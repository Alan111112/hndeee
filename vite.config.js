import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // relative, so the built site works from a domain root or a subfolder
  base: './',
  // output stays at Vite's default `dist/`, which is what Vercel expects and
  // what .gitignore excludes — the host builds it, we never commit it
});
