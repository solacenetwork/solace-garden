import { chromium } from '@playwright/test';

const appOrigin = 'http://localhost:5173';
const fixturePath = 'tests/fixtures/sample-garden.json';

// A new non-persistent context restores IndexedDB from the saved Playwright state.
// Changes made here will not alter the fixture or the capture profile.
const browser = await chromium.launch({ headless: false, timeout: 90_000 });

try {
  const context = await browser.newContext({ 
    storageState: fixturePath,
    viewport: null 
  });
  const page = await context.newPage();

  await page.goto(appOrigin);

  const databaseNames = await page.evaluate(async () => {
    const databases = await indexedDB.databases();
    return databases.map(database => database.name);
  });

  if (
    !databaseNames.includes('solace-config') ||
    !databaseNames.some(name => name?.startsWith('solace-garden-data-'))
  ) {
    throw new Error('Expected SOLACE Garden IndexedDB databases were not restored.');
  }

  console.log('Fixture restored into an isolated Chromium context.');
  console.log('IndexedDB databases:', databaseNames);
  console.log('Inspect the Garden data in Chromium, then press Enter here to close.');
  await new Promise(resolve => process.stdin.once('data', resolve));

  await context.close();
} finally {
  await browser.close();
}
