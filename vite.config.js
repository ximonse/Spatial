import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-konva': ['konva'],
          'vendor-db': ['dexie', 'jszip'],
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
