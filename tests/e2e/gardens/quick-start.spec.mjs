import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/fixtures/sample-garden.json' });

test('Quick Start creates a Garden that remains accessible after reload', async ({ page }) => {
  const gardenName = `Playwright Quick Start ${Date.now()}`;
  const subtitle = 'Created by the focused Playwright workflow';

  await page.goto('/gardens');
  await page.getByRole('link', { name: 'Create Garden' }).click();
  await expect(page).toHaveURL(/\/gardens\/new$/);
  await expect(page.getByRole('heading', { name: 'Choose how to begin', level: 1 })).toBeVisible();

  await page.getByRole('link', { name: 'Open Quick Start' }).click();
  await expect(page).toHaveURL(/\/gardens\/new\/quickstart$/);
  await expect(page.getByRole('heading', { name: 'Create Garden', level: 1 })).toBeVisible();

  await page.getByRole('textbox', { name: 'Garden Name' }).fill(gardenName);
  await page.getByRole('textbox', { name: 'Subtitle (optional)' }).fill(subtitle);
  await page.getByRole('button', { name: 'Create Garden' }).click();

  await expect(page.getByRole('heading', { name: gardenName, level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/\/gardens\/[0-9a-f-]+$/);
  const gardenUrl = page.url();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: gardenName, level: 1 })).toBeVisible();
  await expect(page.getByText(subtitle, { exact: true })).toBeVisible();

  await page.goto('/gardens');
  await expect(page.getByRole('link', { name: gardenName })).toHaveAttribute('href', new URL(gardenUrl).pathname);
});
