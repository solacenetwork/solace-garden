import { test, expect } from '@playwright/test';

// Each test gets a fresh, isolated browser context populated from this snapshot.
test.use({ storageState: 'tests/fixtures/sample-garden.json' });

test('Gardens page renders populated Garden records', async ({ page }) => {
  await page.goto('/gardens');

  await expect(page.getByRole('heading', { name: 'Gardens', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Garden management' }).getByRole('link', { name: 'Create Garden' }))
    .toHaveAttribute('href', '/gardens/new');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Draft Gardens',
    'Current Gardens',
    'Planned Gardens',
    'Previous Gardens',
  ]);

  const savedSections = [
    page.locator('section[aria-labelledby="current-gardens"]'),
    page.locator('section[aria-labelledby="planned-gardens"]'),
    page.locator('section[aria-labelledby="previous-gardens"]'),
  ];
  await expect.poll(async () => (
    (await Promise.all(savedSections.map(section => section.locator('.garden-card--saved').count())))
      .reduce((total, count) => total + count, 0)
  )).toBeGreaterThan(0);
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
  const applicationNotes = page.locator('[data-notes-group="notes"]');
  const details = applicationNotes.locator('details');
  if (!await details.evaluate(element => element.open)) {
    await applicationNotes.locator('summary').click();
    await expect(details).toHaveJSProperty('open', true);
  }
  await expect(applicationNotes.locator('.note-card').first()).toBeVisible();
});
