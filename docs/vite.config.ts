import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  base: '/dnd-tree-sortable/',
  resolve: { alias: { 'dnd-tree-sortable': fileURLToPath(new URL('../lib', import.meta.url)) } },
});
