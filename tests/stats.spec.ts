import { test, expect, type Page } from '@playwright/test';
import { nextPuzzle } from '../src/domain/puzzles';

const puzzle = nextPuzzle('medium');
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.locator('[role="gridcell"]')).toHaveCount(81);
  const resume = page.getByRole('button', { name: 'Resume' });
  if (await resume.isVisible()) await resume.click();
}
async function goStats(page: Page) {
  await page.getByRole('link', { name: 'Stats', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Stats');
}
async function backToPuzzle(page: Page) {
  await page.getByRole('link', { name: 'Classic', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Classic', exact: true })).toBeVisible();
  const resume = page.getByRole('button', { name: 'Resume' });
  if (await resume.isVisible()) await resume.click();
}
async function readSave(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    return new Promise<string>((resolve, reject) => { const tx = db.transaction('keyval'); const r = tx.objectStore('keyval').get('editorial-sudoku-session'); r.onsuccess = () => resolve(r.result as string); r.onerror = () => reject(r.error); tx.oncomplete = () => db.close(); });
  });
}

test('one completed result survives review, new game, route changes, and repeated reloads', async ({ page }) => {
  await ready(page);
  for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
    if (puzzle.givens[row][col] !== null) continue;
    await page.getByTestId(`cell-${row}-${col}`).click(); await page.keyboard.press(String(puzzle.solution[row][col]));
  }
  await page.getByRole('button', { name: 'Review board' }).click(); await goStats(page);
  await expect(page.getByTestId('stats-completed')).toHaveText('1'); await expect(page.getByTestId('stats-rate')).toHaveText('100%');
  await expect(page.getByRole('table', { name: 'Game history, most recently finished first' }).getByRole('row')).toHaveCount(2);
  const saved = JSON.parse(await readSave(page));
  for (let i = 0; i < 2; i++) { await page.reload(); await expect(page.getByTestId('stats-completed')).toHaveText('1'); }
  expect(JSON.parse(await readSave(page)).state.results).toEqual(saved.state.results);
  await backToPuzzle(page);
  const review = page.getByRole('button', { name: 'Review board' }); if (await review.isVisible()) await review.click();
  await page.getByRole('button', { name: 'New puzzle' }).click(); await page.getByRole('button', { name: 'Start puzzle', exact: true }).click();
  await goStats(page); await expect(page.getByTestId('stats-completed')).toHaveText('1'); await expect(page.getByTestId('stats-rate')).toHaveText('100%');
});

test('cancelled restart preserves the attempt; confirmed replacement records abandonment', async ({ page }) => {
  await ready(page); await page.getByTestId('cell-0-0').click(); await page.keyboard.press('n'); await page.keyboard.press('2');
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(page.getByRole('dialog')).toContainText('saved as abandoned');
  await page.getByRole('button', { name: 'Cancel' }).click(); await goStats(page);
  await expect(page.getByTestId('stats-completed')).toHaveText('0'); await expect(page.getByText('of 1 started attempt', { exact: true })).toBeVisible();
  await expect(page.getByText('A puzzle is in progress.')).toBeVisible();
  await expect(page.getByText('No games yet.')).toBeVisible();
  await backToPuzzle(page); await page.getByRole('button', { name: 'Restart' }).click(); await page.getByRole('button', { name: 'Restart puzzle', exact: true }).click();
  await goStats(page); await expect(page.getByText('Abandoned', { exact: true })).toBeVisible();
  await expect(page.getByText('of 1 started attempt', { exact: true })).toBeVisible();
  await expect(page.getByText('A puzzle is in progress.')).not.toBeVisible();
  await page.reload(); await expect(page.getByText('Abandoned', { exact: true })).toBeVisible();
});

test('practice history is separate and filters persist across theme changes', async ({ page }) => {
  await ready(page); await page.getByTestId('cell-0-0').click(); for (const digit of ['6', '8', '1']) await page.keyboard.press(digit);
  await page.getByRole('button', { name: 'Continue practice' }).click(); await page.getByRole('button', { name: 'Restart' }).click();
  await page.getByRole('button', { name: 'Restart puzzle', exact: true }).click(); await goStats(page);
  await expect(page.getByText('of 0 started attempts', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Practice games', exact: true }).click();
  await expect(page.getByText('of 1 started attempt', { exact: true })).toBeVisible();
  await expect(page.getByText('Abandoned', { exact: true })).toBeVisible();
  await page.getByRole('combobox').selectOption('hard'); await expect(page.getByText('of 0 started attempts', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.getByRole('combobox')).toHaveValue('hard');
  await page.getByRole('combobox').selectOption('medium'); await expect(page.getByText('of 1 started attempt', { exact: true })).toBeVisible();
});

test('a v1 save migrates in the browser with notes, undo, and elapsed time intact', async ({ page }) => {
  await ready(page); await page.getByTestId('cell-0-0').click(); await page.keyboard.press('n'); await page.keyboard.press('2'); await page.keyboard.press('4');
  await page.getByRole('button', { name: 'Pause game' }).click();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => resolve(r.result); });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('keyval', 'readwrite'); const table = tx.objectStore('keyval'); const r = table.get('editorial-sudoku-session');
      r.onsuccess = () => {
        const save = JSON.parse(r.result); save.version = 1; delete save.state.results;
        for (const key of ['id', 'started', 'startedAt', 'completedAt']) delete save.state.session[key];
        save.state.session.elapsedSeconds = 73; table.put(JSON.stringify(save), 'editorial-sudoku-session');
      };
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    }); db.close();
  });
  await page.reload(); await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByTestId('cell-0-0')).toHaveAttribute('aria-label', /notes 2, 4/);
  await expect(page.getByTestId('timer')).toHaveText('01:13');
  await page.keyboard.press('Control+z'); await expect(page.getByTestId('cell-0-0')).toHaveAttribute('aria-label', /notes 2$/);
  await goStats(page); await expect(page.getByText('of 1 started attempt', { exact: true })).toBeVisible();
  const saved = JSON.parse(await readSave(page)); expect(saved.version).toBe(3); expect(saved.state.session.startedAt).toBe(null);
});

for (const width of [900, 1280, 1920]) {
  test(`Stats layout and empty state at ${width}px in both themes`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await ready(page); await goStats(page);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByTestId('stats-rate')).toHaveText('—');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/stats-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await page.screenshot({ path: `test-results/stats-${width}-dark.png`, fullPage: true });
  });
}
