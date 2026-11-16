import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/fixtures/sample-garden.json' });

// Regression coverage for 2026-11-16 report: page-bottom actions/items
// cannot be reached at normal browser zoom in Chromium.
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

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1280, height: 600 },
]) {
  for (const entry of pages) {
    test(`${entry.route} bottom control is reachable at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto(entry.route);
      await expect(page.locator(entry.ready).first()).toBeVisible();

      const target = page.locator(entry.bottomTarget).last();
      await expect(target).toBeAttached();

      // Simulate normal downward mouse-wheel scrolling in the main workspace.
      // Do not use scrollIntoView(): it can bypass a broken scroll layout.
      const main = await page.locator('#main-content').boundingBox();
      expect(main, 'Main workspace should have a measurable layout').not.toBeNull();
      await page.mouse.move(
        Math.min(viewport.width - 10, main.x + main.width / 2),
        Math.min(viewport.height - 10, Math.max(10, main.y + Math.min(main.height / 2, 250))),
      );
      await page.mouse.wheel(0, 12000);

      const diagnostics = await expect.poll(async () => target.evaluate(element => {
        const rect = element.getBoundingClientRect();
        const viewWidth = document.documentElement.clientWidth;
        const viewHeight = document.documentElement.clientHeight;
        const visibleX = Math.max(0, Math.min(rect.right, viewWidth) - Math.max(rect.left, 0));
        const visibleY = Math.max(0, Math.min(rect.bottom, viewHeight) - Math.max(rect.top, 0));
        const visibleArea = visibleX * visibleY;
        const area = rect.width * rect.height;
        const x = Math.max(0, Math.min(viewWidth - 1, (Math.max(0, rect.left) + Math.min(viewWidth, rect.right)) / 2));
        const y = Math.max(0, Math.min(viewHeight - 1, (Math.max(0, rect.top) + Math.min(viewHeight, rect.bottom)) / 2));
        const hit = document.elementFromPoint(x, y);

        return {
          reachable: area > 0 && visibleArea / area >= 0.5 && !!hit && (element === hit || element.contains(hit)),
          rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
          viewport: { width: viewWidth, height: viewHeight },
          documentScroll: {
            top: document.scrollingElement.scrollTop,
            height: document.scrollingElement.scrollHeight,
            clientHeight: document.scrollingElement.clientHeight,
          },
        };
      }), { timeout: 4000, intervals: [100, 200, 400] }).toMatchObject({ reachable: true });

      // The assertion above intentionally fails while the reported defect is present.
      // Do not click Delete: this test must not change the seeded records.
      void diagnostics;
    });
  }
}
