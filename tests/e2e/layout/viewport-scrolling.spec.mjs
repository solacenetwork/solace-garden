import { test, expect } from '@playwright/test';

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

async function openPage(page, route, mode, firstPage) {
  if (firstPage) {
    await page.goto(route);
    await page.evaluate(selectedMode => {
      localStorage.setItem('solace-garden.interface-mode', selectedMode);
    }, mode);
    await page.reload();
  } else {
    await page.evaluate(selectedMode => {
      localStorage.setItem('solace-garden.interface-mode', selectedMode);
    }, mode);
    await page.goto(route);
  }
  await expect(page.locator('.app-shell')).toHaveAttribute('data-interface-mode', mode);
}

async function scrollToBottomTarget(page, entry, viewport) {
  await expect(page.locator(entry.ready).first()).toBeVisible();
  const target = page.locator(entry.bottomTarget).last();
  await expect(target).toBeAttached();

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
    return area > 0
      && visibleWidth * visibleHeight / area >= 0.5
      && !!hit && (hit === element || element.contains(hit));
  });

  await expect.poll(measure, {
    message: `Bottom target not reachable: ${entry.route}`,
    timeout: 4000,
    intervals: [100, 200, 400],
  }).toBe(true);
}

test('Simple and Standard layouts keep bottom controls reachable on a short desktop viewport', async ({ page }) => {
  const viewport = { width: 1280, height: 600 };
  await page.setViewportSize(viewport);
  let firstPage = true;

  for (const mode of ['simple', 'standard']) {
    for (const entry of pages) {
      await openPage(page, entry.route, mode, firstPage);
      firstPage = false;
      await scrollToBottomTarget(page, entry, viewport);
    }
  }
});

test('Mobile-width layout keeps bottom controls reachable across populated routes', async ({ page }) => {
  const viewport = { width: 390, height: 844 };
  await page.setViewportSize(viewport);
  let firstPage = true;

  for (const entry of pages) {
    await openPage(page, entry.route, 'simple', firstPage);
    firstPage = false;
    await scrollToBottomTarget(page, entry, viewport);
  }
});
