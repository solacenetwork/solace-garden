import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/fixtures/sample-garden.json' });

test('loads the populated Garden fixture in an isolated Chromium context', async ({ page }) => {
  await page.goto('/');

  // The shell renders after Garden storage initialization completes.
  await expect(page.locator('.app-shell')).toBeVisible();

  const recordCounts = await page.evaluate(async () => {
    const databases = await indexedDB.databases();
    const names = databases.map(database => database.name);
    const gardenName = names.find(name => name?.startsWith('solace-garden-data-'));

    if (!names.includes('solace-config') || !gardenName) {
      throw new Error('Expected SOLACE Garden IndexedDB databases are missing.');
    }

    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(gardenName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    try {
      const stores = ['gardens', 'listItems', 'notes', 'locations', 'gardenTemplates', 'drafts'];
      return await Promise.all(stores.map(store => new Promise((resolve, reject) => {
        const transaction = db.transaction(store, 'readonly');
        const request = transaction.objectStore(store).count();
        request.onsuccess = () => resolve([store, request.result]);
        request.onerror = () => reject(request.error);
      }))).then(entries => Object.fromEntries(entries));
    } finally {
      db.close();
    }
  });

  expect(recordCounts.gardens).toBeGreaterThan(0);
  expect(recordCounts.listItems).toBeGreaterThan(0);
  expect(recordCounts.notes).toBeGreaterThan(0);
  expect(recordCounts.locations).toBeGreaterThan(0);
  expect(recordCounts.gardenTemplates).toBeGreaterThan(0);
  expect(recordCounts.drafts).toBeGreaterThan(0);
});
