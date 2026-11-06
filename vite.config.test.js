import { describe, expect, it } from 'vitest';
import { pwaOptions } from './vite.config.js';

describe('PWA build configuration', () => {
	it('uses consent-based service worker updates', () => {
		expect(pwaOptions.strategies).toBe('generateSW');
		expect(pwaOptions.registerType).toBe('prompt');
		expect(pwaOptions.injectRegister).toBe(false);
		expect(pwaOptions.workbox.skipWaiting).toBe(false);
		expect(pwaOptions.workbox.clientsClaim).toBe(false);
	});

	it('precaches the offline shell without runtime or PlantDB caching', () => {
		expect(pwaOptions.workbox.globPatterns).toContain('**/*.{js,css,html,woff,woff2}');
		expect(pwaOptions.workbox.globIgnores).toContain('assets/plantdb/**/*');
		expect(pwaOptions.workbox.runtimeCaching).toEqual([]);
		expect(pwaOptions.workbox.navigateFallback).toBe('index.html');
	});

	it('defines the root-scoped standalone manifest and required icons', () => {
		expect(pwaOptions.useCredentials).toBe(true);
		expect(pwaOptions.manifest).toMatchObject({
			name: 'SOLACE Garden',
			short_name: 'SOLACE Garden',
			start_url: '/',
			scope: '/',
			display: 'standalone',
			theme_color: '#486747',
			background_color: '#F7F5EE',
		});
		expect(pwaOptions.manifest.icons.map(({ sizes }) => sizes)).toEqual(['192x192', '512x512']);
	});
});
