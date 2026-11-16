import { test, expect } from '@playwright/test';

// These tests use a fresh in-memory browser context per test.
// Deletions cannot modify the committed fixture or the authoring profile.
test.use({ storageState: 'tests/fixtures/sample-garden.json' });

for (const itemType of [
  { route: '/tasks', prompt: 'Permanently delete this Task?' },
  { route: '/wishlist', prompt: 'Permanently delete this Wish List item?' },
]) {
  for (const decision of ['cancel', 'confirm']) {
    test(`${itemType.route} deletion ${decision} and reload`, async ({ page }) => {
      await page.goto(itemType.route);

      const items = page.locator('.lists-list [data-list-item]');
      await expect(items.first()).toBeVisible();
      const initialCount = await items.count();
      expect(initialCount).toBeGreaterThan(0);

      const button = items.first().getByRole('button', { name: 'Delete', exact: true });

      // Fail clearly if clicking Delete does not present the expected browser
      // confirmation dialog, as reported by the Chromium laptop test.
      const dialogPromise = page.waitForEvent('dialog', { timeout: 5_000 });
      await Promise.all([
        dialogPromise.then(async dialog => {
          expect(dialog.type()).toBe('confirm');
          expect(dialog.message()).toContain(itemType.prompt);
          if (decision === 'confirm') await dialog.accept();
          else await dialog.dismiss();
        }),
        button.click(),
      ]);

      const expectedCount = initialCount - (decision === 'confirm' ? 1 : 0);
      await expect(items).toHaveCount(expectedCount);
      await page.reload();
      await expect(items).toHaveCount(expectedCount);

    });
  }
}
