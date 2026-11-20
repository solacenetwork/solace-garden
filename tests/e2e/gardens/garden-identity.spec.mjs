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

const timestamp = '2026-01-02T03:04:05.000Z';
const gardens = [
  {
    id: '00000000-0000-4000-8000-000000000065',
    name: 'Identity Test Garden',
    icon: 'tree-fill',
    color: '#287D46',
  },
  {
    id: '00000000-0000-4000-8000-000000000066',
    name: 'Default Identity Test Garden',
    icon: null,
    color: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000067',
    name: 'Custom Identity Test Garden',
    icon: 'alarm',
    color: '#12AB34',
  },
].map(garden => ({
  subtitle: null,
  description: null,
  typeIds: [],
  locationId: 'system-default-location',
  startDate: null,
  endDate: null,
  notes: null,
  status: 'planned',
  isClosed: false,
  thumbnailMediaId: null,
  layoutMediaId: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  ...garden,
}));

gardensStore.records.push(...gardens.map(value => ({ value })));
test.use({ storageState });

const [garden, defaultGarden, customGarden] = gardens;

async function openGardenEditor(page, targetGarden = garden, viewport = null) {
  if (viewport) await page.setViewportSize(viewport);
  await page.goto(`/gardens/${targetGarden.id}/edit`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: `Edit ${targetGarden.name}` })).toBeVisible();
}

async function openIdentityDialog(page, control = 'Choose Color') {
  const dialog = page.getByRole('dialog', { name: 'Garden Identity' });
  const shown = dialog.evaluate(element => new Promise(resolve => {
    element.addEventListener('shown.bs.dialog', resolve, { once: true });
  }));
  await page.getByRole('button', { name: control }).click();
  await shown;
  await expect(dialog).toBeVisible();
  const tab = control === 'Choose Icon' ? 'icon' : 'color';
  await expect(dialog.locator(`#garden-identity-${tab}-tab`)).toHaveClass(/\bactive\b/);
  await expect(dialog.locator(`#garden-identity-${tab}-panel`)).toHaveClass(/\bactive\b/);
  return dialog;
}

async function selectTab(dialog, name) {
  const tab = dialog.locator(`#garden-identity-${name}-tab`);
  const shown = tab.evaluate(element => new Promise(resolve => {
    element.addEventListener('shown.bs.tab', resolve, { once: true });
  }));
  await tab.click();
  await shown;
  await expect(tab).toHaveClass(/\bactive\b/);
  await expect(dialog.locator(`#garden-identity-${name}-panel`)).toHaveClass(/\bactive\b/);
}

async function expectIdentity(page, { color, icon }) {
  const badge = page.locator('.garden-identity-editor__preview .garden-identity-badge');
  await expect.poll(() => badge.evaluate(element => (
    getComputedStyle(element).getPropertyValue('--garden-identity-color').trim()
  ))).toBe(color);
  await expect(badge.locator('i')).toHaveClass(new RegExp(`\\bbi-${icon}\\b`));
}

async function expectDialogPreview(dialog, { color, icon }) {
  const badge = dialog.locator('.garden-identity-preview .garden-identity-badge');
  await expect.poll(() => badge.evaluate(element => (
    getComputedStyle(element).getPropertyValue('--garden-identity-color').trim()
  ))).toBe(color);
  await expect(badge.locator('i')).toHaveClass(new RegExp(`\\bbi-${icon}\\b`));
}

async function storedIdentity(page, targetGarden) {
  return page.evaluate(({ databaseName, id }) => new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('gardens', 'readonly');
      const recordRequest = transaction.objectStore('gardens').get(id);
      recordRequest.onerror = () => reject(recordRequest.error);
      recordRequest.onsuccess = () => resolve({
        icon: recordRequest.result?.icon,
        color: recordRequest.result?.color,
      });
      transaction.oncomplete = () => database.close();
      transaction.onerror = () => reject(transaction.error);
    };
  }), { databaseName: gardenDatabase.name, id: targetGarden.id });
}

async function saveIdentity(dialog) {
  const hidden = dialog.evaluate(element => new Promise(resolve => {
    element.addEventListener('hidden.bs.dialog', resolve, { once: true });
  }));
  await dialog.getByRole('button', { name: 'Save Identity' }).click();
  await hidden;
  await expect(dialog).toBeHidden();
}

async function dismissIdentityDialog(dialog, action) {
  const hidden = dialog.evaluate(element => new Promise(resolve => {
    element.addEventListener('hidden.bs.dialog', resolve, { once: true });
  }));
  await action();
  await hidden;
  await expect(dialog).toBeHidden();
}

test('Color and Icon controls open the identity dialog on their matching tab', async ({ page }) => {
  await openGardenEditor(page);

  let dialog = await openIdentityDialog(page, 'Choose Color');
  await expect(dialog.locator('#garden-identity-color-tab')).toHaveClass(/\bactive\b/);
  await expect(dialog.locator('#garden-identity-color-panel')).toHaveClass(/\bactive\b/);
  await dismissIdentityDialog(dialog, () => dialog.getByRole('button', { name: 'Cancel', exact: true }).click());

  dialog = await openIdentityDialog(page, 'Choose Icon');
  await expect(dialog.locator('#garden-identity-icon-tab')).toHaveClass(/\bactive\b/);
  await expect(dialog.locator('#garden-identity-icon-panel')).toHaveClass(/\bactive\b/);
});

test('Save Identity commits changed color and icon together', async ({ page }) => {
  await openGardenEditor(page);
  const dialog = await openIdentityDialog(page);
  await dialog.getByRole('button', { name: 'Gold, #C99A27' }).click();
  await selectTab(dialog, 'icon');
  await dialog.getByRole('button', { name: 'Use flower1 icon' }).click();
  await saveIdentity(dialog);
  await expectIdentity(page, { color: '#C99A27', icon: 'flower1' });

  await page.reload();
  await expectIdentity(page, { color: '#C99A27', icon: 'flower1' });
});

test('Save Identity preserves color when only the icon changes', async ({ page }) => {
  await openGardenEditor(page);
  const dialog = await openIdentityDialog(page);
  await selectTab(dialog, 'icon');
  await dialog.getByRole('button', { name: 'Use flower1 icon' }).click();
  await saveIdentity(dialog);

  await page.reload();
  await expectIdentity(page, { color: '#287D46', icon: 'flower1' });
});

test('Save Identity preserves icon when only the color changes', async ({ page }) => {
  await openGardenEditor(page);
  const dialog = await openIdentityDialog(page);
  await dialog.getByRole('button', { name: 'Gold, #C99A27' }).click();
  await saveIdentity(dialog);

  await page.reload();
  await expectIdentity(page, { color: '#C99A27', icon: 'tree-fill' });
});

test('Save Identity without changes leaves both existing values unchanged', async ({ page }) => {
  await openGardenEditor(page);
  const dialog = await openIdentityDialog(page);
  await dialog.getByRole('button', { name: 'Save Identity' }).click();
  await page.reload();
  await expectIdentity(page, { color: '#287D46', icon: 'tree-fill' });
});

test('Cancel from default values discards both selections and preserves null storage', async ({ page }) => {
  await openGardenEditor(page, defaultGarden);
  let dialog = await openIdentityDialog(page);
  await dialog.getByRole('button', { name: 'Gold, #C99A27' }).click();
  await selectTab(dialog, 'icon');
  await dialog.getByRole('button', { name: 'Use flower1 icon' }).click();
  await dismissIdentityDialog(dialog, () => dialog.getByRole('button', { name: 'Cancel', exact: true }).click());
  await expectIdentity(page, { color: '#6B7280', icon: 'leaf-fill' });

  dialog = await openIdentityDialog(page, 'Choose Color');
  await expectDialogPreview(dialog, { color: '#6B7280', icon: 'leaf-fill' });
  await expect(dialog.getByRole('button', { name: 'Gold, #C99A27' })).toHaveAttribute('aria-pressed', 'false');
  await selectTab(dialog, 'icon');
  await expect(dialog.getByRole('button', { name: 'Use flower1 icon' })).toHaveAttribute('aria-pressed', 'false');
  await dismissIdentityDialog(dialog, () => dialog.getByRole('button', { name: 'Cancel', exact: true }).click());

  await page.reload();
  await expectIdentity(page, { color: '#6B7280', icon: 'leaf-fill' });
  await expect(await storedIdentity(page, defaultGarden)).toEqual({ color: null, icon: null });
});

test('Cancel and X dismissal preserve existing customization', async ({ page }) => {
  await openGardenEditor(page, customGarden);
  let dialog = await openIdentityDialog(page);
  await dialog.getByRole('button', { name: 'Gold, #C99A27' }).click();
  await selectTab(dialog, 'icon');
  await dialog.getByRole('button', { name: 'Use flower1 icon' }).click();
  await dismissIdentityDialog(dialog, () => dialog.getByRole('button', { name: 'Cancel', exact: true }).click());
  await expectIdentity(page, { color: '#12AB34', icon: 'alarm' });

  dialog = await openIdentityDialog(page, 'Choose Color');
  await dialog.getByRole('button', { name: 'Teal, #308F91' }).click();
  await dismissIdentityDialog(dialog, () => dialog.getByRole('button', { name: 'Cancel Garden identity changes' }).click());

  await page.reload();
  await expectIdentity(page, { color: '#12AB34', icon: 'alarm' });
});

test('Escape dismisses pending identity changes without saving', async ({ page }) => {
  await openGardenEditor(page, customGarden);
  const dialog = await openIdentityDialog(page, 'Choose Icon');
  await dialog.getByRole('button', { name: 'Use flower1 icon' }).click();
  await expect(dialog.getByRole('button', { name: 'Use flower1 icon' })).toHaveAttribute('aria-pressed', 'true');
  await dismissIdentityDialog(dialog, () => page.keyboard.press('Escape'));

  await page.reload();
  await expectIdentity(page, { color: '#12AB34', icon: 'alarm' });
});

test('Backdrop dismissal preserves the saved Garden Identity', async ({ page }, testInfo) => {
  await openGardenEditor(page, customGarden);
  const dialog = await openIdentityDialog(page);
  await dialog.getByRole('button', { name: 'Gold, #C99A27' }).click();
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  await dialog.evaluate(element => {
    window.__gardenIdentityBackdropClick = null;
    element.addEventListener('click', event => {
      window.__gardenIdentityBackdropClick = {
        targetIsDialog: event.target === element,
        clientX: event.clientX,
        clientY: event.clientY,
      };
    }, true);
  });
  const outside = await page.evaluate(rect => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (rect.x > 8) return { x: 4, y: Math.max(4, rect.y + 20) };
    if (rect.x + rect.width + 8 < width) return { x: rect.x + rect.width + 4, y: Math.max(4, rect.y + 20) };
    if (rect.y > 8) return { x: Math.max(4, rect.x + 20), y: 4 };
    return {
      x: Math.max(4, rect.x + 20),
      y: rect.y + rect.height + 4 < height ? rect.y + rect.height + 4 : height - 4,
    };
  }, box);
  try {
    await dismissIdentityDialog(dialog, () => page.mouse.click(outside.x, outside.y));
  } catch (error) {
    const click = await page.evaluate(() => window.__gardenIdentityBackdropClick);
    await testInfo.attach('backdrop-click-diagnostics.json', {
      body: JSON.stringify({ box, outside, click }, null, 2),
      contentType: 'application/json',
    });
    throw error;
  }
  await page.reload();
  await expectIdentity(page, { color: '#12AB34', icon: 'alarm' });
  await expect(await storedIdentity(page, customGarden)).toEqual({ color: '#12AB34', icon: 'alarm' });
});

test('Reset affects only the active pending field and Cancel commits neither reset nor selection', async ({ page }) => {
  await openGardenEditor(page);
  const dialog = await openIdentityDialog(page);
  await dialog.getByRole('button', { name: 'Gold, #C99A27' }).click();
  await selectTab(dialog, 'icon');
  await dialog.getByRole('button', { name: 'Use flower1 icon' }).click();
  await selectTab(dialog, 'color');
  await dialog.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Reset', exact: true })).toBeEnabled();
  await expect(dialog.getByRole('button', { name: 'Gold, #C99A27' })).toHaveAttribute('aria-pressed', 'false');
  await expectDialogPreview(dialog, { color: '#6B7280', icon: 'flower1' });

  await selectTab(dialog, 'icon');
  await dialog.getByRole('button', { name: 'Reset', exact: true }).click();
  await expectDialogPreview(dialog, { color: '#6B7280', icon: 'leaf-fill' });
  await dismissIdentityDialog(dialog, () => dialog.getByRole('button', { name: 'Cancel', exact: true }).click());

  await page.reload();
  await expectIdentity(page, { color: '#287D46', icon: 'tree-fill' });
  await expect(await storedIdentity(page, garden)).toEqual({ color: '#287D46', icon: 'tree-fill' });
});

test('Invalid custom icon and color prevent Save Identity', async ({ page }) => {
  await openGardenEditor(page);
  const dialog = await openIdentityDialog(page, 'Choose Icon');
  await dialog.locator('#garden-identity-icon-panel .garden-identity-custom').click();
  const iconInput = dialog.locator('#garden-identity-custom-icon');
  await iconInput.fill('not-a-bootstrap-icon');
  await expect(iconInput).toHaveClass(/is-invalid/);
  await expect(dialog.getByText('Invalid Bootstrap icon')).toBeVisible();
  const save = dialog.getByRole('button', { name: 'Save Identity' });
  await expect(save).toBeDisabled();

  await selectTab(dialog, 'color');
  await dialog.locator('#garden-identity-color-panel .garden-identity-custom').click();
  const colorInput = dialog.locator('#garden-identity-custom-color');
  await colorInput.fill('#12');
  await expect(colorInput).toHaveClass(/is-invalid/);
  await expect(dialog.getByText('Enter a six-digit hexadecimal color')).toBeVisible();
  await expect(save).toBeDisabled();
});

test('Saving identity does not save unsaved Garden name or description edits', async ({ page }) => {
  await openGardenEditor(page);
  await page.locator('#edit-garden-name').fill('Uncommitted Garden name');
  await page.locator('#edit-garden-description').fill('Uncommitted Garden description');
  const dialog = await openIdentityDialog(page);
  await selectTab(dialog, 'icon');
  await dialog.getByRole('button', { name: 'Use flower1 icon' }).click();
  await saveIdentity(dialog);
  await expectIdentity(page, { color: '#287D46', icon: 'flower1' });

  await page.reload();
  await expect(page.locator('#edit-garden-name')).toHaveValue(garden.name);
  await expect(page.locator('#edit-garden-description')).toHaveValue('');
  await expectIdentity(page, { color: '#287D46', icon: 'flower1' });
});

test('Mobile identity dialog fills the viewport, scrolls, and keeps Save Identity reachable', async ({ page }, testInfo) => {
  const viewport = { width: 390, height: 844 };
  await openGardenEditor(page, garden, viewport);
  const dialog = await openIdentityDialog(page, 'Choose Icon');
  const measurements = await dialog.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      innerWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollbarGutter: getComputedStyle(document.documentElement).scrollbarGutter,
      dialog: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        computedWidth: style.width,
        maxWidth: style.maxWidth,
        boxSizing: style.boxSizing,
        dialogWidthToken: style.getPropertyValue('--dialog-width').trim(),
        bootstrapDialogWidthToken: style.getPropertyValue('--bs-dialog-width').trim(),
      },
    };
  });
  if (
    measurements.innerWidth !== viewport.width
    || measurements.dialog.x !== 0
    || measurements.dialog.y !== 0
    || measurements.dialog.width !== viewport.width
    || measurements.dialog.height !== viewport.height
  ) {
    await testInfo.attach('mobile-dialog-measurements.json', {
      body: JSON.stringify(measurements, null, 2),
      contentType: 'application/json',
    });
  }

  expect(measurements.innerWidth).toBe(viewport.width);
  expect(measurements.dialog.x).toBe(0);
  expect(measurements.dialog.y).toBe(0);
  expect(measurements.dialog.height).toBe(viewport.height);

  const body = dialog.locator('.dialog-body');
  await expect.poll(() => body.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  await page.mouse.wheel(0, 1000);
  await expect.poll(() => body.evaluate(element => element.scrollTop)).toBeGreaterThan(0);

  await dialog.getByRole('button', { name: 'Use 9-circle-fill icon' }).click();
  const save = dialog.getByRole('button', { name: 'Save Identity' });
  await expect(save).toBeInViewport();
  await save.click();
  await expect(dialog).toBeHidden();
  await expectIdentity(page, { color: '#287D46', icon: '9-circle-fill' });
  expect(
    measurements.dialog.width,
    `Mobile dialog measurements: ${JSON.stringify(measurements)}`,
  ).toBe(viewport.width);
});
