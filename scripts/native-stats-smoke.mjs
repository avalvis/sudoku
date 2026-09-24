/* global indexedDB */
// Run only against an isolated, test-launched WebView2 profile on port 9237.
import { chromium, expect } from '@playwright/test';
import puzzles from '../src/domain/puzzle-pack.json' with { type: 'json' };

let browser;
for (let attempt = 0; attempt < 40; attempt++) {
  try { browser = await chromium.connectOverCDP('http://127.0.0.1:9237'); break; }
  catch (error) { if (attempt === 39) throw error; await new Promise(resolve => setTimeout(resolve, 250)); }
}
try {
  const context = browser.contexts()[0];
  const page = context.pages()[0] ?? await context.waitForEvent('page');
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.waitForURL(/tauri\.localhost/);
  await expect(page.getByTestId('opening')).toHaveCount(0);
  await expect(page.locator('#main-content')).toBeVisible();
  const resume = page.getByRole('button', { name: 'Resume' });
  if (await resume.isVisible()) await resume.click();
  if (!process.argv.includes('--restore')) {
    await expect(page.locator('[role="gridcell"]')).toHaveCount(81);
    const puzzle = puzzles.find(p => p.id === 'medium-1');
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
      if (puzzle.givens[row][col] !== null) continue;
      await page.getByTestId(`cell-${row}-${col}`).click();
      await page.keyboard.press(String(puzzle.solution[row][col]));
    }
  }
  const review = page.getByRole('button', { name: 'Review board' });
  if (await review.isVisible()) await review.click();
  await page.getByRole('link', { name: 'Stats', exact: true }).click();
  await expect(page.getByTestId('stats-completed')).toHaveText('1');
  await expect(page.getByTestId('stats-rate')).toHaveText('100%');
  await expect(page.getByRole('table', { name: 'Game history, most recently finished first' }).getByRole('row')).toHaveCount(2);
  await page.screenshot({ path: 'test-results/native-stats.png', fullPage: true });
  const save = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    return new Promise((resolve, reject) => {
      const tx = db.transaction('keyval'); const r = tx.objectStore('keyval').get('editorial-sudoku-session');
      r.onsuccess = () => resolve(JSON.parse(r.result)); r.onerror = () => reject(r.error); tx.oncomplete = () => db.close();
    });
  });
  expect(save.version).toBe(3);
  expect(save.state.results).toHaveLength(1);
  expect(save.state.results[0].id).toBe(save.state.session.id);
  expect(errors).toEqual([]);
  console.log(`Native Stats ${process.argv.includes('--restore') ? 'relaunch' : 'completion'} passed: one persisted result, 100% completion, no runtime errors.`);
} finally { await browser.close(); }
