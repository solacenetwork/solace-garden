import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const fixture = JSON.parse(readFileSync(new URL('../../fixtures/sample-garden.json', import.meta.url), 'utf8'));
const origin = fixture.origins.find(entry => entry.origin === 'http://localhost:5173');
const gardenDb = origin?.indexedDB?.find(db => db.name.startsWith('solace-garden-data-'));
const draftStore = gardenDb?.stores?.find(store => store.name === 'drafts');
const draft = draftStore?.records
  ?.map(entry => entry.value)
  .find(record => record.kind === 'note' && record.isNew && record.text?.trim());

if (!draft) {
  throw new Error('sample-garden.json must contain a non-empty new Note draft.');
}

test.use({ storageState: 'tests/fixtures/sample-garden.json' });

async function visibility(page) {
  return page.locator('.note-editor__primary-actions button[type="submit"]').evaluate(element => {
    const rect = element.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    const clipped = rect.top < 0 || rect.bottom > height || rect.left < 0 || rect.right > width;
    const x = Math.max(0, Math.min(width - 1, (Math.max(0, rect.left) + Math.min(width, rect.right)) / 2));
    const y = Math.max(0, Math.min(height - 1, (Math.max(0, rect.top) + Math.min(height, rect.bottom)) / 2));
    const hit = document.elementFromPoint(x, y);
    const scrollRoot = document.scrollingElement;
    return {
      reachable: !clipped && !!hit && (hit === element || element.contains(hit)),
      rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
      viewport: { width, height, devicePixelRatio: window.devicePixelRatio },
      scrollRoot: { top: scrollRoot.scrollTop, height: scrollRoot.scrollHeight, clientHeight: scrollRoot.clientHeight },
      activeElement: { tag: document.activeElement?.tagName, id: document.activeElement?.id },
      hitElement: { tag: hit?.tagName, id: hit?.id },
    };
  });
}

async function openDraft(page, mode, firstPage) {
  if (firstPage) {
    await page.goto(`/notes/new/${draft.id}`);
    await page.evaluate(selectedMode => {
      localStorage.setItem('solace-garden.interface-mode', selectedMode);
    }, mode);
    await page.reload();
  } else {
    await page.evaluate(selectedMode => {
      localStorage.setItem('solace-garden.interface-mode', selectedMode);
    }, mode);
    await page.goto(`/notes/new/${draft.id}`);
  }
  await expect(page.locator('.app-shell')).toHaveAttribute('data-interface-mode', mode);
  await expect(page.getByRole('heading', { name: 'Capture a Note' })).toBeVisible();
  await expect(page.locator('#note-text')).toHaveValue(draft.text);
}

test('Note editor wheel and Tab navigation reveal Save in both layouts at short desktop height', async ({ page }) => {
  const viewport = { width: 1366, height: 600 };
  await page.setViewportSize(viewport);
  let firstPage = true;

  for (const mode of ['standard', 'simple']) {
    await openDraft(page, mode, firstPage);
    firstPage = false;

    const save = page.locator('.note-editor__primary-actions button[type="submit"]');
    await expect(save).toBeEnabled();

    const main = await page.locator('#main-content').boundingBox();
    expect(main).not.toBeNull();
    await page.mouse.move(
      Math.min(viewport.width - 12, Math.max(12, main.x + main.width - 12)),
      Math.min(viewport.height - 24, Math.max(170, main.y + 110)),
    );
    for (let index = 0; index < 12; index++) {
      await page.mouse.wheel(0, 180);
    }

    let state = await visibility(page);
    expect(state.reachable, `Save Note is unreachable after wheel scrolling in ${mode}: ${JSON.stringify(state)}`).toBe(true);

    const input = page.locator('#note-text');
    await input.focus();
    await expect(input).toBeFocused();
    for (const selector of [
      '#note-garden',
      '.note-editor__actions button.theme-danger',
      '.note-editor__primary-actions button[type="button"]',
      '.note-editor__primary-actions button[type="submit"]',
    ]) {
      await page.keyboard.press('Tab');
      await expect(page.locator(selector)).toBeFocused();
    }

    state = await visibility(page);
    expect(state.reachable, `Tab focused Save Note but did not reveal it in ${mode}: ${JSON.stringify(state)}`).toBe(true);
    await expect(save).toBeEnabled();
  }
});
