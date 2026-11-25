import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const storageState = JSON.parse(readFileSync(
  new URL('../../fixtures/sample-garden.json', import.meta.url),
  'utf8',
));
const origin = storageState.origins.find(entry => entry.origin === 'http://localhost:5173');
const gardenDatabase = origin?.indexedDB?.find(db => db.name.startsWith('solace-garden-data-'));
const gardensStore = gardenDatabase?.stores?.find(store => store.name === 'gardens');
const draftsStore = gardenDatabase?.stores?.find(store => store.name === 'drafts');

if (!gardensStore || !draftsStore) {
  throw new Error('sample-garden.json must contain the Gardens and Drafts IndexedDB stores.');
}

const gardens = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Synthetic Open Active Garden',
    status: 'active',
    isClosed: false,
    icon: 'tree-fill',
    color: '#287D46',
    section: 'Current Gardens',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'Synthetic Open Planned Garden',
    status: 'planned',
    isClosed: false,
    section: 'Planned Gardens',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    name: 'Synthetic Closed Active Garden',
    status: 'active',
    isClosed: true,
    section: 'Previous Gardens',
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    name: 'Synthetic Closed Planned Garden',
    status: 'planned',
    isClosed: true,
    section: 'Previous Gardens',
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    name: 'Synthetic Completed Garden',
    status: 'completed',
    isClosed: false,
    section: 'Previous Gardens',
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    name: 'Synthetic Archived Garden',
    status: 'archived',
    isClosed: true,
    section: 'Previous Gardens',
  },
];
const draft = {
  id: '00000000-0000-4000-8000-000000000007',
  name: 'Synthetic Garden Draft',
};
const timestamp = '2026-01-02T03:04:05.000Z';

gardensStore.records = gardens.map(({ id, name, status, isClosed, icon = null, color = null }) => ({
  value: {
    id,
    name,
    subtitle: null,
    description: null,
    typeIds: [],
    locationId: 'system-default-location',
    startDate: null,
    endDate: null,
    notes: null,
    status,
    isClosed,
    icon,
    color,
    thumbnailMediaId: null,
    layoutMediaId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
}));
draftsStore.records = [{
  value: {
    id: draft.id,
    kind: 'garden',
    subjectId: null,
    isNew: true,
    fields: {
      name: draft.name,
      subtitle: '',
      icon: null,
      color: null,
      description: '',
      locationId: 'system-default-location',
      typeIds: [],
      startDate: '',
      endDate: '',
      status: 'planned',
      isClosed: false,
      saveAsTemplate: false,
    },
    sourceTemplateId: null,
    preferredEditor: 'advanced',
    currentStepId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
}];

test.use({ storageState });

test('classifies Gardens and keeps Drafts in their own ordered section', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/gardens');

  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Draft Gardens',
    'Current Gardens',
    'Planned Gardens',
    'Previous Gardens',
  ]);

  const sections = {
    drafts: page.locator('section[aria-labelledby="garden-drafts-title"]'),
    current: page.locator('section[aria-labelledby="current-gardens"]'),
    planned: page.locator('section[aria-labelledby="planned-gardens"]'),
    previous: page.locator('section[aria-labelledby="previous-gardens"]'),
  };
  const savedSections = [sections.current, sections.planned, sections.previous];

  for (const section of savedSections) {
    await expect(section.locator('[data-presentation="filmstrip"]')).toHaveCount(1);
    await expect(section.locator('.card-carousel')).toHaveCount(1);
  }

  for (const garden of gardens) {
    const targetSection = sections[
      garden.section === 'Current Gardens' ? 'current'
        : garden.section === 'Planned Gardens' ? 'planned'
          : 'previous'
    ];
    const card = targetSection.getByRole('link', { name: garden.name });
    await expect(card).toHaveCount(1);
    await expect(card).toHaveAttribute('href', `/gardens/${garden.id}`);

    for (const section of savedSections) {
      if (section !== targetSection) {
        expect(await section.getByRole('link', { name: garden.name }).count()).toBe(0);
      }
    }
  }

  const resumeLink = sections.drafts.getByRole('link', { name: draft.name });
  await expect(resumeLink).toHaveCount(1);
  await expect(resumeLink).toHaveAttribute(
    'href',
    `/gardens/new/advanced/${draft.id}`,
  );
  for (const section of savedSections) {
    expect(await section.getByRole('link', { name: draft.name }).count()).toBe(0);
  }

  await expect(sections.drafts.locator('.card-carousel')).toHaveCount(1);
  await expect(sections.drafts.getByRole('link', { name: 'View All' })).toHaveAttribute('href', '/gardens/drafts');
  await expect(sections.drafts.getByRole('button', { name: 'Discard Draft' })).toHaveCount(1);

  const currentLink = sections.current.getByRole('link', { name: gardens[0].name });
  await expect(currentLink.locator('.garden-card__identity .bi-tree-fill')).toHaveCount(1);

  await sections.previous.getByRole('button', { name: 'View All' }).click();
  await expect(sections.previous.locator('[data-presentation="grid"]')).toHaveCount(1);
  await expect(sections.previous.locator('.card-carousel')).toHaveCount(0);
  await expect(sections.previous.getByRole('button', { name: 'Collapse' })).toHaveAttribute('aria-expanded', 'true');
  await expect(sections.planned.locator('[data-presentation="filmstrip"]')).toHaveCount(1);
  await expect(sections.current.locator('[data-presentation="filmstrip"]')).toHaveCount(1);
  await expect(sections.previous.locator('.gardens-collection__grid .garden-card--saved')).toHaveCount(
    gardens.filter(garden => garden.section === 'Previous Gardens').length,
  );

  await sections.previous.getByRole('button', { name: 'Collapse' }).click();
  await expect(sections.previous.locator('[data-presentation="filmstrip"] .card-carousel')).toHaveCount(1);
});

test('saved collection controls retain focus and restored carousels scroll in both interface modes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/gardens');

  for (const mode of ['simple', 'standard']) {
    await page.evaluate((selectedMode) => {
      localStorage.setItem('solace-garden.interface-mode', selectedMode);
    }, mode);
    await page.reload();
    await expect(page.locator('.app-shell')).toHaveAttribute('data-interface-mode', mode);

    const previous = page.locator('section[aria-labelledby="previous-gardens"]');
    const toggle = previous.getByRole('button', { name: 'View All' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    const collapse = previous.getByRole('button', { name: 'Collapse' });
    await expect(collapse).toBeFocused();
    await expect(previous.locator('.gardens-collection__grid .garden-card--saved')).toHaveCount(4);

    await page.keyboard.press('Space');
    const restoredToggle = previous.getByRole('button', { name: 'View All' });
    await expect(restoredToggle).toBeFocused();
    const viewport = previous.locator('.card-carousel__viewport');
    await expect.poll(() => viewport.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);

    const next = previous.getByRole('button', { name: 'Next cards in Previous Gardens' });
    await expect(next).toBeVisible();
    const initialScroll = await viewport.evaluate(element => element.scrollLeft);
    await next.click();
    await expect.poll(() => viewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(initialScroll);
  }
});

test('Garden management links appear in order and Templates stays reachable outside Standard navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => {
    localStorage.setItem('solace-garden.interface-mode', 'standard');
  });
  await page.goto('/gardens');

  await expect(page.locator('.app-shell')).toHaveAttribute('data-interface-mode', 'standard');
  const managementNav = page.getByRole('navigation', { name: 'Garden management' });
  const managementLinks = managementNav.getByRole('link');
  await expect(managementLinks).toHaveText(['Locations', 'Templates', 'Create Garden']);
  await expect(managementLinks.nth(0)).toHaveAttribute('href', '/locations?ref=gardens');
  await expect(managementLinks.nth(1)).toHaveAttribute('href', '/templates');
  await expect(managementLinks.nth(2)).toHaveAttribute('href', '/gardens/new');

  const standardNav = page.getByRole('navigation', { name: 'Standard Mode workspaces' });
  await expect(standardNav.getByRole('link', { name: 'Templates' })).toHaveCount(0);

  await managementLinks.nth(1).click();
  await expect(page).toHaveURL(/\/templates$/);
  await expect(page.getByRole('heading', { name: 'Templates', level: 1 })).toBeVisible();
});
