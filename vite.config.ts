import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import pkg from './package.json' with { type: 'json' };

const externalPackages = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];

export default defineConfig({
  resolve: { alias: { '@/components/ui': fileURLToPath(new URL('./lib/components/ui', import.meta.url)) } },
  plugins: [react(), tailwindcss()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: fileURLToPath(new URL('./lib/package.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
      cssFileName: 'style',
    },
    rolldownOptions: {
      external: (id) => externalPackages.some((name) => id === name || id.startsWith(`${name}/`)),
      output: { assetFileNames: 'assets/[name][extname]', banner: '"use client";' },
    },
  },
});
