import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'DUO - Finanzas en Pareja',
        short_name: 'DUO',
        description: 'Control financiero compartido en pareja',
        theme_color: '#0D1117',
        background_color: '#0D1117',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/favicon.png',
            sizes: '32x32 64x64',
            type: 'image/png',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180 512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});