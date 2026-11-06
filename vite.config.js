import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export const pwaOptions = {
  strategies: 'generateSW',
  registerType: 'prompt',
  injectRegister: false,
  useCredentials: true,
  includeManifestIcons: false,
  manifest: {
    name: 'SOLACE Garden',
    short_name: 'SOLACE Garden',
    description: 'Plan, track, and remember your growing seasons.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: '#486747',
    background_color: '#F7F5EE',
    icons: [
      {
        src: '/assets/icons/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/icons/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  },
  workbox: {
    globPatterns: [
      '**/*.{js,css,html,woff,woff2}',
      'assets/branding/solace-garden-green.svg',
      'assets/branding/solace-logo.svg',
      'assets/icons/android-chrome-192x192.png',
      'assets/icons/android-chrome-512x512.png',
    ],
    globIgnores: [
      'assets/plantdb/**/*',
      'assets/temp/**/*',
    ],
    navigateFallback: 'index.html',
    runtimeCaching: [],
    cleanupOutdatedCaches: true,
    skipWaiting: false,
    clientsClaim: false,
  },
};

export default defineConfig({
  plugins: [preact(), VitePWA(pwaOptions)],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
