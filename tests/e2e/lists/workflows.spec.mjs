import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/fixtures/sample-garden.json' });

function outstandingList(page, listConfig) {
  return page.locator(`.lists-list[aria-label="Outstanding ${listConfig.title}"]`);
}

function completedAccordion(page, listConfig) {
  return page.locator(`[data-lists-group="${listConfig.kind}"] details`);
}

async function expandCompletedAccordion(page, listConfig) {
  const details = completedAccordion(page, listConfig);
  await expect(details).toBeVisible();
  if (!await details.evaluate(element => element.open)) {
    await details.locator('summary').click();
    await expect(details).toHaveJSProperty('open', true);
  }
}

for (const listConfig of [
  { route: '/tasks', kind: 'task', title: 'Tasks', itemLabel: 'Task' },
  { route: '/wishlist', kind: 'wishlist', title: 'Wish List', itemLabel: 'Wish List item' },
]) {
  test(`${listConfig.itemLabel} creation preserves manual order and places new items first`, async ({ page }) => {
    await page.goto(listConfig.route);
    const outstanding = outstandingList(page, listConfig);
    const items = outstanding.locator('[data-list-item]');
    await expect(items.first()).toBeVisible();
    const initialNames = await outstanding.locator('.lists-item__text').allTextContents();
    expect(initialNames.length).toBeGreaterThan(1);

    await items.nth(1).getByRole('button', { name: `Move ${initialNames[1]} up` }).click();
    const manuallyOrderedNames = [
      initialNames[1],
      initialNames[0],
      ...initialNames.slice(2),
    ];
    await expect(outstanding.locator('.lists-item__text')).toHaveText(manuallyOrderedNames);
    await page.reload();
    await expect(outstandingList(page, listConfig).locator('.lists-item__text')).toHaveText(manuallyOrderedNames);

    const addedName = `Playwright ${listConfig.kind} ${Date.now()}`;
    await page.getByRole('textbox', {
      name: listConfig.kind === 'task' ? 'New task' : 'New Wish List item',
    }).fill(addedName);
    await page.getByRole('button', {
      name: listConfig.kind === 'task' ? 'Add task' : 'Add item',
    }).click();

    await expect(outstandingList(page, listConfig).locator('.lists-item__text')).toHaveText([
      addedName,
      ...manuallyOrderedNames,
    ]);
  });
}

test('creates, completes, edits, and persists a Task', async ({ page }) => {
  const taskName = `Playwright Task ${Date.now()}`;
  const updatedName = `${taskName} updated`;

  await page.goto('/tasks');
  await page.getByRole('textbox', { name: 'New task' }).fill(taskName);
  await page.getByRole('button', { name: 'Add task' }).click();

  const outstanding = page.locator('.lists-list[aria-label="Outstanding Tasks"]');
  const task = outstanding.locator('[data-list-item]').filter({ hasText: taskName });
  await expect(task.locator('.lists-item__text')).toHaveText(taskName);
  const taskId = await task.getAttribute('data-list-item-id');
  const completion = task.getByRole('checkbox', { name: `Mark task complete: ${taskName}` });
  await completion.click();
  await expect(outstanding.locator(`[data-list-item-id="${taskId}"]`)).toHaveCount(0);
  const taskAccordion = page.locator('[data-lists-group="task"] details');
  await expect(taskAccordion).toBeVisible();
  await expect(taskAccordion).toHaveJSProperty('open', false);
  await expandCompletedAccordion(page, { kind: 'task' });
  const completedTask = page.locator('.lists-list[aria-label="Completed"]')
    .locator(`[data-list-item-id="${taskId}"]`);
  await expect(completedTask).toBeVisible();
  await expect(completedTask.getByRole('checkbox')).toBeChecked();
  await expect(completedTask.getByText('Completed', { exact: true })).toBeVisible();

  await completedTask.getByRole('button', { name: 'Edit', exact: true }).click();
  const editForm = page.locator('.lists-list form.lists-edit');
  await editForm.getByRole('textbox', { name: 'Item' }).fill(updatedName);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(completedTask.locator('.lists-item__text')).toHaveText(updatedName);

  await page.reload();
  await expect(completedAccordion(page, { kind: 'task' })).toHaveJSProperty('open', true);
  const persistedTask = page.locator('.lists-list[aria-label="Completed"]')
    .locator(`[data-list-item-id="${taskId}"]`);
  await expect(persistedTask.locator('.lists-item__text')).toHaveText(updatedName);
  await expect(persistedTask.getByRole('checkbox', {
    name: `Mark task incomplete: ${updatedName}`,
  })).toBeChecked();
  await expect(persistedTask.getByText('Completed', { exact: true })).toBeVisible();
});

test('creates a Wish List item with optional fields, marks it purchased, and persists edits', async ({ page }) => {
  const itemName = `Playwright Wish List ${Date.now()}`;
  const editedName = `${itemName} edited`;
  const quantity = '3 packets';
  const notes = 'Save for the spring planting.';
  const productUrl = 'https://example.com/garden-seeds';

  await page.goto('/wishlist');
  await page.getByRole('textbox', { name: 'New Wish List item' }).fill(itemName);
  await page.getByRole('button', { name: 'Add item' }).click();

  const outstanding = page.locator('.lists-list[aria-label="Outstanding Wish List"]');
  const item = outstanding.locator('[data-list-item]').filter({ hasText: itemName });
  await expect(item.locator('.lists-item__text')).toHaveText(itemName);
  const itemId = await item.getAttribute('data-list-item-id');
  await item.getByRole('button', { name: 'Edit', exact: true }).click();
  const editForm = page.locator('.lists-list form.lists-edit');
  await editForm.getByRole('textbox', { name: 'Item' }).fill(itemName);
  await editForm.getByRole('textbox', { name: 'Quantity (optional)' }).fill(quantity);
  await editForm.getByRole('textbox', { name: 'Product URL (optional)' }).fill(productUrl);
  await editForm.getByRole('textbox', { name: 'Notes (optional)' }).fill(notes);
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(item.getByText(`Quantity: ${quantity}`)).toBeVisible();
  await expect(item.getByText(notes, { exact: true })).toBeVisible();
  await expect(item.getByRole('link', { name: 'Product link' })).toHaveAttribute('href', productUrl);

  await item.getByRole('checkbox', { name: `Mark item purchased: ${itemName}` }).click();
  await expect(outstanding.locator(`[data-list-item-id="${itemId}"]`)).toHaveCount(0);
  const wishlistAccordion = page.locator('[data-lists-group="wishlist"] details');
  await expect(wishlistAccordion).toBeVisible();
  await expect(wishlistAccordion).toHaveJSProperty('open', false);
  await expandCompletedAccordion(page, { kind: 'wishlist' });
  const purchasedList = page.locator('.lists-list[aria-label="Purchased"]');
  const purchasedItem = purchasedList.locator(`[data-list-item-id="${itemId}"]`);
  await expect(purchasedItem).toBeVisible();
  await expect(purchasedItem.getByRole('checkbox')).toBeChecked();
  await expect(purchasedItem.getByText('Purchased', { exact: true })).toBeVisible();
  await page.reload();

  await expect(completedAccordion(page, { kind: 'wishlist' })).toHaveJSProperty('open', true);
  const reloadedPurchasedItem = page.locator('.lists-list[aria-label="Purchased"]')
    .locator(`[data-list-item-id="${itemId}"]`);
  await expect(reloadedPurchasedItem.getByRole('checkbox', {
    name: `Mark item unpurchased: ${itemName}`,
  })).toBeChecked();
  await expect(reloadedPurchasedItem.getByText(`Quantity: ${quantity}`)).toBeVisible();
  await expect(reloadedPurchasedItem.getByText(notes, { exact: true })).toBeVisible();
  await expect(reloadedPurchasedItem.getByRole('link', { name: 'Product link' })).toHaveAttribute('href', productUrl);

  await reloadedPurchasedItem.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('.lists-list form.lists-edit').getByRole('textbox', { name: 'Item' }).fill(editedName);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();

  await expect(completedAccordion(page, { kind: 'wishlist' })).toHaveJSProperty('open', true);
  const editedItem = page.locator('.lists-list[aria-label="Purchased"]')
    .locator(`[data-list-item-id="${itemId}"]`);
  await expect(editedItem.locator('.lists-item__text')).toHaveText(editedName);
  await expect(editedItem.getByRole('checkbox', {
    name: `Mark item unpurchased: ${editedName}`,
  })).toBeChecked();
  await expect(editedItem.getByText(`Quantity: ${quantity}`)).toBeVisible();
  await expect(editedItem.getByText(notes, { exact: true })).toBeVisible();
  await expect(editedItem.getByRole('link', { name: 'Product link' })).toHaveAttribute('href', productUrl);
});
