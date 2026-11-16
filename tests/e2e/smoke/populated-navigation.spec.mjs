import { test, expect } from '@playwright/test';

// Each test gets a fresh, isolated browser context populated from this snapshot.
test.use({ storageState: 'tests/fixtures/sample-garden.json' });

test('Gardens page renders populated Garden records', async ({ page }) => {
  await page.goto('/gardens');

  await expect(page.getByRole('heading', { name: 'Gardens', exact: true })).toBeVisible();
  await expect(page.locator('.gardens-grid .garden-card').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Unfinished Gardens' })).toBeVisible();
});

for (const workspace of [
  { path: '/tasks', heading: 'Tasks' },
  { path: '/wishlist', heading: 'Wish List' },
]) {
  test(`${workspace.heading} page renders populated list items`, async ({ page }) => {
    await page.goto(workspace.path);

    await expect(page.getByRole('heading', {
      name: workspace.heading,
      exact: true,
      level: 1,
    })).toBeVisible();

    await expect(page.locator('.lists-list [data-list-item]').first()).toBeVisible();
  });
}

test('Notes page renders saved Notes', async ({ page }) => {
  await page.goto('/notes');

  await expect(page.getByRole('heading', { name: 'Notes', exact: true, level: 1 })).toBeVisible();
  await expect(page.locator('[aria-label="Saved Notes"] .note-card').first()).toBeVisible();
});
