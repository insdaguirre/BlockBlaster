import { defineConfig } from 'vite';

const productionBase = process.env.BLOCKBLASTER_BASE ?? '/BlockBlaster/';

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : productionBase,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  test: {
    environment: 'jsdom'
  }
}));
