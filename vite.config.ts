import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:7072',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        serviceWorker: resolve(__dirname, 'src/serviceWorker.ts')
      },
      output: {
        entryFileNames: (assetInfo) => {
          return assetInfo.name === 'serviceWorker' 
            ? 'serviceWorker.js'
            : 'assets/[name]-[hash].js';
        }
      }
    }
  }
});