import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      'dnd-tree-sortable': fileURLToPath(new URL('../lib', import.meta.url)),
      '@/components/ui': fileURLToPath(new URL('../lib/components/ui', import.meta.url)),
    },
  },
  plugins: [react(), tailwindcss()],
  base: '/dnd-tree-sortable/',
});
