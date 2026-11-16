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

gardensStore.records = gardens.map(({ id, name, status, isClosed }) => ({
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
    icon: null,
    color: null,
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
      description: '',
      locationId: 'system-default-location',
      typeIds: [],
      startDate: '',
      endDate: '',
    },
    sourceTemplateId: null,
    preferredEditor: 'advanced',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
}];

test.use({ storageState });

test('classifies Gardens and keeps Drafts in their own ordered section', async ({ page }) => {
  await page.goto('/gardens');

  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Draft Gardens',
    'Current Gardens',
    'Planned Gardens',
    'Previous Gardens',
  ]);

  const sections = {
    drafts: page.getByRole('region', { name: 'Draft Gardens' }),
    current: page.getByRole('region', { name: 'Current Gardens' }),
    planned: page.getByRole('region', { name: 'Planned Gardens' }),
    previous: page.getByRole('region', { name: 'Previous Gardens' }),
  };
  const savedSections = [sections.current, sections.planned, sections.previous];

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
        await expect(section.getByRole('link', { name: garden.name })).toHaveCount(0);
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
    await expect(section.getByRole('link', { name: draft.name })).toHaveCount(0);
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
  await expect(managementLinks.nth(0)).toHaveAttribute('href', '/locations');
  await expect(managementLinks.nth(1)).toHaveAttribute('href', '/templates');
  await expect(managementLinks.nth(2)).toHaveAttribute('href', '/gardens/new');

  const standardNav = page.getByRole('navigation', { name: 'Standard Mode workspaces' });
  await expect(standardNav.getByRole('link', { name: 'Templates' })).toHaveCount(0);

  await managementLinks.nth(1).click();
  await expect(page).toHaveURL(/\/templates$/);
  await expect(page.getByRole('heading', { name: 'Templates', level: 1 })).toBeVisible();
});
