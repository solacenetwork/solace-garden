import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/fixtures/sample-garden.json' });

const pages = [
  {
    route: '/gardens',
    ready: '.gardens-section .garden-card--saved',
    bottomTarget: 'section[aria-labelledby="previous-gardens"] .garden-card--saved',
    overflowTarget: 'section[aria-labelledby="previous-gardens"] .gardens-section__heading button',
  },
  {
    route: '/tasks',
    accordion: 'task',
    ready: '.lists-list[aria-label="Outstanding Tasks"] [data-list-item]',
    bottomTarget: '[data-lists-group="task"] .lists-list[aria-label="Completed"] [data-list-item]:last-child button.theme-danger',
  },
  {
    route: '/wishlist',
    accordion: 'wishlist',
    ready: '.lists-list[aria-label="Outstanding Wish List"] [data-list-item]',
    bottomTarget: '[data-lists-group="wishlist"] .lists-list[aria-label="Purchased"] [data-list-item]:last-child button.theme-danger',
  },
  {
    route: '/notes',
    accordion: 'notes',
    ready: '[data-notes-group="notes"] .note-card',
    bottomTarget: '[data-notes-group="notes"] .note-card:last-child button.note-card__delete',
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
  const accordion = entry.accordion
    ? page.locator(`[data-${entry.accordion === 'notes' ? 'notes' : 'lists'}-group="${entry.accordion}"]`)
    : null;
  if (entry.accordion === 'notes') {
    await expect(accordion).toBeVisible();
  } else {
    await expect(page.locator(entry.ready).first()).toBeVisible();
  }
  if (entry.accordion) {
    const details = accordion.locator('details');
    const summary = accordion.locator('summary');
    if (!await details.evaluate(element => element.open)) {
      await summary.click();
      await expect(details).toHaveJSProperty('open', true);
    }
  }
  await expect(page.locator(entry.ready).first()).toBeVisible();
  let target = page.locator(entry.bottomTarget).last();
  if (entry.overflowTarget) {
    const overflowTarget = page.locator(entry.overflowTarget).last();
    if (await overflowTarget.count()) target = overflowTarget;
  }
  await expect(target).toBeAttached();

  const main = await page.locator('#main-content').boundingBox();
  expect(main, 'Main workspace should have a measurable layout').not.toBeNull();
  const header = await page.locator('.app-header').boundingBox();
  expect(header, 'Sticky header should have a measurable layout').not.toBeNull();
  const wheelX = Math.min(viewport.width - 10, main.x + main.width / 2);
  const wheelY = Math.min(
    viewport.height - 10,
    Math.max(header.y + header.height + 8, main.y + Math.min(main.height / 2, 250)),
  );
  await page.mouse.move(wheelX, wheelY);
  await page.mouse.wheel(0, -12000);
  await expect.poll(
    () => page.evaluate(() => document.documentElement.scrollTop),
    { message: 'Route should begin at the top before measuring bottom reachability' },
  ).toBe(0);
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
