import { test, expect } from '@playwright/test';

// 2026-11-16 Chromium laptop report: bottom controls/items could not be
// reached at normal browser zoom. Force both supported presentation modes
// because users can select either mode at any viewport width.
test.use({ storageState: 'tests/fixtures/sample-garden.json' });

const pages = [
  {
    route: '/gardens',
    ready: '.gardens-grid .garden-card',
    bottomTarget: '.gardens-grid .garden-card:last-child',
  },
  {
    route: '/tasks',
    ready: '.lists-list [data-list-item]',
    bottomTarget: '.lists-list [data-list-item]:last-child button.theme-danger',
  },
  {
    route: '/wishlist',
    ready: '.lists-list [data-list-item]',
    bottomTarget: '.lists-list [data-list-item]:last-child button.theme-danger',
  },
  {
    route: '/notes',
    ready: '[aria-label="Saved Notes"] .note-card',
    bottomTarget: '[aria-label="Saved Notes"] .note-card:last-child button.note-card__delete',
  },
];

const viewports = [
  { width: 1366, height: 768 },
  { width: 1280, height: 600 },
  { width: 1024, height: 600 },
  { width: 800, height: 600 },
  { width: 768, height: 480 },
];

for (const mode of ['simple', 'standard']) {
  for (const viewport of viewports) {
    for (const entry of pages) {
      test(`${entry.route} bottom reachable in ${mode} at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
        await page.setViewportSize(viewport);
        await page.addInitScript(selectedMode => {
          localStorage.setItem('solace-garden.interface-mode', selectedMode);
        }, mode);
        await page.goto(entry.route);
        await expect(page.locator('.app-shell')).toHaveAttribute('data-interface-mode', mode);
        await expect(page.locator(entry.ready).first()).toBeVisible();

        const target = page.locator(entry.bottomTarget).last();
        await expect(target).toBeAttached();

        // Wheel scroll mimics a person using the page, rather than forcibly
        // scrolling an element into view through Playwright's locator API.
        const main = await page.locator('#main-content').boundingBox();
        expect(main, 'Main workspace should have a measurable layout').not.toBeNull();
        await page.mouse.move(
          Math.min(viewport.width - 10, main.x + main.width / 2),
          Math.min(viewport.height - 10, Math.max(10, main.y + Math.min(main.height / 2, 250))),
        );
        await page.mouse.wheel(0, 12000);

        const measure = () => target.evaluate(element => {
          const rect = element.getBoundingClientRect();
          const width = document.documentElement.clientWidth;
          const height = document.documentElement.clientHeight;
          const visibleWidth = Math.max(0, Math.min(rect.right, width) - Math.max(rect.left, 0));
          const visibleHeight = Math.max(0, Math.min(rect.bottom, height) - Math.max(rect.top, 0));
          const area = rect.width * rect.height;
          const x = Math.max(0, Math.min(width - 1, (Math.max(0, rect.left) + Math.min(width, rect.right)) / 2));
          const y = Math.max(0, Math.min(height - 1, (Math.max(0, rect.top) + Math.min(height, rect.bottom)) / 2));
          const hit = document.elementFromPoint(x, y);
          return {
            reachable: area > 0
              && visibleWidth * visibleHeight / area >= 0.5
              && !!hit && (hit === element || element.contains(hit)),
            targetRect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
            viewport: { width, height },
            scroll: {
              top: document.scrollingElement.scrollTop,
              height: document.scrollingElement.scrollHeight,
              visibleHeight: document.scrollingElement.clientHeight,
            },
            hitTag: hit?.tagName ?? null,
          };
        });

        const state = await measure();
        if (!state.reachable) {
          await testInfo.attach('viewport-diagnostics.json', {
            body: JSON.stringify({ route: entry.route, mode, requestedViewport: viewport, ...state }, null, 2),
            contentType: 'application/json',
          });
        }

        await expect.poll(async () => (await measure()).reachable, {
          message: `Bottom control not reachable: ${entry.route} in ${mode} ${viewport.width}x${viewport.height}`,
          timeout: 4000,
          intervals: [100, 200, 400],
        }).toBe(true);
      });
    }
  }
}
