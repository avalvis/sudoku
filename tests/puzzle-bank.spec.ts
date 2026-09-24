import { test, expect } from '@playwright/test';
import { nextPuzzle } from '../src/domain/puzzles';

test('rated bank is the default and Archive can find the final puzzle', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/No. 3046/)).toBeVisible();
  await page.getByRole('link', { name: 'Archive', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Find puzzle number' }).fill('9045');
  const card = page.getByRole('article', { name: 'Puzzle 9045' });
  await expect(card).toBeVisible(); await expect(card).toContainText('SE ');
  await expect(page.getByRole('article')).toHaveCount(1);
  await card.getByRole('button', { name: 'Start puzzle' }).click();
  await page.getByRole('button', { name: 'Open puzzle', exact: true }).click();
  await expect(page.getByText(/No. 9045/)).toBeVisible();
  await page.getByRole('button', { name: 'New puzzle', exact: true }).click();
  await page.getByRole('button', { name: 'Start puzzle', exact: true }).click();
  await expect(page.getByText(/No. 6046/)).toBeVisible();
  expect(nextPuzzle('hard', 'bank-v1-9000').id).toBe('bank-v1-6001');
});

test('bank-backed Daily edition works offline and restores notes and Undo', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 26, 12));
  await page.goto('/#daily');
  await expect(page.getByTestId('opening')).toHaveCount(0);
  const resume = page.getByRole('button', { name: 'Resume puzzle', exact: true });
  if (await resume.isVisible()) await resume.click();
  const cell = page.getByRole('gridcell', { name: /empty/ }).first();
  const id = (await cell.getAttribute('data-testid'))!;
  await context.setOffline(true);
  await cell.click(); await page.keyboard.press('n'); await page.keyboard.press('2'); await page.keyboard.press('4');
  await expect(page.getByTestId(id)).toHaveAttribute('aria-label', /notes 2, 4/);
  await context.setOffline(false);
  await page.reload(); await page.getByRole('button', { name: 'Resume puzzle', exact: true }).click();
  await expect(page.getByTestId(id)).toHaveAttribute('aria-label', /notes 2, 4/);
  await page.keyboard.press('Control+z');
  await expect(page.getByTestId(id)).toHaveAttribute('aria-label', /notes 2$/);
});
