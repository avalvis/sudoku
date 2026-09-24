import { test, expect } from '@playwright/test';
import { puzzles, nextPuzzle } from '../src/domain/puzzles';

test('archive filters, cancellation, exact puzzle selection, and restoration', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('cell-0-0').click(); await page.keyboard.press('n'); await page.keyboard.press('2');
  await page.getByRole('link', { name: 'Archive', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(9);
  await page.getByRole('combobox').selectOption('hard');
  await expect(page.getByRole('article')).toHaveCount(9);
  await page.getByRole('searchbox', { name: 'Find puzzle number' }).fill('8');
  const card = page.getByRole('article', { name: 'Puzzle 008' });
  const start = card.getByRole('button', { name: 'Start puzzle' });
  await start.click(); await expect(page.getByRole('dialog')).toContainText('abandoned');
  await page.keyboard.press('Escape'); await expect(start).toBeFocused();
  await page.getByRole('link', { name: 'Classic', exact: true }).click();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByTestId('cell-0-0')).toHaveAttribute('aria-label', /notes 2/);
  await page.getByRole('link', { name: 'Archive', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Find puzzle number' }).fill('8');
  await card.getByRole('button', { name: 'Start puzzle' }).click();
  await page.getByRole('button', { name: 'Open puzzle', exact: true }).click();
  await expect(page).toHaveURL(/#classic$/);
  await expect(page.getByText(/No. 008/)).toBeVisible();
  const puzzle = puzzles.find(p => p.id === 'hard-2')!;
  for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
    await expect(page.getByTestId(`cell-${row}-${col}`)).toHaveText(puzzle.givens[row][col] === null ? '' : String(puzzle.givens[row][col]));
  }
  await page.reload(); await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByText(/No. 008/)).toBeVisible();
  await page.getByRole('link', { name: 'Stats', exact: true }).click();
  await expect(page.getByText('Abandoned', { exact: true })).toBeVisible();
  await expect(page.getByText('of 1 started attempt', { exact: true })).toBeVisible();
});

test('archive completion, replay, and current-board return preserve journal', async ({ page }) => {
  await page.goto('/');
  const puzzle = nextPuzzle('medium');
  for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
    if (puzzle.givens[row][col] !== null) continue;
    await page.getByTestId(`cell-${row}-${col}`).click(); await page.keyboard.press(String(puzzle.solution[row][col]));
  }
  await page.getByRole('button', { name: 'Review board' }).click();
  await page.getByRole('link', { name: 'Archive', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Find puzzle number' }).fill('3046');
  await page.getByRole('checkbox', { name: 'Not yet completed' }).check(); await expect(page.getByRole('article', { name: 'Puzzle 3046' })).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Not yet completed' }).uncheck();
  const card = page.getByRole('article', { name: 'Puzzle 3046' });
  await expect(card).toContainText('Current board · complete');
  await card.getByRole('button', { name: 'Replay puzzle' }).click();
  await page.getByRole('button', { name: 'Open puzzle', exact: true }).click();
  await expect(page.getByTestId('cell-0-0')).toHaveText('');
  await page.getByRole('link', { name: 'Archive', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Find puzzle number' }).fill('3046');
  await card.getByRole('link', { name: 'Return to puzzle' }).click();
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.getByRole('link', { name: 'Stats', exact: true }).click();
  await expect(page.getByTestId('stats-completed')).toHaveText('1');
  await expect(page.getByTestId('stats-rate')).toHaveText('100%');
});

for (const width of [900, 1280, 1920]) test(`archive layout at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.goto('/#archive');
  await expect(page.getByRole('article')).toHaveCount(9);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => document.fonts.ready);
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/archive-${width}-${theme}.png`, fullPage: true });
  }
});
