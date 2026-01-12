import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-dom') || id.includes('react/')) return 'react-core';
          if (id.includes('react-router-dom')) return 'router';
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps';
          if (id.includes('qr-scanner')) return 'qr';
          if (id.includes('lucide-react')) return 'icons';
          return 'vendor';
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
