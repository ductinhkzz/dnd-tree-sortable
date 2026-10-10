import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@/components/ui': fileURLToPath(new URL('./lib/components/ui', import.meta.url)) } },
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'node',
    restoreMocks: true,
  },
});
