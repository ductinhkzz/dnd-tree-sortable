import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react({
        jsxRuntime: 'classic',
      }),
      dts({ rollupTypes: true, outDir: 'dist/types', include: ['lib'] }),
    ],
    build: {
      lib: {
        name: 'dnd-tree-sortable',
        entry: resolve(__dirname, 'lib/index.ts'),
        fileName: (format) => `dnd-tree-sortable.${format}.js`,
        formats: ['es', 'umd'],
      },
      rollupOptions: {
        external: ['react', 'react-dom', 'react/jsx-runtime'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'jsxRuntime',
          },
        },
      },
      sourcemap: true,
    },
  };
});
