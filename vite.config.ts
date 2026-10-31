import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    /**
     * Offline / installable build.
     *
     * The app is already local-first: there is no server to talk to. The only
     * thing that needed the network was the page load itself, and the web
     * fonts. The service worker precaches the whole build so the app opens and
     * works with no connection, and caches the Google Fonts CSS and font files
     * the first time they are used.
     */
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons.svg'],
      manifest: {
        name: 'The Writers Companion',
        short_name: 'The Writers Companion',
        description: 'Write, organise, lay out and print books. Works offline; your work stays on your device.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f6f3ee',
        theme_color: '#1d2b3a',
        categories: ['productivity', 'books', 'utilities'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // precache the app shell and every hashed asset
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        // the app is a single bundle; raise the default 2 MB cap
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // web fonts: cache-first, so the second visit is fully offline
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'writerscompanion-fonts',
              expiration: { maxEntries: 240, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    // a print window is opened at runtime; keep chunks reasonably sized
    chunkSizeWarningLimit: 1600,
  },
})
