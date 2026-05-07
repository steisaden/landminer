// @ts-nocheck
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (id.includes('@google/genai')) return 'gemini-vendor';
            if (id.includes('firebase')) return 'firebase-vendor';
            if (id.includes('react-leaflet') || id.includes('leaflet.heat') || id.includes('leaflet')) return 'map-vendor';
            if (id.includes('pdfjs-dist')) return 'pdfjs-vendor';
            if (id.includes('react-day-picker')) return 'calendar-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
            if (
              id.includes('react-router-dom') ||
              id.includes('react-router') ||
              id.includes('@remix-run/router') ||
              id.includes('react-dom') ||
              id.includes('/react/') ||
              id.includes('scheduler') ||
              id.includes('use-sync-external-store') ||
              id.includes('@floating-ui') ||
              id.includes('sonner') ||
              id.includes('@radix-ui') ||
              id.includes('class-variance-authority') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge') ||
              id.includes('motion') ||
              id.includes('next-themes') ||
              id.includes('@base-ui')
            ) return 'ui-vendor';
            if (
              id.includes('date-fns') ||
              id.includes('papaparse') ||
              id.includes('react-markdown') ||
              id.includes('uuid') ||
              id.includes('zustand') ||
              id.includes('@hello-pangea/dnd') ||
              id.includes('ngeohash') ||
              id.includes('localforage')
            ) return 'data-vendor';
            return 'vendor';
          },
        },
      },
    },
  };
});
