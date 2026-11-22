import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/fixtures/sample-garden.json' });

async function itemNames(page) {
  return page.locator('.lists-list .lists-item__text').allTextContents();
}

for (const listConfig of [
  { route: '/tasks', kind: 'task', itemLabel: 'Task' },
  { route: '/wishlist', kind: 'wishlist', itemLabel: 'Wish List item' },
]) {
  test(`${listConfig.itemLabel} creation preserves manual order and places new items first`, async ({ page }) => {
    await page.goto(listConfig.route);
    const items = page.locator('.lists-list [data-list-item]');
    await expect(items.first()).toBeVisible();
    const initialNames = await itemNames(page);
    expect(initialNames.length).toBeGreaterThan(1);

    await items.nth(1).getByRole('button', { name: `Move ${initialNames[1]} up` }).click();
    const manuallyOrderedNames = [
      initialNames[1],
      initialNames[0],
      ...initialNames.slice(2),
    ];
    await expect(page.locator('.lists-list .lists-item__text')).toHaveText(manuallyOrderedNames);
    await page.reload();
    await expect(page.locator('.lists-list .lists-item__text')).toHaveText(manuallyOrderedNames);

    const addedName = `Playwright ${listConfig.kind} ${Date.now()}`;
    await page.getByRole('textbox', {
      name: listConfig.kind === 'task' ? 'New task' : 'New Wish List item',
    }).fill(addedName);
    await page.getByRole('button', {
      name: listConfig.kind === 'task' ? 'Add task' : 'Add item',
    }).click();

    await expect(page.locator('.lists-list .lists-item__text')).toHaveText([
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

  const task = page.locator('.lists-list [data-list-item]').filter({ hasText: taskName });
  await expect(task.locator('.lists-item__text')).toHaveText(taskName);
  const completion = task.locator('input[type="checkbox"]');
  await completion.check();
  await expect(completion).toBeChecked();
  await expect(task.getByText('Completed', { exact: true })).toBeVisible();

  await task.getByRole('button', { name: 'Edit', exact: true }).click();
  const editForm = page.locator('.lists-list form.lists-edit');
  await editForm.getByRole('textbox', { name: 'Item' }).fill(updatedName);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(task.locator('.lists-item__text')).toHaveText(updatedName);

  await page.reload();
  const persistedTask = page.locator('.lists-list [data-list-item]').filter({ hasText: updatedName });
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

  const item = page.locator('.lists-list [data-list-item]').filter({ hasText: itemName });
  await expect(item.locator('.lists-item__text')).toHaveText(itemName);
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

  await item.getByRole('checkbox', { name: `Mark item purchased: ${itemName}` }).check();
  await expect(item.getByText('Purchased', { exact: true })).toBeVisible();
  await page.reload();

  const purchasedItem = page.locator('.lists-list [data-list-item]').filter({ hasText: itemName });
  await expect(purchasedItem.getByRole('checkbox', {
    name: `Mark item unpurchased: ${itemName}`,
  })).toBeChecked();
  await expect(purchasedItem.getByText(`Quantity: ${quantity}`)).toBeVisible();
  await expect(purchasedItem.getByText(notes, { exact: true })).toBeVisible();
  await expect(purchasedItem.getByRole('link', { name: 'Product link' })).toHaveAttribute('href', productUrl);

  await purchasedItem.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('.lists-list form.lists-edit').getByRole('textbox', { name: 'Item' }).fill(editedName);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();

  const editedItem = page.locator('.lists-list [data-list-item]').filter({ hasText: editedName });
  await expect(editedItem.locator('.lists-item__text')).toHaveText(editedName);
  await expect(editedItem.getByRole('checkbox', {
    name: `Mark item unpurchased: ${editedName}`,
  })).toBeChecked();
  await expect(editedItem.getByText(`Quantity: ${quantity}`)).toBeVisible();
  await expect(editedItem.getByText(notes, { exact: true })).toBeVisible();
  await expect(editedItem.getByRole('link', { name: 'Product link' })).toHaveAttribute('href', productUrl);
});
