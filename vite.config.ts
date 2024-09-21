import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';
import { globSync } from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react({ jsxRuntime: 'automatic' }),
      dts({ rollupTypes: true, outDir: 'dist/types', include: ['lib'] }),
      visualizer({
        filename: './dist/stats.html', // Generates a visual report
      }),
    ],
    build: {
      lib: {
        name: 'dnd-tree-sortable',
        entry: resolve(__dirname, 'lib/index.ts'),
        fileName: (format) => `dnd-tree-sortable.${format}.js`,
        formats: ['es'],
      },
      rollupOptions: {
        external: ['react', 'react-dom', 'react/jsx-runtime'],
        input: Object.fromEntries(
          globSync('lib/**/*{.ts,.tsx}').map((file) => {
            return [
              path.relative('lib', file.slice(0, file.length - path.extname(file).length)),
              fileURLToPath(new URL(file, import.meta.url)),
            ];
          }),
        ),
        output: {
          entryFileNames: '[name].js',
          assetFileNames: 'assets/[name][extname]',
          globals: {
            react: 'React',
            'react-dom': 'React-dom',
            'react/jsx-runtime': 'react/jsx-runtime',
          },
        },
      },
    },
  };
});
