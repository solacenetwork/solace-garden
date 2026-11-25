import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const storageState = JSON.parse(readFileSync(
  new URL('../../fixtures/sample-garden.json', import.meta.url),
  'utf8',
));
const origin = storageState.origins.find(({ origin: value }) => value === 'http://localhost:5173');
const database = origin?.indexedDB.find(({ name }) => name.startsWith('solace-garden-data-'));
const garden = database?.stores.find(({ name }) => name === 'gardens')
  ?.records.map(({ value }) => value).find(({ name }) => name === 'Flower Garden');
const note = database?.stores.find(({ name }) => name === 'notes')
  ?.records.map(({ value }) => value).find(({ text }) => text?.trim());

if (!garden || !note) {
  throw new Error('sample-garden.json must contain a Garden and a saved Note for navigation tests.');
}

test.use({ storageState });

function notesAccordion(page, note) {
  const groupId = note.gardenId ?? 'notes';
  return page.locator(`[data-notes-group="${groupId}"]`);
}

async function expandNotesAccordion(accordion) {
  const details = accordion.locator('details');
  if (!await details.evaluate(element => element.open)) {
    await accordion.locator('summary').click();
    await expect(details).toHaveJSProperty('open', true);
  }
}

const simpleDestinations = [
  { label: 'Gardens', href: '/gardens', heading: 'Gardens' },
  { label: 'Tasks', href: '/tasks', heading: 'Tasks' },
  { label: 'Journal', href: '/journal', heading: 'Journal' },
  { label: 'Calendar', href: '/calendar', heading: 'Calendar' },
  { label: 'Notes', href: '/notes', heading: 'Notes' },
  { label: 'Wishlist', href: '/wishlist', heading: 'Wish List' },
  { label: 'Plant DB', href: '/plants', heading: 'Plants' },
];

test('Simple navigation cards remain usable on desktop and mobile; logo and browser history return Home', async ({ page }) => {
  await page.addInitScript((mode) => {
    localStorage.setItem('solace-garden.interface-mode', mode);
    localStorage.setItem('solace-garden.show-welcome-at-startup', 'false');
  }, 'simple');

  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('.app-shell')).toHaveAttribute('data-interface-mode', 'simple');
    const navigation = page.getByRole('navigation', { name: 'Garden navigation' });
    await expect(navigation.getByRole('link')).toHaveCount(7);

    for (const destination of simpleDestinations) {
      const link = navigation.getByRole('link', { name: destination.label, exact: true });
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeInViewport();
      await link.click();
      await expect(page).toHaveURL(destination.href);
      await expect(page.getByRole('heading', { name: destination.heading, level: 1 })).toBeVisible();
      await page.getByRole('link', { name: 'SOLACE Garden — Home' }).click();
      await expect(page).toHaveURL('/');
    }

    const galleryLink = page.getByRole('link', { name: 'View Gallery placeholder' });
    await galleryLink.scrollIntoViewIfNeeded();
    await expect(galleryLink).toBeInViewport();
    await galleryLink.click();
    await expect(page).toHaveURL('/photos');
    await expect(page.getByRole('heading', { name: 'Photos', level: 1 })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL('/');

    await page.getByRole('link', { name: 'Journal', exact: true }).click();
    await expect(page).toHaveURL('/journal');
    await page.goBack();
    await expect(page).toHaveURL('/');
    await page.goForward();
    await expect(page).toHaveURL('/journal');
  }

  const keyboardPage = await page.context().newPage();
  await keyboardPage.setViewportSize({ width: 390, height: 844 });
  await keyboardPage.goto('/gardens');
  const homeLink = keyboardPage.getByRole('link', { name: 'SOLACE Garden — Home' });
  await homeLink.focus();
  await keyboardPage.keyboard.press('Enter');
  await expect(keyboardPage).toHaveURL('/');
  await expect(keyboardPage.getByRole('heading', { name: 'Where would you like to go?', level: 1 })).toBeVisible();
  await keyboardPage.keyboard.press('Tab');
  await expect(keyboardPage.getByRole('button', { name: 'Search' })).toBeFocused();
});

test('Standard desktop navigation reaches primary and global workspaces and preserves deep links', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript((mode) => {
    localStorage.setItem('solace-garden.interface-mode', mode);
  }, 'standard');
  await page.goto('/');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-interface-mode', 'standard');

  for (const destination of [
    { label: 'Gardens', href: '/gardens', heading: 'Gardens', nav: 'primary' },
    { label: 'Journal', href: '/journal', heading: 'Journal', nav: 'primary' },
    { label: 'Gallery', href: '/photos', heading: 'Photos', nav: 'primary' },
    { label: 'PlantDB', href: '/plants', heading: 'Plants', nav: 'primary' },
    { label: 'Tasks', href: '/tasks', heading: 'Tasks', nav: 'tool' },
    { label: 'Notes', href: '/notes', heading: 'Notes', nav: 'tool' },
    { label: 'Wish List', href: '/wishlist', heading: 'Wish List', nav: 'tool' },
    { label: 'Calendar', href: '/calendar', heading: 'Calendar', nav: 'tool' },
  ]) {
    let link;
    if (destination.nav === 'primary') {
      link = page.getByRole('navigation', { name: 'Standard Mode workspaces' })
        .getByRole('link', { name: destination.label, exact: true });
    } else {
      link = page.getByRole('link', { name: destination.label, exact: true });
      if (!await link.isVisible()) {
        await page.getByRole('button', { name: 'More' }).click();
        link = page.locator('#header-more-menu').getByRole('link', { name: destination.label, exact: true });
      }
    }
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(destination.href);
    await expect(page.getByRole('heading', { name: destination.heading, level: 1 })).toBeVisible();
    if (destination.nav === 'primary') {
      await expect(page.getByRole('navigation', { name: 'Standard Mode workspaces' })
        .getByRole('link', { name: destination.label, exact: true }))
        .toHaveAttribute('aria-current', 'page');
    }
  }

  await page.goto(`/gardens/${garden.id}`);
  await expect(page).toHaveURL(`/gardens/${garden.id}`);
  await expect(page.getByRole('heading', { name: garden.name, level: 1 })).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(`/gardens/${garden.id}`);
  await expect(page.getByRole('heading', { name: garden.name, level: 1 })).toBeVisible();

  await page.goto(`/notes/${note.id}`);
  await expect(page).toHaveURL(`/notes/${note.id}`);
  await expect(page.getByRole('textbox', { name: 'Note' })).toHaveValue(note.text);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(`/notes/${note.id}`);
  await expect(page.getByRole('textbox', { name: 'Note' })).toHaveValue(note.text);
});

test('More menu supports keyboard dismissal and exposes Help, About, and Settings; mode changes preserve route and data', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/notes');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-interface-mode', 'simple');

  const more = page.getByRole('button', { name: 'More' });
  await expect(more).toHaveAttribute('aria-controls', 'header-more-menu');
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await more.focus();
  await page.keyboard.press('Space');
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#header-more-menu').getByRole('link', { name: 'Help' })).toBeVisible();
  await expect(page.locator('#header-more-menu').getByRole('link', { name: 'About' })).toBeVisible();
  await expect(page.locator('#header-more-menu').getByRole('link', { name: 'Settings' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await expect(more).toBeFocused();

  await more.press('Enter');
  const help = page.locator('#header-more-menu').getByRole('link', { name: 'Help' });
  await expect(help).toBeVisible();
  await help.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/help');
  await expect(page.getByRole('heading', { name: 'Help', level: 1 })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL('/notes');

  await page.getByRole('button', { name: 'More' }).click();
  await page.locator('#header-more-menu').getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL('/about');
  await expect(page.getByRole('heading', { name: 'About', level: 1 })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL('/notes');

  await page.getByRole('button', { name: 'More' }).click();
  await page.locator('#header-more-menu').getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL('/settings?ref=notes');
  const settingsUrl = page.url();
  const standardMode = page.locator('#interface-mode-standard');
  await standardMode.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-interface-mode', 'standard');
  await expect(page).toHaveURL(settingsUrl);
  await expect(standardMode).toBeChecked();
  await page.getByRole('link', { name: 'Close', exact: true }).click();
  await expect(page).toHaveURL('/notes');
  await expect(page.getByRole('heading', { name: 'Notes', level: 1 })).toBeVisible();
  const savedNoteGroup = notesAccordion(page, note);
  await expandNotesAccordion(savedNoteGroup);
  const savedNoteLink = savedNoteGroup.locator(`a[href="/notes/${note.id}"]`);
  await expect(savedNoteLink).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.app-shell')).toHaveAttribute('data-interface-mode', 'standard');
  const reloadedNoteGroup = notesAccordion(page, note);
  await expandNotesAccordion(reloadedNoteGroup);
  await expect(reloadedNoteGroup.locator(`a[href="/notes/${note.id}"]`)).toBeVisible();
});

test('Standard phone and medium navigation Drawer stays in the viewport and restores focus', async ({ page }) => {
  await page.addInitScript((mode) => {
    localStorage.setItem('solace-garden.interface-mode', mode);
  }, 'standard');

  for (const viewport of [{ width: 390, height: 844 }, { width: 900, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto(`/gardens/${garden.id}`);
    await expect(page.locator('.app-shell')).toHaveAttribute('data-interface-mode', 'standard');

    const trigger = viewport.width < 768
      ? page.getByRole('button', { name: 'Navigation' })
      : page.getByRole('button', { name: 'Open navigation' });
    await expect(trigger).toBeInViewport();
    await expect(trigger).toHaveAttribute('aria-controls', 'standard-navigation-drawer');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.focus();
    await page.keyboard.press('Space');

    const drawer = page.getByRole('dialog', { name: 'Navigation' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Close Navigation' })).toBeFocused();
    const drawerBounds = await drawer.boundingBox();
    expect(drawerBounds).not.toBeNull();
    expect(drawerBounds.x).toBeGreaterThanOrEqual(0);
    expect(drawerBounds.x + drawerBounds.width).toBeLessThanOrEqual(viewport.width);
    const journalLink = drawer.getByRole('link', { name: 'Journal', exact: true });
    await expect(journalLink).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();

    await trigger.press('Enter');
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: 'Journal', exact: true }).click();
    await expect(page).toHaveURL('/journal');
    await expect(page.getByRole('heading', { name: 'Journal', level: 1 })).toBeVisible();
    await expect(drawer).toBeHidden();

    await page.goto(`/gardens/${garden.id}`);
    await expect(page).toHaveURL(`/gardens/${garden.id}`);
    await expect(page.getByRole('heading', { name: garden.name, level: 1 })).toBeVisible();
  }
});
