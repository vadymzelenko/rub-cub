import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const shortcut = (name, short_name, screen, icon) => ({
  name, short_name, url: './?screen=' + screen,
  icons: [{ src: icon, sizes: '96x96', type: 'image/png' }],
});

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: './',
        name: 'RubCub — Rubik’s Cube Solver',
        short_name: 'RubCub',
        description: 'Scan a 3x3 cube with the camera and solve it step by step on an animated 3D cube. Works offline.',
        start_url: './',
        scope: './',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait',
        background_color: '#0b0b0f',
        theme_color: '#0b0b0f',
        lang: 'en',
        dir: 'ltr',
        categories: ['games', 'education', 'utilities'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
        shortcuts: [
          shortcut('Scan the cube', 'Scan', 'scan', 'icons/shortcut-scan.png'),
          shortcut('Enter colours manually', 'Manual', 'manual', 'icons/shortcut-manual.png'),
          shortcut('Learn to solve', 'Learn', 'learn', 'icons/shortcut-learn.png'),
        ],
        screenshots: [
          { src: 'screenshots/home.png', sizes: '780x1688', type: 'image/png', form_factor: 'narrow', label: 'Home' },
          { src: 'screenshots/solve.png', sizes: '780x1688', type: 'image/png', form_factor: 'narrow', label: 'Step-by-step solution' },
          { src: 'screenshots/review.png', sizes: '780x1688', type: 'image/png', form_factor: 'narrow', label: 'Check the colours' },
          { src: 'screenshots/wide.png', sizes: '1600x1000', type: 'image/png', form_factor: 'wide', label: 'RubCub on desktop' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        // Greek / Vietnamese font subsets are never needed by the UI languages.
        globIgnores: ['screenshots/**', '**/*greek*', '**/*vietnamese*'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  worker: { format: 'es' },
  server: { host: true, port: 5173 },
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : undefined),
      },
    },
  },
});
