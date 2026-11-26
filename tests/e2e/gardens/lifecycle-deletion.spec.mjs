import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const storageState = JSON.parse(readFileSync(
  new URL('../../fixtures/sample-garden.json', import.meta.url),
  'utf8',
));
const origin = storageState.origins.find(({ origin: value }) => value === 'http://localhost:5173');
const database = origin?.indexedDB.find(({ name }) => name.startsWith('solace-garden-data-'));
const records = (storeName) => database?.stores.find(({ name }) => name === storeName)?.records.map(({ value }) => value);
const gardens = records('gardens');
const listItems = records('listItems');
const notes = records('notes');
const gardenToDelete = gardens?.find(({ name }) => name === 'Tomatoes');
const survivingGarden = gardens?.find(({ name }) => name === 'Flower Garden');
const associatedNotes = notes?.filter(({ gardenId }) => gardenId === gardenToDelete?.id) ?? [];
const associatedListItems = listItems?.filter(({ gardenId }) => gardenId === gardenToDelete?.id) ?? [];

if (!gardenToDelete || !survivingGarden || associatedNotes.length === 0
  || !associatedListItems.some(({ kind }) => kind === 'task')
  || !associatedListItems.some(({ kind }) => kind === 'wishlist')) {
  throw new Error('sample-garden.json must include lifecycle Gardens and associated Note, Task, and Wish List records.');
}

test.use({ storageState });

async function readGardenData(page) {
  return page.evaluate(async ({ targetId, survivorId, noteIds, listItemIds }) => {
    function requestResult(request) {
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    const configDb = await requestResult(indexedDB.open('solace-config'));
    const configuration = await requestResult(
      configDb.transaction('configuration', 'readonly')
        .objectStore('configuration')
        .get('main'),
    );
    configDb.close();

    const gardenDb = await requestResult(indexedDB.open(configuration.activeDatabase));
    const transaction = gardenDb.transaction(['gardens', 'notes', 'listItems'], 'readonly');
    const gardenStore = transaction.objectStore('gardens');
    const noteStore = transaction.objectStore('notes');
    const listItemStore = transaction.objectStore('listItems');
    const [target, survivor, remainingGardenIds, savedNotes, savedListItems] = await Promise.all([
      requestResult(gardenStore.get(targetId)),
      requestResult(gardenStore.get(survivorId)),
      requestResult(gardenStore.getAllKeys()),
      Promise.all(noteIds.map((id) => requestResult(noteStore.get(id)))),
      Promise.all(listItemIds.map((id) => requestResult(listItemStore.get(id)))),
    ]);
    gardenDb.close();
    return { target, survivor, remainingGardenIds, savedNotes, savedListItems };
  }, {
    targetId: gardenToDelete.id,
    survivorId: survivingGarden.id,
    noteIds: associatedNotes.map(({ id }) => id),
    listItemIds: associatedListItems.map(({ id }) => id),
  });
}

async function expandNotesAccordion(page, groupId) {
  const accordion = page.locator(`[data-notes-group="${groupId}"]`);
  const details = accordion.locator('details');
  if (!await details.evaluate(element => element.open)) {
    await accordion.locator('summary').click();
    await expect(details).toHaveJSProperty('open', true);
  }
}

async function expandListsAccordion(page, kind) {
  await expect(page.locator('.lists-collections')).toBeVisible();
  const accordion = page.locator(`[data-lists-group="${kind}"]`);
  if (!await accordion.count()) return;
  const details = accordion.locator('details');
  if (!await details.evaluate(element => element.open)) {
    await accordion.locator('summary').click();
  }
  await expect(details).toHaveJSProperty('open', true);
}

test('Garden status changes persist; Locked and Archived Gardens require explicit unlocking', async ({ page }) => {
  const gardenId = gardens.find(({ name }) => name === 'Fruit trees')?.id;
  expect(gardenId).toBeTruthy();
  const gardenPath = `/gardens/${gardenId}`;

  await page.goto(gardenPath);
  await expect(page.getByRole('heading', { name: 'Fruit trees', level: 1 })).toBeVisible();
  await expect(page.locator('.garden-facts').getByText('Planned', { exact: true })).toBeVisible();

  await page.getByLabel('Status', { exact: true }).selectOption('active');
  await page.getByRole('button', { name: 'Update Status' }).click();
  await expect(page.locator('.garden-facts').getByText('Active', { exact: true })).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.garden-facts').getByText('Active', { exact: true })).toBeVisible();

  await page.getByLabel('Status', { exact: true }).selectOption('completed');
  await page.getByRole('button', { name: 'Update Status' }).click();
  await expect(page.locator('.garden-facts').getByText('Completed', { exact: true })).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.garden-facts').getByText('Completed', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit Garden' })).toBeVisible();

  await page.getByRole('button', { name: 'Lock Garden' }).click();
  const closeDialog = page.getByRole('dialog', { name: 'Lock Garden?' });
  await expect(closeDialog).toBeVisible();
  await closeDialog.getByRole('button', { name: 'Lock Garden' }).click();
  await expect(page.locator('.garden-facts').getByText('Yes', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit Garden' })).toHaveCount(0);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('This Garden is locked and read-only. Unlocking keeps its current status.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit Garden' })).toHaveCount(0);
  await page.goto(`${gardenPath}/edit`);
  await expect(page.getByRole('status').filter({ hasText: 'This Garden is read-only because it is locked.' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Garden name' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Save Changes' })).toHaveCount(0);

  await page.goto(gardenPath);
  await page.getByRole('button', { name: 'Unlock Garden' }).click();
  await expect(page.locator('.garden-facts').getByText('No', { exact: true })).toBeVisible();
  await expect(page.locator('.garden-facts').getByText('Completed', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit Garden' })).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('link', { name: 'Edit Garden' })).toBeVisible();

  await page.getByLabel('Status', { exact: true }).selectOption('archived');
  await page.getByRole('button', { name: 'Update Status' }).click();
  const archiveDialog = page.getByRole('dialog', { name: 'Archive Garden?' });
  await expect(archiveDialog).toBeVisible();
  await archiveDialog.getByRole('button', { name: 'Archive Garden' }).click();
  await expect(page.locator('.garden-facts').getByText('Archived', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit Garden' })).toHaveCount(0);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('This Garden is archived and read-only.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit Garden' })).toHaveCount(0);
  await page.goto(`${gardenPath}/edit`);
  await expect(page.getByRole('status').filter({ hasText: 'This Garden is read-only because it is locked.' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Garden name' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Save Changes' })).toHaveCount(0);

  await page.goto(gardenPath);
  await page.getByRole('button', { name: 'Unarchive Garden' }).click();
  await expect(page.locator('.garden-facts').getByText('Completed', { exact: true })).toBeVisible();
  await expect(page.locator('.garden-facts').getByText('No', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit Garden' })).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.garden-facts').getByText('Completed', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit Garden' })).toBeVisible();
});

test('canceling and confirming permanent deletion preserves associated records and other Gardens', async ({ page }) => {
  const gardenPath = `/gardens/${gardenToDelete.id}`;

  await page.goto(gardenPath);
  await expect(page.getByRole('heading', { name: gardenToDelete.name, level: 1 })).toBeVisible();
  const deletionDialogShown = page.locator('.garden-deletion-dialog').evaluate((element) => (
    new Promise((resolve) => element.addEventListener('shown.bs.dialog', resolve, { once: true }))
  ));
  await page.getByRole('button', { name: 'Permanently Delete Garden' }).click();
  await deletionDialogShown;
  const deleteDialog = page.getByRole('dialog', { name: 'Permanently delete Garden?' });
  await expect(deleteDialog).toContainText('Independent Notes, Tasks, and Wish List items will be preserved.');
  await expect(deleteDialog).toContainText('Their associations with this Garden will be cleared.');
  await deleteDialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(deleteDialog).toBeHidden();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: gardenToDelete.name, level: 1 })).toBeVisible();
  const beforeDeletion = await readGardenData(page);
  expect(beforeDeletion.target).toMatchObject({
    id: gardenToDelete.id,
    name: gardenToDelete.name,
    notes: gardenToDelete.notes,
    isClosed: true,
    status: 'archived',
  });
  expect(beforeDeletion.savedNotes).toHaveLength(associatedNotes.length);
  expect(beforeDeletion.savedListItems).toHaveLength(associatedListItems.length);

  await page.getByRole('button', { name: 'Permanently Delete Garden' }).click();
  await page.getByRole('dialog', { name: 'Permanently delete Garden?' })
    .getByRole('button', { name: 'Permanently Delete Garden' }).click();
  await expect(page).toHaveURL('/gardens');
  await page.reload({ waitUntil: 'domcontentloaded' });

  const afterDeletion = await readGardenData(page);
  expect(afterDeletion.target).toBeUndefined();
  expect(afterDeletion.survivor).toMatchObject({
    id: survivingGarden.id,
    name: survivingGarden.name,
  });
  expect(afterDeletion.remainingGardenIds).toHaveLength(gardens.length - 1);
  expect(afterDeletion.remainingGardenIds).not.toContain(gardenToDelete.id);
  expect(afterDeletion.savedNotes.map(({ id, text, gardenId }) => ({ id, text, gardenId })))
    .toEqual(associatedNotes.map(({ id, text }) => ({ id, text, gardenId: null })));
  expect(afterDeletion.savedListItems.map(({
    id, kind, text, completed, quantity, notes: itemNotes, url, gardenId,
  }) => ({ id, kind, text, completed, quantity, notes: itemNotes, url, gardenId })))
    .toEqual(associatedListItems.map(({
      id, kind, text, completed, quantity, notes: itemNotes, url,
    }) => ({ id, kind, text, completed, quantity, notes: itemNotes, url, gardenId: null })));

  await page.goto('/notes');
  await expandNotesAccordion(page, 'notes');
  for (const note of associatedNotes) {
    await expect(page.locator('[data-notes-group="notes"]')
      .locator(`a[href="/notes/${note.id}"]`)).toBeVisible();
  }
  await page.goto('/tasks');
  await expandListsAccordion(page, 'task');
  for (const item of associatedListItems.filter(({ kind }) => kind === 'task')) {
    await expect(page.locator(`[data-list-item-id="${item.id}"]`)).toBeVisible();
  }
  await page.goto('/wishlist');
  await expandListsAccordion(page, 'wishlist');
  for (const item of associatedListItems.filter(({ kind }) => kind === 'wishlist')) {
    await expect(page.locator(`[data-list-item-id="${item.id}"]`)).toBeVisible();
  }
});
