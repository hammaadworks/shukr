import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
      },
      includeAssets: ['favicon.svg', 'icons.svg', 'src/lib/data/core/*.json', 'src/lib/data/i18n/*.json'],
      manifest: {
        name: 'Shukr - Adaptive AAC',
        short_name: 'Shukr',
        description: 'Urdu-first Adaptive AAC for Seniors',
        theme_color: '#0891B2',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
});
