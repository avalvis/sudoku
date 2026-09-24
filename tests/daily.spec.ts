import { test, expect, type Page } from '@playwright/test';
import { dailyPuzzle } from '../src/domain/daily';

const DATE = '2026-09-24';
async function resume(page: Page) {
  await expect(page.getByTestId('opening')).toHaveCount(0);
  await expect(page.locator('.main-content')).toBeVisible();
  const button = page.getByRole('button', { name: 'Resume' });
  if (await button.isVisible()) await button.click();
}
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date('2026-09-24T10:00:00Z')); });

test('Daily dates keep independent progress and survive reload without abandoning Classic', async ({ page }) => {
  await page.goto('/'); await page.getByTestId('cell-0-0').click(); await page.keyboard.press('n'); await page.keyboard.press('2');
  await page.getByRole('link', { name: 'Daily', exact: true }).click();
  await expect(page.getByLabel('Edition date', { exact: true })).toHaveValue(DATE);
  await page.getByRole('gridcell', { name: /empty/ }).first().click(); await page.keyboard.press('n'); await page.keyboard.press('4');
  await page.getByLabel('Edition date', { exact: true }).fill('2026-09-23');
  await page.getByRole('button', { name: /^Hint/ }).click();
  await page.getByLabel('Saved daily editions').selectOption(DATE); await resume(page);
  await expect(page.getByRole('gridcell', { name: /notes 4/ })).toBeVisible();
  await page.reload(); await resume(page);
  await expect(page.getByRole('gridcell', { name: /notes 4/ })).toBeVisible();
  await page.getByRole('link', { name: 'Classic', exact: true }).click(); await resume(page);
  await expect(page.getByTestId('cell-0-0')).toHaveAttribute('aria-label', /notes 2/);
  await page.getByRole('link', { name: 'Stats', exact: true }).click();
  await expect(page.getByText('of 3 started attempts', { exact: true })).toBeVisible();
  await expect(page.getByText('Abandoned', { exact: true })).toHaveCount(0);
});

test('Daily completion is recorded once and replays retain the date', async ({ page }) => {
  await page.goto('/#daily'); await expect(page.getByLabel('Edition date', { exact: true })).toHaveValue(DATE);
  const puzzle = dailyPuzzle(DATE);
  for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) if (puzzle.givens[row][col] === null) {
    await page.getByTestId(`cell-${row}-${col}`).click(); await page.keyboard.press(String(puzzle.solution[row][col]));
  }
  await expect(page.getByRole('dialog')).toContainText('Puzzle complete');
  await page.getByRole('button', { name: 'Review board' }).click();
  await expect(page.locator('.board-caption')).toContainText('Complete');
  await page.getByRole('link', { name: 'Stats', exact: true }).click();
  await expect(page.getByTestId('stats-completed')).toHaveText('1');
  await expect(page.getByText(`Daily · ${DATE}`, { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Daily', exact: true }).click();
  await page.getByRole('button', { name: 'Review board' }).click();
  await page.getByRole('button', { name: 'Restart' }).click();
  await page.getByRole('button', { name: 'Restart puzzle', exact: true }).click();
  await expect(page.getByLabel('Edition date', { exact: true })).toHaveValue(DATE);
  await page.getByRole('link', { name: 'Stats', exact: true }).click();
  await expect(page.getByTestId('stats-completed')).toHaveText('1');
});

test('midnight offers today without replacing the open edition', async ({ page }) => {
  await page.goto('/#daily'); await expect(page.getByLabel('Edition date', { exact: true })).toHaveValue(DATE);
  await page.getByRole('button', { name: /^Hint/ }).click();
  await page.clock.setFixedTime(new Date('2026-09-25T10:00:00Z'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('button', { name: 'Open today’s edition' })).toBeVisible();
  await expect(page.getByLabel('Edition date', { exact: true })).toHaveValue(DATE);
  await page.getByRole('button', { name: 'Open today’s edition' }).click();
  await expect(page.getByLabel('Edition date', { exact: true })).toHaveValue('2026-09-25');
  await page.getByLabel('Saved daily editions').selectOption(DATE); await resume(page);
  await expect(page.getByRole('button', { name: /^Hint/ })).toHaveAttribute('title', '1 hints remaining');
});

for (const width of [900, 1280, 1920]) test(`Daily layout at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 900 ? 700 : 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#daily'); await expect(page.getByLabel('Edition date', { exact: true })).toHaveValue(DATE);
  await page.evaluate(() => document.fonts.ready);
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const box = await page.getByTestId('board-frame').boundingBox(); expect(Math.abs(box!.width - box!.height)).toBeLessThan(2);
    await page.screenshot({ path: `test-results/daily-${width}-${theme}.png`, fullPage: true });
  }
});
