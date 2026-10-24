import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/backend/source': { target: 'http://127.0.0.1:8001', rewrite: (path) => path.replace(/^\/backend\/source/, '') },
      '/backend/catalog': { target: 'http://127.0.0.1:8001', rewrite: (path) => path.replace(/^\/backend\/catalog/, '') },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/backend/source': { target: 'http://127.0.0.1:8001', rewrite: (path) => path.replace(/^\/backend\/source/, '') },
      '/backend/catalog': { target: 'http://127.0.0.1:8001', rewrite: (path) => path.replace(/^\/backend\/catalog/, '') },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
