import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const storageState = JSON.parse(readFileSync(
  new URL('../../fixtures/sample-garden.json', import.meta.url),
  'utf8',
));
const origin = storageState.origins.find(entry => entry.origin === 'http://localhost:5173');
const gardenDatabase = origin?.indexedDB?.find(db => db.name.startsWith('solace-garden-data-'));
const gardensStore = gardenDatabase?.stores?.find(store => store.name === 'gardens');

if (!gardensStore) {
  throw new Error('sample-garden.json must contain the Gardens IndexedDB store.');
}

const garden = {
  id: '00000000-0000-4000-8000-000000000065',
  name: 'Identity Test Garden',
  subtitle: null,
  description: null,
  typeIds: [],
  locationId: 'system-default-location',
  startDate: null,
  endDate: null,
  notes: null,
  status: 'planned',
  isClosed: false,
  icon: 'tree-fill',
  color: '#287D46',
  thumbnailMediaId: null,
  layoutMediaId: null,
  createdAt: '2026-01-02T03:04:05.000Z',
  updatedAt: '2026-01-02T03:04:05.000Z',
};

gardensStore.records.push({ value: garden });
test.use({ storageState });

const gardenRoute = `/gardens/${garden.id}/edit`;

async function openGardenEditor(page, viewport = null) {
  if (viewport) await page.setViewportSize(viewport);
  await page.goto(gardenRoute);
  await expect(page.getByRole('heading', { name: `Edit ${garden.name}` })).toBeVisible();
}

async function openIdentityDialog(page, control) {
  await page.getByRole('button', { name: control }).click();
  const dialog = page.getByRole('dialog', { name: 'Garden Identity' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function expectIdentity(page, { color, icon }) {
  const badge = page.locator('.garden-identity-editor__preview .garden-identity-badge');
  await expect.poll(() => badge.evaluate(element => (
    getComputedStyle(element).getPropertyValue('--garden-identity-color').trim()
  ))).toBe(color);
  await expect(badge.locator('i')).toHaveClass(new RegExp(`\\bbi-${icon}\\b`));
}

test('Color and Icon controls open the identity dialog on their matching tab', async ({ page }) => {
  await openGardenEditor(page);

  let dialog = await openIdentityDialog(page, 'Choose Color');
  await expect(dialog.locator('#garden-identity-color-tab')).toHaveClass(/\bactive\b/);
  await expect(dialog.locator('#garden-identity-color-panel')).toHaveClass(/\bactive\b/);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toBeHidden();

  dialog = await openIdentityDialog(page, 'Choose Icon');
  await expect(dialog.locator('#garden-identity-icon-tab')).toHaveClass(/\bactive\b/);
  await expect(dialog.locator('#garden-identity-icon-panel')).toHaveClass(/\bactive\b/);
});

test('Saving a curated color persists after reloading the Garden editor', async ({ page }) => {
  await openGardenEditor(page);
  const dialog = await openIdentityDialog(page, 'Choose Color');
  await dialog.getByRole('button', { name: 'Gold, #C99A27' }).click();
  await dialog.getByRole('button', { name: 'Save Color' }).click();
  await expect(dialog).toBeHidden();
  await expectIdentity(page, { color: '#C99A27', icon: 'tree-fill' });

  await page.reload();
  await expectIdentity(page, { color: '#C99A27', icon: 'tree-fill' });
});

test('Saving a curated icon persists without saving unrelated Garden form edits', async ({ page }) => {
  await openGardenEditor(page);
  await page.locator('#edit-garden-name').fill('Uncommitted Garden name');
  const dialog = await openIdentityDialog(page, 'Choose Icon');
  await dialog.getByRole('button', { name: 'Use flower1 icon' }).click();
  await dialog.getByRole('button', { name: 'Save Icon' }).click();
  await expect(dialog).toBeHidden();
  await expectIdentity(page, { color: '#287D46', icon: 'flower1' });

  await page.reload();
  await expect(page.locator('#edit-garden-name')).toHaveValue(garden.name);
  await expectIdentity(page, { color: '#287D46', icon: 'flower1' });
});

test('Custom Bootstrap Icon validation shows feedback and disables Save', async ({ page }) => {
  await openGardenEditor(page);
  const dialog = await openIdentityDialog(page, 'Choose Icon');
  await dialog.locator('#garden-identity-icon-panel .garden-identity-custom').click();
  const input = dialog.locator('#garden-identity-custom-icon');
  await input.fill('not-a-bootstrap-icon');

  await expect(input).toHaveClass(/is-invalid/);
  await expect(dialog.getByText('Invalid Bootstrap icon')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Save Icon' })).toBeDisabled();
});

test('Resetting color and icon independently saves their default values', async ({ page }) => {
  await openGardenEditor(page);
  let dialog = await openIdentityDialog(page, 'Choose Color');
  await dialog.getByRole('button', { name: 'Reset', exact: true }).click();
  await dialog.getByRole('button', { name: 'Save Color' }).click();
  await expect(dialog).toBeHidden();
  await expectIdentity(page, { color: '#6B7280', icon: 'tree-fill' });

  await page.reload();
  await expectIdentity(page, { color: '#6B7280', icon: 'tree-fill' });
  dialog = await openIdentityDialog(page, 'Choose Icon');
  await dialog.getByRole('button', { name: 'Reset', exact: true }).click();
  await dialog.getByRole('button', { name: 'Save Icon' }).click();
  await expect(dialog).toBeHidden();
  await expectIdentity(page, { color: '#6B7280', icon: 'leaf-fill' });

  await page.reload();
  await expectIdentity(page, { color: '#6B7280', icon: 'leaf-fill' });
});

test('Cancel and upper-right close discard identity selections', async ({ page }) => {
  await openGardenEditor(page);
  let dialog = await openIdentityDialog(page, 'Choose Color');
  await dialog.getByRole('button', { name: 'Teal, #308F91' }).click();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expectIdentity(page, { color: '#287D46', icon: 'tree-fill' });

  dialog = await openIdentityDialog(page, 'Choose Icon');
  await dialog.getByRole('button', { name: 'Use flower1 icon' }).click();
  await dialog.getByRole('button', { name: 'Cancel Garden identity changes' }).click();
  await expect(dialog).toBeHidden();
  await expectIdentity(page, { color: '#287D46', icon: 'tree-fill' });

  await page.reload();
  await expectIdentity(page, { color: '#287D46', icon: 'tree-fill' });
});

test('Mobile identity dialog fills the viewport, scrolls, and keeps Save reachable', async ({ page }) => {
  const viewport = { width: 390, height: 844 };
  await openGardenEditor(page, viewport);
  const dialog = await openIdentityDialog(page, 'Choose Icon');
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box.x).toBe(0);
  expect(box.y).toBe(0);
  expect(box.height).toBe(viewport.height);

  const body = dialog.locator('.dialog-body');
  await expect.poll(() => body.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  await page.mouse.wheel(0, 1000);
  await expect.poll(() => body.evaluate(element => element.scrollTop)).toBeGreaterThan(0);

  await dialog.getByRole('button', { name: 'Use 9-circle-fill icon' }).click();
  const save = dialog.getByRole('button', { name: 'Save Icon' });
  await expect(save).toBeInViewport();
  await save.click();
  await expect(dialog).toBeHidden();
  await expectIdentity(page, { color: '#287D46', icon: '9-circle-fill' });
  expect(box.width).toBe(viewport.width);
});
