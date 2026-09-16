import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@react-three/postprocessing') || id.includes('postprocessing')) {
              return 'vendor-postprocessing';
            }
            if (id.includes('three') || id.includes('@react-three') || id.includes('troika-three')) {
              return 'vendor-three-core';
            }
            if (id.includes('react') || id.includes('zustand')) {
              return 'vendor-framework';
            }
          }
        },
      },
    },
  },
});
