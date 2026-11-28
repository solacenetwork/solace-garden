import { chromium } from '@playwright/test';
import {
	APP_ORIGIN,
	displayPath,
	parseArguments,
	printSummary,
	safeWriteFixture,
	validateStorageState,
} from './fixture-state.mjs';

const { fixturePath, profilePath } = parseArguments(process.argv.slice(2), {
	allowProfile: true,
});

// Dedicated fixture-authoring profile. Never use a personal browser profile here.
const context = await chromium.launchPersistentContext(
	profilePath,
	{
		headless: false,
		timeout: 90_000,
		viewport: null,
	},
);

try {
	const page = context.pages()[0] ?? await context.newPage();
	await page.goto(APP_ORIGIN);
	const readiness = await Promise.race([
		page.locator('.app-shell').waitFor({ state: 'visible' }).then(() => 'ready'),
		page.locator('.storage-recovery').waitFor({ state: 'visible' }).then(() => 'recovery'),
	]);
	if (readiness !== 'ready') {
		throw new Error('Application storage initialization did not complete successfully.');
	}

	console.log(`Fixture authoring profile: ${displayPath(profilePath)}`);
	console.log('Application storage is ready. Build or update the fixture records in Chromium.');
	console.log('Before capture, finish editing, leave draft editors or confirm their saved status, then press Enter here.');
	await new Promise((resolve) => process.stdin.once('data', resolve));

	const state = await context.storageState({ indexedDB: true });
	const validation = validateStorageState(state, { capture: true });
	printSummary(validation.summary, validation.warnings);
	await safeWriteFixture(fixturePath, validation.fixture);

	console.log(`Fixture saved safely: ${displayPath(fixturePath)}`);
	console.log('Cookies: 0; captured origins: 1');
} finally {
	await context.close();
}
