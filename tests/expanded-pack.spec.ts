import { test, expect } from '@playwright/test';

test('Archive pages reach the expanded pack, reset on filters, and launch an added puzzle', async ({ page }) => {
  await page.goto('/#archive');
  await expect(page.getByRole('status').filter({ hasText: '36 puzzles' })).toBeVisible();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Puzzle 010' })).toBeVisible();
  await expect(page.locator('#archive-results')).toBeFocused();
  await page.getByRole('combobox').selectOption('hard');
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await page.getByRole('article', { name: 'Puzzle 036' }).getByRole('button', { name: 'Start puzzle' }).click();
  await page.getByRole('button', { name: 'Open puzzle', exact: true }).click();
  await expect(page.getByText(/No. 036/)).toBeVisible();
  await page.getByRole('button', { name: /^Hint/ }).click();
  await page.reload(); await page.getByRole('button', { name: 'Back to the puzzle' }).click();
  await expect(page.getByText(/No. 036/)).toBeVisible();
  await expect(page.getByRole('button', { name: /^Hint/ })).toHaveAttribute('title', '1 hints remaining');
});
