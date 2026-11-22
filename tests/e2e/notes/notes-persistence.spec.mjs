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

function savedNoteLink(page, href) {
  return page.locator(`[aria-label="Saved Notes"] a[href="${href}"]`);
}

test('creates a Note and keeps its content after reload and reopening', async ({ page }) => {
  const text = `Playwright Note ${Date.now()}\nCreated and saved in an isolated browser context.`;

  await page.goto('/notes');
  await page.getByRole('link', { name: 'New Note' }).click();
  await expect(page.getByRole('heading', { name: 'Capture a Note' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Note' }).fill(text);
  await page.getByRole('button', { name: 'Save Note' }).click();
  await expect(page).toHaveURL('/notes');

  const createdNote = page.locator('[aria-label="Saved Notes"] .note-card').filter({ hasText: text });
  const createdNoteLink = createdNote.getByRole('link');
  await expect(createdNoteLink.locator('.note-card__preview')).toHaveText(text);
  const noteHref = await createdNoteLink.getAttribute('href');
  expect(noteHref).toMatch(/^\/notes\/[0-9a-f-]+$/);

  await page.reload();
  const persistedNoteLink = savedNoteLink(page, noteHref);
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
  await page.getByRole('button', { name: 'Save Note' }).click();
  await expect(page).toHaveURL('/notes');

  await expect(savedNoteLink(page, noteHref).locator('.note-card__preview')).toHaveText(updatedText);
  await page.reload();
  await savedNoteLink(page, noteHref).click();
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

  const cancelledDiscard = page.waitForEvent('dialog');
  await Promise.all([
    cancelledDiscard.then(async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toBe('Discard this recoverable draft?');
      await dialog.dismiss();
    }),
    page.getByRole('button', { name: 'Discard draft' }).click(),
  ]);
  await expect(editor).toHaveValue(updatedText);
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

  await expect(editor).toHaveValue(existingNote.text);
  await expect(page.getByRole('status')).toHaveText('All changes saved');
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Note' })).toHaveValue(existingNote.text);
  await page.goto('/notes');
  await expect(savedNoteLink(page, noteHref).locator('.note-card__preview')).toHaveText(existingNote.text);
  await expect(
    page.locator('section[aria-labelledby="notes-drafts-title"]')
      .getByRole('link', { name: /Unsaved Playwright edit/ }),
  ).toHaveCount(0);
});
