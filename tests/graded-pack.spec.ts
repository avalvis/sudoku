import { test, expect } from '@playwright/test';
import graded from '../src/domain/graded-pack.json' with { type: 'json' };

test('opens and completes a technique-graded Hard puzzle from Archive', async ({ page }) => {
  await page.goto('/#archive');
  await page.getByRole('checkbox', { name: 'Technique graded' }).check();
  await expect(page.getByRole('article')).toHaveCount(9);
  await page.getByRole('combobox').selectOption('hard');
  await expect(page.getByRole('article')).toHaveCount(9);
  await page.getByRole('searchbox', { name: 'Find puzzle number' }).fill('43');
  await page.getByRole('article', { name: 'Puzzle 043' }).getByRole('button', { name: 'Start puzzle' }).click();
  await page.getByRole('button', { name: 'Open puzzle', exact: true }).click();
  const puzzle = graded.find(p => p.id === 'graded-v1-hard-1')!;
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    if (puzzle.givens[r][c] !== null) continue;
    await page.getByTestId(`cell-${r}-${c}`).click();
    await page.keyboard.press(String(puzzle.solution[r][c]));
  }
  await expect(page.getByRole('dialog')).toContainText('Puzzle complete');
  await page.getByRole('button', { name: 'Review board' }).click();
  await page.reload();
  await expect(page.getByText(/No. 043/)).toBeVisible();
  await expect(page.getByRole('gridcell', { name: /empty/ })).toHaveCount(0);
});

test('new Daily schedule saves and restores a graded edition', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 25, 12));
  await page.goto('/#daily');
  await expect(page.getByTestId('opening')).toHaveCount(0);
  const resume = page.getByRole('button', { name: 'Resume puzzle', exact: true });
  if (await resume.isVisible()) await resume.click();
  const cell = page.getByRole('gridcell', { name: /empty/ }).first();
  const id = await cell.getAttribute('data-testid');
  await cell.click(); await page.keyboard.press('n'); await page.keyboard.press('2');
  await expect(page.getByTestId(id!)).toHaveAttribute('aria-label', /notes 2/);
  await page.reload(); await page.getByRole('button', { name: 'Resume puzzle', exact: true }).click();
  await expect(page.getByTestId(id!)).toHaveAttribute('aria-label', /notes 2/);
});
