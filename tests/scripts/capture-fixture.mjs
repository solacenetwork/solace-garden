import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const appOrigin = 'http://localhost:5173';
const fixturePath = 'tests/fixtures/sample-garden.json';

// Dedicated fixture-authoring profile. Never use a personal browser profile here.
const context = await chromium.launchPersistentContext(
  './tests/.chrome-fixture-profile',
  { headless: false }
);

try {
  const page = context.pages()[0] ?? await context.newPage();
  await page.goto(appOrigin);

  // Build or update your sample records, then press Enter in this terminal.
  console.log('Press Enter after creating your sample data.');
  await new Promise(resolve => process.stdin.once('data', resolve));

  const state = await context.storageState({ indexedDB: true });
  const gardenOrigin = state.origins.find(origin => origin.origin === appOrigin);
  const databases = gardenOrigin?.indexedDB ?? [];

  // Avoid silently replacing a populated fixture with an empty or wrong-origin snapshot.
  if (
    !databases.some(db => db.name === 'solace-config') ||
    !databases.some(db => db.name.startsWith('solace-garden-data-'))
  ) {
    throw new Error(
      'SOLACE Garden IndexedDB databases were not found. Fixture not overwritten.'
    );
  }

  const fixture = {
    cookies: [],
    origins: [gardenOrigin],
  };

  await mkdir('tests/fixtures', { recursive: true });
  await writeFile(fixturePath, JSON.stringify(fixture, null, 2) + '\n');

  console.log('Fixture saved:', fixturePath);
  console.log('Cookies: 0; origins:', fixture.origins.map(origin => origin.origin));
} finally {
  await context.close();
}
