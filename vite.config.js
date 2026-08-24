import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ command, mode }) => ({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false
      },
      workbox: {
        globPatterns: command === 'serve' ? [] : ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        // Faz6: workbox hash & dontCacheBust
        dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Fiyat Teklif Formu',
        short_name: 'TeklifApp',
        description: 'Hızlı ve kolay fiyat teklifi oluşturma uygulaması',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ],
        // Faz4: PWA manifest screenshots (opsiyonel)
        screenshots: [
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', form_factor: 'wide' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', form_factor: 'narrow' }
        ]
      }
    }),
    ...(mode === 'analyze' ? [visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    })] : [])
  ],
  build: {
    target: 'es2020',
    sourcemap: mode === 'analyze' || mode === 'development',
    // html2pdf.js bilinçli olarak büyüktür ve PdfPreviewPanel'de dinamik import
    // ile ayrı bir chunk olarak yüklenir (ilk açılışı yavaşlatmaz).
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor';
          if (id.includes('node_modules/lucide-react') || id.includes('react-hot-toast') || id.includes('react-hotkeys-hook')) return 'ui-vendor';
          if (id.includes('@dnd-kit')) return 'dnd-vendor';
          if (id.includes('node_modules/xlsx')) return 'xlsx';
          // Faz6: ModernTheme ve pdf-themes lazy chunk split
          if (id.includes('src/components/pdf-themes/ModernTheme')) return 'modern-theme';
          if (id.includes('src/components/pdf-themes/')) return 'pdf-themes';
          if (id.includes('node_modules/html2pdf')) return 'html2pdf';
          return undefined;
        },
      },
    },
  },
  server: {
    host: true
  }
}))
