import { defineConfig } from 'vite';
import * as path from 'path';
import react from '@vitejs/plugin-react'; // you can also use @vitejs/plugin-react-swc
import pages from 'vite-plugin-react-pages';

export default defineConfig({
  plugins: [
    react(),
    pages({
      pagesDir: path.join(__dirname, 'pages'),
    }),
  ],
  base: 'dnd-tree-sortable/docs/dist',
  resolve: {
    alias: {
      'dnd-tree-sortable': path.join(__dirname, '../lib'),
      react: 'react',
      'react-dom': 'react-dom',
    },
  },
});
