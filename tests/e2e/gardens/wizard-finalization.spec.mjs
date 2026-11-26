import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

async function openWizard(page) {
  await page.goto('/gardens/new/wizard');
  await expect(page.getByRole('heading', { name: 'Create Garden Wizard', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Identity', level: 2 })).toBeVisible();
  await expect(page).toHaveURL(/\/gardens\/new\/wizard\?step=identity$/);
  const { drafts } = await readDraftData(page, { gardenId: null, draftId: null });
  expect(drafts).toEqual([]);
}

async function continueTo(page, heading) {
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: heading, level: 2 })).toBeVisible();
}

async function waitForDraftSaved(page) {
  await expect(page.getByRole('status').filter({ hasText: 'Draft saved locally' })).toBeVisible();
}

async function waitForDraftEstablished(page) {
  await waitForDraftSaved(page);
  await expect(page).toHaveURL(/\/gardens\/new\/wizard\/[0-9a-f-]{36}\?step=identity$/i);
}

async function readDraftData(page, { gardenId, draftId }) {
  return page.evaluate(async ({ gardenId, draftId }) => {
    const databaseInfo = (await indexedDB.databases())
      .find(({ name }) => name?.startsWith('solace-garden-data-'));
    if (!databaseInfo) throw new Error('The active Garden database was not found.');

    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseInfo.name);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    try {
      const transaction = database.transaction(['gardens', 'drafts', 'gardenTemplates'], 'readonly');
      const requestValue = (request) => new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const [gardens, drafts, templates] = await Promise.all([
        requestValue(transaction.objectStore('gardens').getAll()),
        requestValue(transaction.objectStore('drafts').getAll()),
        requestValue(transaction.objectStore('gardenTemplates').getAll()),
      ]);
      return {
        garden: gardens.find(({ id }) => id === gardenId) ?? null,
        draft: drafts.find(({ id }) => id === draftId) ?? null,
        gardens,
        drafts,
        templates,
      };
    } finally {
      database.close();
    }
  }, { gardenId, draftId });
}

test('renders five organized steps, validates Continue, and supports Back and browser history', async ({ page }) => {
  await openWizard(page);

  const stepper = page.getByRole('region', { name: 'Garden creation progress' });
  const steps = stepper.getByRole('listitem');
  await expect(steps).toHaveCount(5);
  for (const [index, title] of ['Identity', 'Details', 'Garden Type', 'Dates', 'Additional Options'].entries()) {
    await expect(steps.nth(index)).toHaveAttribute('aria-label', `Step ${index + 1}: ${title}, ${index === 0 ? 'Current' : 'Upcoming'}`);
  }

  await expect(page.getByRole('textbox', { name: 'Garden name' })).toHaveAttribute('required', '');
  await expect(page.getByRole('textbox', { name: 'Subtitle (optional)' })).toBeVisible();
  const iconDetails = page.locator('.garden-create__identity details').filter({ hasText: 'Icon (optional)' });
  const colorDetails = page.locator('.garden-create__identity details').filter({ hasText: 'Ring Color (optional)' });
  await expect(iconDetails.locator('summary')).toBeVisible();
  await expect(colorDetails.locator('summary')).toBeVisible();
  await expect(iconDetails).not.toHaveAttribute('open', '');
  await expect(colorDetails).not.toHaveAttribute('open', '');
  await expect(page.getByLabel('Garden Image (optional)')).toBeDisabled();

  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toContainText('Enter a Garden name.');
  await expect(page.getByRole('textbox', { name: 'Garden name' })).toBeFocused();
  await expect(page).toHaveURL(/step=identity$/);

  await page.getByRole('textbox', { name: 'Garden name' }).fill('Wizard Navigation Garden');
  await waitForDraftEstablished(page);
  await continueTo(page, 'Details');
  await expect(page.getByRole('textbox', { name: 'Description (optional)' })).toBeVisible();
  await expect(page.getByLabel('Geographic Location')).toHaveCount(0);
  await continueTo(page, 'Garden Type');
  await expect(page.getByRole('group', { name: 'Garden Types' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /Container/ })).toBeVisible();
  await continueTo(page, 'Dates');
  await expect(page.getByLabel('Start date (optional)')).toBeVisible();
  await expect(page.getByLabel('End date (optional)')).toBeVisible();

  await page.getByLabel('Start date (optional)').fill('2027-06-20');
  await page.getByLabel('End date (optional)').fill('2027-06-10');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toContainText('End date cannot precede start date.');
  await expect(page.getByLabel('End date (optional)')).toBeFocused();

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('heading', { name: 'Garden Type', level: 2 })).toBeVisible();
  await expect(page).toHaveURL(/step=types$/);
  await continueTo(page, 'Dates');
  await page.getByLabel('End date (optional)').fill('2027-06-30');
  await continueTo(page, 'Additional Options');

  await expect(page.getByRole('radio', { name: 'Planned' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Save as Template' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Finish & Create Garden' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toHaveCount(0);
  await expect(steps).toHaveCount(5);

  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Dates', level: 2 })).toBeVisible();
  await expect(page.getByLabel('End date (optional)')).toHaveValue('2027-06-30');
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Additional Options', level: 2 })).toBeVisible();
});

test('autosaves and restores Wizard fields, selections, and the current step after reload', async ({ page }) => {
  await openWizard(page);

  await page.getByRole('textbox', { name: 'Garden name' }).fill('Recovered Wizard Garden');
  await waitForDraftEstablished(page);
  const draftId = new URL(page.url()).pathname.split('/').at(-1);
  const iconDetails = page.locator('.garden-create__identity details').filter({ hasText: 'Icon (optional)' });
  const colorDetails = page.locator('.garden-create__identity details').filter({ hasText: 'Ring Color (optional)' });
  await iconDetails.locator('summary').click();
  await colorDetails.locator('summary').click();
  await expect(iconDetails).toHaveAttribute('open', '');
  await expect(colorDetails).toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'Use flower1 icon' }).click();
  await page.getByRole('button', { name: 'Forest, #287D46' }).click();
  await waitForDraftSaved(page);
  await continueTo(page, 'Details');
  await page.getByRole('textbox', { name: 'Description (optional)' }).fill('Draft description survives reload.');
  await waitForDraftSaved(page);
  await continueTo(page, 'Garden Type');
  await page.getByRole('checkbox', { name: /Container/ }).check();
  await waitForDraftSaved(page);
  await continueTo(page, 'Dates');
  await page.getByLabel('Start date (optional)').fill('2028-03-01');
  await page.getByLabel('End date (optional)').fill('2028-10-15');
  await waitForDraftSaved(page);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dates', level: 2 })).toBeVisible();
  await expect(page).toHaveURL(/step=dates$/);
  await expect(page.getByLabel('Start date (optional)')).toHaveValue('2028-03-01');
  await expect(page.getByLabel('End date (optional)')).toHaveValue('2028-10-15');

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('checkbox', { name: /Container/ })).toBeChecked();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('textbox', { name: 'Description (optional)' })).toHaveValue(
    'Draft description survives reload.',
  );
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('textbox', { name: 'Garden name' })).toHaveValue('Recovered Wizard Garden');
  await expect(iconDetails).toHaveAttribute('open', '');
  await expect(colorDetails).toHaveAttribute('open', '');
  await expect(page.getByRole('button', { name: 'Use flower1 icon' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Forest, #287D46' })).toHaveAttribute('aria-pressed', 'true');

  const { draft } = await readDraftData(page, { gardenId: null, draftId });
  expect(draft).toMatchObject({
    preferredEditor: 'wizard',
    currentStepId: 'identity',
    fields: {
      name: 'Recovered Wizard Garden',
      description: 'Draft description survives reload.',
      icon: 'flower1',
      color: '#287D46',
      typeIds: expect.arrayContaining(['container']),
      startDate: '2028-03-01',
      endDate: '2028-10-15',
    },
  });
});

test('whole-Garden validation does not create a draft for an untouched form', async ({ page }) => {
  await openWizard(page);
  const wizardPath = new URL(page.url()).pathname;

  await page.goto(`${wizardPath}?step=options`);
  await expect(page.getByRole('heading', { name: 'Additional Options', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Finish & Create Garden' }).click();

  await expect(page.getByRole('heading', { name: 'Identity', level: 2 })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Review Identity: Garden name must contain text.');
  await expect(page.getByRole('textbox', { name: 'Garden name' })).toBeFocused();
  await expect(page.getByRole('textbox', { name: 'Garden name' })).toHaveValue('');
  await expect(page).toHaveURL(/step=identity$/);
  const { drafts } = await readDraftData(page, { gardenId: null, draftId: null });
  expect(drafts).toEqual([]);
});

test('whole-Garden validation preserves an established draft and its meaningful fields', async ({ page }) => {
  const gardenName = 'Persisted Validation Draft';
  const description = 'Meaningful content must survive whole-Garden validation.';
  await openWizard(page);
  await page.getByRole('textbox', { name: 'Garden name' }).fill(gardenName);
  await waitForDraftEstablished(page);
  const draftId = new URL(page.url()).pathname.split('/').at(-1);

  await continueTo(page, 'Details');
  await page.getByRole('textbox', { name: 'Description (optional)' }).fill(description);
  await waitForDraftSaved(page);
  await continueTo(page, 'Garden Type');
  await continueTo(page, 'Dates');
  await page.getByLabel('Start date (optional)').fill('2028-03-01');
  await page.getByLabel('End date (optional)').fill('2027-02-01');
  await waitForDraftSaved(page);
  const wizardPath = new URL(page.url()).pathname;
  await page.goto(`${wizardPath}?step=options`);
  await expect(page.getByRole('heading', { name: 'Additional Options', level: 2 })).toBeVisible();
  const { draft: savedDraft } = await readDraftData(page, { gardenId: null, draftId });
  expect(savedDraft).toMatchObject({
    fields: {
      name: gardenName,
      description,
      startDate: '2028-03-01',
      endDate: '2027-02-01',
    },
  });

  await page.getByRole('button', { name: 'Finish & Create Garden' }).click();

  await expect(page.getByRole('heading', { name: 'Dates', level: 2 })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('End date');
  await expect(page.getByLabel('Start date (optional)')).toHaveValue('2028-03-01');
  await expect(page.getByLabel('End date (optional)')).toHaveValue('2027-02-01');
  await expect(page).toHaveURL(/step=dates$/);
  const { draft } = await readDraftData(page, { gardenId: null, draftId });
  expect(draft).toMatchObject({
    preferredEditor: 'wizard',
    fields: {
      name: gardenName,
      description,
      startDate: '2028-03-01',
      endDate: '2027-02-01',
    },
  });
});

test('confirms or cancels Template finalization and atomically persists the Garden and Template', async ({ page }) => {
  const gardenName = 'Wizard Finalization Garden';
  const templateName = 'Wizard Finalization Snapshot';
  await openWizard(page);

  await page.getByRole('textbox', { name: 'Garden name' }).fill(gardenName);
  await waitForDraftEstablished(page);
  const draftId = new URL(page.url()).pathname.split('/').at(-1);
  await continueTo(page, 'Details');
  await continueTo(page, 'Garden Type');
  await continueTo(page, 'Dates');
  await continueTo(page, 'Additional Options');
  await page.getByRole('radio', { name: 'Active' }).check();
  await page.getByRole('checkbox', { name: 'Save as Template' }).check();
  await waitForDraftSaved(page);

  await page.getByRole('button', { name: 'Finish & Create Garden' }).click();
  const dialog = page.getByRole('dialog', { name: 'Save as Template' });
  await expect(dialog).toBeVisible();
  const templateNameInput = dialog.getByRole('textbox', { name: 'Template name' });
  await expect(templateNameInput).toBeFocused();
  await expect(templateNameInput).toHaveValue(`${gardenName} Template`);
  await templateNameInput.fill(templateName);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Additional Options', level: 2 })).toBeVisible();

  const beforeConfirmation = await readDraftData(page, { gardenId: null, draftId });
  expect(beforeConfirmation.gardens).toEqual([]);
  expect(beforeConfirmation.templates).toEqual([]);
  expect(beforeConfirmation.draft).toMatchObject({
    fields: { name: gardenName, status: 'active', saveAsTemplate: true },
  });

  await page.getByRole('button', { name: 'Finish & Create Garden' }).click();
  await expect(dialog).toBeVisible();
  const confirmationNameInput = dialog.getByRole('textbox', { name: 'Template name' });
  await expect(confirmationNameInput).toBeFocused();
  await confirmationNameInput.fill(templateName);
  await dialog.getByRole('button', { name: 'Finish & Create Garden' }).click();

  await expect(page.getByRole('heading', { name: gardenName, level: 1 })).toBeVisible();
  await expect(page.locator('.garden-facts').getByText('Active', { exact: true })).toBeVisible();
  const gardenId = new URL(page.url()).pathname.split('/').at(-1);
  const result = await readDraftData(page, { gardenId, draftId });
  expect(result.garden).toMatchObject({
    id: gardenId,
    name: gardenName,
    status: 'active',
    isClosed: false,
  });
  expect(result.draft).toBeNull();
  expect(result.templates).toHaveLength(1);
  expect(result.templates[0]).toMatchObject({
    name: templateName,
    configuration: { name: gardenName },
  });
});
