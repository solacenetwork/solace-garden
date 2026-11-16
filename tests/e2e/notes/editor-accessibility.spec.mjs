import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

// Use an existing non-empty new Note draft from the fixture. Keep the fixture
// authoritative rather than copying a UUID that would become stale on recapture.
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

const cases = [
  { width: 1366, height: 650 },
  { width: 1366, height: 600 },
];

async function openDraft(page, viewport, mode) {
  await page.setViewportSize(viewport);
  await page.addInitScript(preference => {
    localStorage.setItem('solace-garden.interface-mode', preference);
  }, mode);
  await page.goto(`/notes/new/${draft.id}`);
  await expect(page.locator('.app-shell')).toHaveAttribute('data-interface-mode', mode);
  await expect(page.getByRole('heading', { name: 'Capture a Note' })).toBeVisible();
  await expect(page.locator('#note-text')).toHaveValue(draft.text);
  const save = page.getByRole('button', { name: 'Save Note' });
  await expect(save).toBeEnabled();
  return save;
}

async function visibility(page, selector) {
  return page.locator(selector).evaluate(element => {
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
      activeElement: { tag: document.activeElement?.tagName, id: document.activeElement?.id, text: document.activeElement?.textContent?.trim().slice(0, 80) },
      hitElement: { tag: hit?.tagName, id: hit?.id },
    };
  });
}

async function attachDiagnostics(testInfo, page, description) {
  const state = await visibility(page, '.note-editor__primary-actions button[type="submit"]');
  await testInfo.attach('note-editor-' + description + '.json', {
    body: JSON.stringify(state, null, 2),
    contentType: 'application/json',
  });
}

for (const mode of ['standard', 'simple']) {
  for (const viewport of cases) {
    test(`Note editor wheel scroll reaches Save in ${mode} at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
      await openDraft(page, viewport, mode);

      // Point at page padding outside the textarea, which has its own scroll
      // behavior. Use ordinary incremental wheel events, not scrollIntoView().
      const main = await page.locator('#main-content').boundingBox();
      expect(main).not.toBeNull();
      const x = Math.min(viewport.width - 12, Math.max(12, main.x + main.width - 12));
      const y = Math.min(viewport.height - 24, Math.max(170, main.y + 110));
      await page.mouse.move(x, y);
      for (let i = 0; i < 12; i++) {
        await page.mouse.wheel(0, 180);
      }

      const state = await visibility(page, '.note-editor__primary-actions button[type="submit"]');
      if (!state.reachable) await attachDiagnostics(testInfo, page, 'wheel');
      expect(state.reachable, `Save Note is unreachable after wheel scrolling: ${JSON.stringify(state)}`).toBe(true);
    });

    test(`Note editor Tab navigation reveals Save in ${mode} at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
      await openDraft(page, viewport, mode);

      // Start from the textarea and traverse the actual form, rather than
      // directly focusing Save with a locator API.
      const input = page.locator('#note-text');
      await input.focus();
      await expect(input).toBeFocused();

      const targets = [
        '#note-garden',
        '.note-editor__actions button.theme-danger',
        '.note-editor__primary-actions button[type="button"]',
        '.note-editor__primary-actions button[type="submit"]',
      ];

      for (const selector of targets) {
        await page.keyboard.press('Tab');
        await expect(page.locator(selector)).toBeFocused();
      }

      const state = await visibility(page, targets.at(-1));
      if (!state.reachable) await attachDiagnostics(testInfo, page, 'keyboard');
      expect(state.reachable, `Tab focused Save Note but did not reveal it: ${JSON.stringify(state)}`).toBe(true);

      // Do not activate Save here: this is a focus and access test, not a
      // mutation test. Save remains enabled and the source fixture is intact.
      await expect(page.locator(targets.at(-1))).toBeEnabled();
    });
  }
}
