import { chromium } from '@playwright/test';
import {
	APP_ORIGIN,
	displayPath,
	parseArguments,
	printSummary,
	readAndValidateFixture,
	validateStorageState,
} from './fixture-state.mjs';

const { fixturePath } = parseArguments(process.argv.slice(2));
const expected = await readAndValidateFixture(fixturePath);

console.log(`Validated fixture: ${displayPath(fixturePath)}`);
printSummary(expected.summary, expected.warnings);

// A new non-persistent context restores IndexedDB from the saved Playwright state.
// Changes made here will not alter the fixture or the capture profile.
const browser = await chromium.launch({ headless: false, timeout: 90_000 });

try {
	const context = await browser.newContext({
		storageState: fixturePath,
		viewport: null,
  });
  const page = await context.newPage();

	await page.goto(APP_ORIGIN);
	const readiness = await Promise.race([
		page.locator('.app-shell').waitFor({ state: 'visible' }).then(() => 'ready'),
		page.locator('.storage-recovery').waitFor({ state: 'visible' }).then(() => 'recovery'),
	]);
	if (readiness !== 'ready') {
		throw new Error('Application storage initialization did not complete successfully after restoration.');
	}
	const restored = validateStorageState(await context.storageState({ indexedDB: true }));
	const discrepancies = Object.entries(expected.summary.recordCounts).filter(
		([storeName, count]) => restored.summary.recordCounts[storeName] !== count,
	);
	if (restored.activeDatabaseName !== expected.activeDatabaseName) {
		throw new Error(`Restored active database is ${restored.activeDatabaseName}; expected ${expected.activeDatabaseName}.`);
	}
	if (discrepancies.length > 0) {
		console.warn(`Warning: restored record counts differ after application startup: ${discrepancies.map(([name, count]) => `${name} expected ${count}, restored ${restored.summary.recordCounts[name]}`).join('; ')}.`);
	}

	console.log('Fixture restored into an isolated Chromium context.');
	printSummary(restored.summary, restored.warnings);
	if (discrepancies.length === 0) {
		console.log('Restored record counts match the captured snapshot.');
	}
	console.log('Inspect the Garden data in Chromium, then press Enter here to close.');
	await new Promise((resolve) => process.stdin.once('data', resolve));

	await context.close();
} finally {
	await browser.close();
}
