import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const storageState = JSON.parse(readFileSync(
  new URL('../../fixtures/sample-garden.json', import.meta.url),
  'utf8',
));
const origin = storageState.origins.find(entry => entry.origin === 'http://localhost:5173');
const gardenDatabase = origin?.indexedDB?.find(db => db.name.startsWith('solace-garden-data-'));
const notesStore = gardenDatabase?.stores?.find(store => store.name === 'notes');
const existingNote = notesStore?.records?.map(entry => entry.value).find(note => note.text?.trim());

if (!existingNote) {
  throw new Error('sample-garden.json must contain a saved Note for persistence tests.');
}

test.use({ storageState });

function notesAccordion(page, groupId) {
  return page.locator(`[data-notes-group="${groupId}"]`);
}

async function expandNotesAccordion(accordion) {
  const details = accordion.locator('details');
  if (!await details.evaluate(element => element.open)) {
    await accordion.locator('summary').click();
    await expect(details).toHaveJSProperty('open', true);
  }
}

function savedNoteLink(page, note) {
  const groupId = note.gardenId ?? 'notes';
  return notesAccordion(page, groupId).locator(`a[href="/notes/${note.id}"]`);
}

async function readDrafts(page) {
  return page.evaluate(async () => {
    const requestResult = request => new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const configDatabase = await requestResult(indexedDB.open('solace-config'));
    const configuration = await requestResult(
      configDatabase.transaction('configuration', 'readonly')
        .objectStore('configuration')
        .get('main'),
    );
    configDatabase.close();

    const database = await requestResult(indexedDB.open(configuration.activeDatabase));
    try {
      return await requestResult(database.transaction('drafts', 'readonly')
        .objectStore('drafts')
        .getAll());
    } finally {
      database.close();
    }
  });
}

test('creates a Note and keeps its content after reload and reopening', async ({ page }) => {
  const text = `Playwright Note ${Date.now()}\nCreated and saved in an isolated browser context.`;

  await page.goto('/notes');
  await expandNotesAccordion(notesAccordion(page, 'notes'));
  const draftsBefore = await readDrafts(page);
  await page.getByRole('link', { name: 'New Note' }).click();
  await expect(page).toHaveURL('/notes/new');
  await expect(page.getByRole('heading', { name: 'Capture a Note' })).toBeVisible();
  expect((await readDrafts(page)).map(({ id }) => id).sort())
    .toEqual(draftsBefore.map(({ id }) => id).sort());

  await page.getByRole('textbox', { name: 'Note' }).fill(text);
  await expect(page).toHaveURL(/\/notes\/new\/[0-9a-f-]{36}$/i);
  const draftId = new URL(page.url()).pathname.split('/').at(-1);
  expect(await readDrafts(page)).toContainEqual(expect.objectContaining({
    id: draftId,
    kind: 'note',
    isNew: true,
    subjectId: null,
    gardenId: null,
    text,
  }));

  await page.getByRole('button', { name: 'Save Note' }).click();
  await expect(page).toHaveURL('/notes');
  expect((await readDrafts(page)).some(({ id }) => id === draftId)).toBe(false);

  const applicationNotes = notesAccordion(page, 'notes');
  await expandNotesAccordion(applicationNotes);
  const createdNote = applicationNotes.locator('.note-card').filter({ hasText: text });
  const createdNoteLink = createdNote.getByRole('link');
  await expect(createdNoteLink.locator('.note-card__preview')).toHaveText(text);
  const note = { id: (await createdNoteLink.getAttribute('href')).split('/').at(-1), gardenId: null };
  expect(note.id).toMatch(/^[0-9a-f-]{36}$/i);

  await page.reload();
  const savedGroup = notesAccordion(page, 'notes');
  await expandNotesAccordion(savedGroup);
  const persistedNoteLink = savedNoteLink(page, note);
  await expect(persistedNoteLink.locator('.note-card__preview')).toHaveText(text);
  await persistedNoteLink.click();
  await expect(page.getByRole('textbox', { name: 'Note' })).toHaveValue(text);
});

test('saves edits to an existing Note and persists the updated content after reload', async ({ page }) => {
  const noteHref = `/notes/${existingNote.id}`;
  const updatedText = `${existingNote.text}\n\nPlaywright edit ${Date.now()}.`;

  await page.goto(noteHref);
  const editor = page.getByRole('textbox', { name: 'Note' });
  await expect(editor).toHaveValue(existingNote.text);
  await editor.fill(updatedText);
  await expect(page.getByRole('status')).toHaveText('Draft saved locally');
  const editDrafts = (await readDrafts(page)).filter(({ subjectId }) => subjectId === existingNote.id);
  expect(editDrafts).toHaveLength(1);
  const editDraftId = editDrafts[0].id;
  await page.getByRole('button', { name: 'Save Note' }).click();
  await expect(page).toHaveURL('/notes');
  expect((await readDrafts(page)).some(({ id }) => id === editDraftId)).toBe(false);

  const notesGroup = notesAccordion(page, existingNote.gardenId ?? 'notes');
  await expandNotesAccordion(notesGroup);
  await expect(savedNoteLink(page, existingNote).locator('.note-card__preview')).toHaveText(updatedText);
  await page.reload();
  await expandNotesAccordion(notesAccordion(page, existingNote.gardenId ?? 'notes'));
  await savedNoteLink(page, existingNote).click();
  await expect(page.getByRole('textbox', { name: 'Note' })).toHaveValue(updatedText);
});

test('cancels draft discard without losing edits, then discards without changing the saved Note', async ({ page }) => {
  const noteHref = `/notes/${existingNote.id}`;
  const updatedText = `${existingNote.text}\n\nUnsaved Playwright edit ${Date.now()}.`;

  await page.goto(noteHref);
  const editor = page.getByRole('textbox', { name: 'Note' });
  await expect(editor).toHaveValue(existingNote.text);
  await editor.fill(updatedText);
  await expect(page.getByRole('status')).toHaveText('Draft saved locally');
  const editDrafts = (await readDrafts(page)).filter(({ subjectId }) => subjectId === existingNote.id);
  expect(editDrafts).toHaveLength(1);
  const editDraft = editDrafts[0];

  await page.getByRole('button', { name: 'Back to Notes' }).click();
  await expect(page).toHaveURL('/notes');
  const draftsAccordion = notesAccordion(page, 'drafts');
  const draftsDetails = draftsAccordion.locator('details');
  await expect(draftsDetails).toHaveJSProperty('open', true);
  const resumedDraft = draftsAccordion.locator(`[data-draft-id="${editDraft.id}"]`);
  await expect(resumedDraft).toBeVisible();
  await expect(resumedDraft).toHaveClass(/notes-draft-row--highlighted/);
  await resumedDraft.click();
  await expect(page).toHaveURL(noteHref);
  const resumedEditor = page.getByRole('textbox', { name: 'Note' });
  await expect(resumedEditor).toHaveValue(updatedText);

  const cancelledDiscard = page.waitForEvent('dialog');
  await Promise.all([
    cancelledDiscard.then(async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toBe('Discard this recoverable draft?');
      await dialog.dismiss();
    }),
    page.getByRole('button', { name: 'Discard draft' }).click(),
  ]);
  await expect(resumedEditor).toHaveValue(updatedText);
  await expect(page.getByRole('status')).toHaveText('Draft saved locally');

  const confirmedDiscard = page.waitForEvent('dialog');
  await Promise.all([
    confirmedDiscard.then(async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toBe('Discard this recoverable draft?');
      await dialog.accept();
    }),
    page.getByRole('button', { name: 'Discard draft' }).click(),
  ]);

  await expect(resumedEditor).toHaveValue(existingNote.text);
  await expect(page.getByRole('status')).toHaveText('All changes saved');
  expect((await readDrafts(page)).some(({ id }) => id === editDraft.id)).toBe(false);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Note' })).toHaveValue(existingNote.text);
  await page.goto('/notes');
  const notesGroup = notesAccordion(page, existingNote.gardenId ?? 'notes');
  await expandNotesAccordion(notesGroup);
  await expect(savedNoteLink(page, existingNote).locator('.note-card__preview')).toHaveText(existingNote.text);
  const unfinishedDrafts = notesAccordion(page, 'drafts');
  await expandNotesAccordion(unfinishedDrafts);
  await expect(unfinishedDrafts.locator(`[data-draft-id="${editDraft.id}"]`)).toHaveCount(0);
});
