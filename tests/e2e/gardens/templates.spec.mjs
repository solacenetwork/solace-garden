import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const sampleStorageState = JSON.parse(readFileSync(
  new URL('../../fixtures/sample-garden.json', import.meta.url),
  'utf8',
));

const flowerGardenId = '99776500-4ec2-4e88-b6f6-daf7b57f0d83';
const missingLocationId = 'd7844eb6-4f90-4f64-8458-571b0538d320';
const fallbackTemplateId = '754bcc7a-b449-4d4a-a148-c12477bb1fc2';

function storageStateWithDeletedLocationTemplate() {
  const state = structuredClone(sampleStorageState);
  const origin = state.origins.find(({ origin: value }) => value === 'http://localhost:5173');
  const database = origin?.indexedDB.find(({ name }) => name.startsWith('solace-garden-data-'));
  const locations = database?.stores.find(({ name }) => name === 'locations');
  const templates = database?.stores.find(({ name }) => name === 'gardenTemplates');
  if (!locations || !templates) {
    throw new Error('sample-garden.json must contain Locations and Garden Templates stores.');
  }

  locations.records.push({
    value: {
      id: missingLocationId,
      name: 'Temporary Template Location',
      hardinessZone: '7b',
      isSystemDefault: false,
      createdAt: '2026-11-21T00:00:00.000Z',
      updatedAt: '2026-11-21T00:00:00.000Z',
    },
  });
  templates.records.push({
    value: {
      id: fallbackTemplateId,
      name: 'Deleted Location Template',
      configuration: {
        name: 'Fallback Garden',
        description: 'Reusable details for the fallback regression.',
        locationId: missingLocationId,
        typeIds: ['container', 'outdoor'],
        layoutMediaId: null,
      },
      createdAt: '2026-11-21T00:00:00.000Z',
      updatedAt: '2026-11-21T00:00:00.000Z',
    },
  });
  return state;
}

test.describe('Garden Template management and application', () => {
  test.use({ storageState: sampleStorageState });

  test('saves, reloads, and deletes a Template without changing its source Garden', async ({ page }) => {
    const templateName = `Playwright Template ${Date.now()}`;
    const sourcePath = `/gardens/${flowerGardenId}`;

    await page.goto(sourcePath);
    await expect(page.getByRole('heading', { name: 'Flower Garden', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Save as Template' }).click();

    const saveDialog = page.getByRole('dialog', { name: 'Save as Template' });
    await expect(saveDialog).toBeVisible();
    await saveDialog.getByRole('textbox', { name: 'Template name' }).fill(templateName);
    await saveDialog.getByRole('button', { name: 'Save Template' }).click();
    await expect(page.getByRole('status')).toContainText(`Template “${templateName}” was saved.`);

    await page.goto('/templates');
    const savedTemplate = page.getByRole('list', { name: 'Saved Templates' })
      .getByRole('listitem')
      .filter({ has: page.getByRole('heading', { name: templateName, exact: true }) });
    await expect(savedTemplate).toContainText('Flower Garden');
    await expect(savedTemplate).toContainText('This garden is mainly for bees and pollinators and for looks');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: templateName, exact: true })).toBeVisible();

    await savedTemplate.getByRole('button', { name: 'Delete Template' }).click();
    const deleteDialog = page.getByRole('dialog', { name: 'Permanently delete Template?' });
    await expect(deleteDialog).toContainText('The source Garden and other records will not be deleted.');
    await deleteDialog.getByRole('button', { name: 'Delete Template' }).click();
    await expect(page.getByRole('status')).toContainText(
      `Template “${templateName}” was permanently deleted. Existing Gardens were not changed.`,
    );
    await expect(savedTemplate).toHaveCount(0);

    await page.goto(sourcePath);
    await expect(page.getByRole('heading', { name: 'Flower Garden', level: 1 })).toBeVisible();
    await expect(page.getByText('This garden is mainly for bees and pollinators and for looks', { exact: true })).toBeVisible();
    await expect(page.locator('.garden-facts').getByText('Active', { exact: true })).toBeVisible();
    await expect(page.locator('.garden-facts').getByText('Home', { exact: true })).toBeVisible();
    await expect(page.locator('.garden-facts').getByText('In-Ground, Outdoor', { exact: true })).toBeVisible();
  });

  test('applies and edits a Template into an independent Garden that persists after reload', async ({ page }) => {
    const gardenName = `Playwright Template Garden ${Date.now()}`;
    const sourceGardenPath = `/gardens/${flowerGardenId}`;

    await page.goto('/gardens/new/advanced');
    await expect(page.getByRole('heading', { name: 'Advanced Garden Creation', level: 1 })).toBeVisible();
    await page.getByRole('radio', { name: /Flower Garden Template/ }).check();
    await page.getByRole('button', { name: 'Apply Template' }).click();
    await expect(page.getByRole('status').filter({
      hasText: 'Template applied to this draft. The Garden remains independent of the Template.',
    })).toBeVisible();

    await expect(page.getByRole('textbox', { name: 'Garden name' })).toHaveValue('Flower Garden');
    await expect(page.getByRole('textbox', { name: 'Description (optional)' })).toHaveValue(
      'This garden is mainly for bees and pollinators and for looks',
    );
    await expect(page.getByLabel('Location', { exact: true })).toHaveValue('system-default-location');
    await expect(page.getByRole('checkbox', { name: /In-Ground/ })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: /Outdoor/ })).toBeChecked();

    await page.getByRole('textbox', { name: 'Garden name' }).fill(gardenName);
    await page.getByRole('button', { name: 'Create Garden' }).click();
    await expect(page.getByRole('heading', { name: gardenName, level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Flower Garden', level: 1 })).toHaveCount(0);
    await expect(page.locator('.garden-facts').getByText('Planned', { exact: true })).toBeVisible();
    await expect(page.locator('.garden-facts').getByText('Home', { exact: true })).toBeVisible();
    await expect(page.locator('.garden-facts').getByText('In-Ground, Outdoor', { exact: true })).toBeVisible();
    await expect(page.getByText('This garden is mainly for bees and pollinators and for looks', { exact: true })).toBeVisible();

    const createdGardenPath = new URL(page.url()).pathname;
    const createdGardenId = createdGardenPath.split('/').at(-1);
    expect(createdGardenPath).toMatch(/^\/gardens\/[0-9a-f-]+$/);
    expect(createdGardenId).not.toBe(flowerGardenId);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: gardenName, level: 1 })).toBeVisible();
    await expect(page.locator('.garden-facts').getByText('Planned', { exact: true })).toBeVisible();
    await expect(page.locator('.garden-facts').getByText('In-Ground, Outdoor', { exact: true })).toBeVisible();
    await expect(page.getByText('This garden is mainly for bees and pollinators and for looks', { exact: true })).toBeVisible();

    await page.goto('/templates');
    const originalTemplate = page.getByRole('list', { name: 'Saved Templates' })
      .getByRole('listitem')
      .filter({ has: page.getByRole('heading', { name: 'Flower Garden Template', exact: true }) });
    await expect(originalTemplate).toContainText('Flower Garden');
    await expect(originalTemplate).toContainText('This garden is mainly for bees and pollinators and for looks');

    await page.goto(sourceGardenPath);
    await expect(page.getByRole('heading', { name: 'Flower Garden', level: 1 })).toBeVisible();
    await expect(page.getByText('This garden is mainly for bees and pollinators and for looks', { exact: true })).toBeVisible();
    await expect(page.locator('.garden-facts').getByText('Active', { exact: true })).toBeVisible();
  });
});

test.describe('Garden Template missing-Location fallback', () => {
  test.use({ storageState: storageStateWithDeletedLocationTemplate() });

  test('deletes a Template-only Location and applies the Template using Default with an explanation', async ({ page }) => {
    await page.goto('/locations');
    const locationCard = page.getByRole('list', { name: 'Saved Locations' })
      .getByRole('listitem')
      .filter({ has: page.getByRole('heading', { name: 'Temporary Template Location', exact: true }) });
    await expect(locationCard).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    await locationCard.getByRole('button', { name: 'Delete' }).click();
    await expect(locationCard).toHaveCount(0);

    await page.goto('/gardens/new/advanced');
    await expect(page.getByRole('heading', { name: 'Advanced Garden Creation', level: 1 })).toBeVisible();
    await page.getByRole('radio', { name: /Deleted Location Template/ }).check();
    await page.getByRole('button', { name: 'Apply Template' }).click();
    await expect(page.getByRole('status').filter({
      hasText: 'Template applied. Its saved Location is no longer available, so Default Location was selected.',
    })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Garden name' })).toHaveValue('Fallback Garden');
    await expect(page.getByRole('textbox', { name: 'Description (optional)' })).toHaveValue(
      'Reusable details for the fallback regression.',
    );
    await expect(page.getByLabel('Location', { exact: true })).toHaveValue('system-default-location');

    const gardenName = `Playwright Fallback Garden ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Garden name' }).fill(gardenName);
    await page.getByRole('button', { name: 'Create Garden' }).click();
    await expect(page.getByRole('heading', { name: gardenName, level: 1 })).toBeVisible();
    await expect(page.locator('.garden-facts').getByText('Home', { exact: true })).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: gardenName, level: 1 })).toBeVisible();
    await expect(page.locator('.garden-facts').getByText('Home', { exact: true })).toBeVisible();
  });
});
