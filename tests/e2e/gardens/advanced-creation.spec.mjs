import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/fixtures/sample-garden.json' });

async function openAdvanced(page) {
  await page.goto('/gardens/new/advanced');
  await expect(page.getByRole('heading', { name: 'Advanced Garden Creation', level: 1 })).toBeVisible();
}

async function waitForDraftSaved(page) {
  await expect(page.getByRole('status').filter({ hasText: 'Draft saved locally' })).toBeVisible();
}

async function readStoredRecords(page, storeNames) {
  return page.evaluate(async (requestedStores) => {
    function requestResult(request) {
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    const configDb = await requestResult(indexedDB.open('solace-config'));
    const config = await requestResult(
      configDb.transaction('configuration', 'readonly')
        .objectStore('configuration')
        .get('main'),
    );
    configDb.close();

    const gardenDb = await requestResult(indexedDB.open(config.activeDatabase));
    try {
      const transaction = gardenDb.transaction(requestedStores, 'readonly');
      const records = await Promise.all(requestedStores.map(async (storeName) => [
        storeName,
        await requestResult(transaction.objectStore(storeName).getAll()),
      ]));
      return Object.fromEntries(records);
    } finally {
      gardenDb.close();
    }
  }, storeNames);
}

test('Advanced creates an Active Garden that is independently locked', async ({ page }) => {
  const gardenName = `Playwright Active Locked ${Date.now()}`;
  await openAdvanced(page);
  await page.getByRole('textbox', { name: 'Garden name' }).fill(gardenName);
  await page.getByRole('radio', { name: 'Active' }).check();

  const locked = page.getByRole('checkbox', { name: 'Locked' });
  await locked.check();
  await expect(locked).toBeChecked();
  await expect(locked).toBeEnabled();

  await waitForDraftSaved(page);
  await page.getByRole('button', { name: 'Create Garden' }).click();
  await expect(page.getByRole('heading', { name: gardenName, level: 1 })).toBeVisible();

  const gardenId = new URL(page.url()).pathname.split('/').at(-1);
  const { gardens } = await readStoredRecords(page, ['gardens']);
  expect(gardens.find(({ id }) => id === gardenId)).toMatchObject({
    name: gardenName,
    status: 'active',
    isClosed: true,
  });
});

test('Advanced creation sections are visible in the expected order', async ({ page }) => {
  await openAdvanced(page);

  const headings = page.getByRole('heading', { level: 2 });
  await expect(headings).toHaveText([
    'Identity',
    'Details',
    'Garden Type',
    'Dates',
    'Additional Options',
  ]);
  for (const heading of await headings.all()) {
    await expect(heading).toBeVisible();
  }
});

test('Advanced creates a Completed Garden with the expected open state', async ({ page }) => {
  const gardenName = `Playwright Completed ${Date.now()}`;
  await openAdvanced(page);
  await page.getByRole('textbox', { name: 'Garden name' }).fill(gardenName);
  await page.getByRole('radio', { name: 'Completed' }).check();
  await waitForDraftSaved(page);
  await page.getByRole('button', { name: 'Create Garden' }).click();

  await expect(page.getByRole('heading', { name: gardenName, level: 1 })).toBeVisible();
  await expect(page.locator('.garden-facts').getByText('Completed', { exact: true })).toBeVisible();
  const gardenId = new URL(page.url()).pathname.split('/').at(-1);
  const { gardens } = await readStoredRecords(page, ['gardens']);
  expect(gardens.find(({ id }) => id === gardenId)).toMatchObject({
    name: gardenName,
    status: 'completed',
    isClosed: false,
  });
});

test('Advanced Archived selection locks the Garden and persists it as closed', async ({ page }) => {
  const gardenName = `Playwright Archived ${Date.now()}`;
  await openAdvanced(page);
  await page.getByRole('textbox', { name: 'Garden name' }).fill(gardenName);

  const locked = page.getByRole('checkbox', { name: 'Locked' });
  await page.getByRole('radio', { name: 'Archived' }).check();
  await expect(locked).toBeChecked();
  await expect(locked).toBeDisabled();

  await waitForDraftSaved(page);
  await page.getByRole('button', { name: 'Create Garden' }).click();
  await expect(page.getByRole('heading', { name: gardenName, level: 1 })).toBeVisible();

  const gardenId = new URL(page.url()).pathname.split('/').at(-1);
  const { gardens } = await readStoredRecords(page, ['gardens']);
  expect(gardens.find(({ id }) => id === gardenId)).toMatchObject({
    name: gardenName,
    status: 'archived',
    isClosed: true,
  });
});

test('Advanced draft recovery restores lifecycle and field edits after reload and resume', async ({ page }) => {
  const gardenName = `Playwright Recovered Advanced ${Date.now()}`;
  const description = 'Recovered Advanced draft description.';
  await openAdvanced(page);
  const draftId = new URL(page.url()).pathname.split('/').at(-1);

  await page.getByRole('textbox', { name: 'Garden name' }).fill(gardenName);
  await page.getByRole('textbox', { name: 'Description (optional)' }).fill(description);
  await page.getByRole('radio', { name: 'Completed' }).check();
  await waitForDraftSaved(page);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Advanced Garden Creation', level: 1 })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Garden name' })).toHaveValue(gardenName);
  await expect(page.getByRole('textbox', { name: 'Description (optional)' })).toHaveValue(description);
  await expect(page.getByRole('radio')).toHaveCount(4);
  await expect(page.getByRole('radio', { name: 'Completed' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Planned' })).toHaveCount(1);
  await expect(page.getByRole('radio', { name: 'Active' })).toHaveCount(1);
  await expect(page.getByRole('radio', { name: 'Archived' })).toHaveCount(1);

  await page.goto('/gardens');
  const resumeLink = page.getByRole('link', { name: gardenName });
  await expect(resumeLink).toHaveAttribute('href', `/gardens/new/advanced/${draftId}`);
  await resumeLink.click();
  await expect(page).toHaveURL(new RegExp(`/gardens/new/advanced/${draftId}$`));
  await expect(page.getByRole('heading', { name: 'Advanced Garden Creation', level: 1 })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Garden name' })).toHaveValue(gardenName);
  await expect(page.getByRole('textbox', { name: 'Description (optional)' })).toHaveValue(description);
  await expect(page.getByRole('radio')).toHaveCount(4);
  await expect(page.getByRole('radio', { name: 'Completed' })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Switch to Wizard' })).toHaveCount(0);

  const { drafts } = await readStoredRecords(page, ['drafts']);
  expect(drafts.find(({ id }) => id === draftId)).toMatchObject({
    preferredEditor: 'advanced',
    fields: {
      name: gardenName,
      description,
      status: 'completed',
      isClosed: false,
    },
  });
});

test('Advanced Save as Template cancellation preserves the draft and confirmation creates both records', async ({ page }) => {
  const gardenName = `Playwright Advanced Template ${Date.now()}`;
  const templateName = `Playwright Advanced Snapshot ${Date.now()}`;
  await openAdvanced(page);
  const draftId = new URL(page.url()).pathname.split('/').at(-1);

  await page.getByRole('textbox', { name: 'Garden name' }).fill(gardenName);
  await page.getByRole('checkbox', { name: 'Save as Template' }).check();
  await waitForDraftSaved(page);
  await page.getByRole('button', { name: 'Create Garden' }).click();

  const dialog = page.getByRole('dialog', { name: 'Save as Template' });
  await expect(dialog).toBeVisible();
  const nameInput = dialog.getByRole('textbox', { name: 'Template name' });
  await expect(nameInput).toBeFocused();
  await expect(nameInput).toHaveValue(`${gardenName} Template`);
  await nameInput.fill(templateName);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toBeHidden();

  let stored = await readStoredRecords(page, ['gardens', 'drafts', 'gardenTemplates']);
  expect(stored.gardens.some(({ name }) => name === gardenName)).toBe(false);
  expect(stored.gardenTemplates.some(({ name }) => name === templateName)).toBe(false);
  expect(stored.drafts.find(({ id }) => id === draftId)).toMatchObject({
    fields: { name: gardenName, saveAsTemplate: true },
  });

  await page.getByRole('button', { name: 'Create Garden' }).click();
  await expect(dialog).toBeVisible();
  const confirmationNameInput = dialog.getByRole('textbox', { name: 'Template name' });
  await expect(confirmationNameInput).toBeFocused();
  await expect(confirmationNameInput).toHaveValue(`${gardenName} Template`);
  await confirmationNameInput.fill(templateName);
  await dialog.getByRole('button', { name: 'Finish & Create Garden' }).click();

  await expect(page.getByRole('heading', { name: gardenName, level: 1 })).toBeVisible();
  const gardenId = new URL(page.url()).pathname.split('/').at(-1);
  stored = await readStoredRecords(page, ['gardens', 'drafts', 'gardenTemplates']);
  expect(stored.gardens.find(({ id }) => id === gardenId)).toMatchObject({
    name: gardenName,
    status: 'planned',
    isClosed: false,
  });
  expect(stored.gardenTemplates).toContainEqual(expect.objectContaining({
    name: templateName,
    configuration: expect.objectContaining({ name: gardenName }),
  }));
  expect(stored.drafts.some(({ id }) => id === draftId)).toBe(false);
});

test('Wizard exposes only open statuses and both editors resume without editor-switch controls', async ({ page }) => {
  const wizardName = `Playwright Wizard Isolation ${Date.now()}`;
  await page.goto('/gardens/new/wizard');
  await expect(page.getByRole('heading', { name: 'Create Garden Wizard', level: 1 })).toBeVisible();
  await page.getByRole('textbox', { name: 'Garden name' }).fill(wizardName);
  await waitForDraftSaved(page);
  for (const heading of ['Details', 'Garden Type', 'Dates', 'Additional Options']) {
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: heading, level: 2 })).toBeVisible();
  }

  const wizardStatuses = page.getByRole('radio');
  await expect(wizardStatuses).toHaveCount(2);
  await expect(page.getByRole('radio', { name: 'Planned' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Active' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Completed' })).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'Archived' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Switch to (Wizard|Advanced)/ })).toHaveCount(0);

  const wizardDraftId = new URL(page.url()).pathname.split('/').at(-1);
  await page.goto('/gardens');
  await page.getByRole('link', { name: wizardName }).click();
  await expect(page).toHaveURL(new RegExp(`/gardens/new/wizard/${wizardDraftId}\\?step=options$`));
  await expect(page.getByRole('heading', { name: 'Create Garden Wizard', level: 1 })).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(2);
  await expect(page.getByRole('button', { name: /Switch to (Wizard|Advanced)/ })).toHaveCount(0);
});
