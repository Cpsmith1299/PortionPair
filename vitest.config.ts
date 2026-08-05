import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
    globals: true,
    // `reference/` holds the read-only Vite prototype; it is not part of the build.
    exclude: ['node_modules/**', '.next/**', 'reference/**'],
  },
});
