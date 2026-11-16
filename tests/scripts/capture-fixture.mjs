import { chromium } from '@playwright/test';

// Dedicated fixture-authoring profile.
// Never use a personal browser profile here.
const context = await chromium.launchPersistentContext(
  './tests/.chrome-fixture-profile',
  {
    headless: false,
  }
);

const page = context.pages()[0] ?? await context.newPage();

await page.goto('http://localhost:5173');

// Build your sample dataset in this browser window,
// then return to the terminal and press Enter.
console.log('Press Enter after creating your sample data.');
await new Promise(resolve => process.stdin.once('data', resolve));

await context.storageState({
  path: 'tests/fixtures/sample-garden.json',
  indexedDB: true,
});

await context.close();
console.log('Fixture saved.');