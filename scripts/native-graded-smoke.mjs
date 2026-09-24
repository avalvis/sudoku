/* global indexedDB */
// Connect only to a test-launched WebView2 with an isolated profile.
import { chromium, expect } from '@playwright/test';
let browser;
for (let attempt = 0; attempt < 40; attempt++) {
  try { browser = await chromium.connectOverCDP('http://127.0.0.1:9237'); break; }
  catch (error) { if (attempt === 39) throw error; await new Promise(resolve => setTimeout(resolve, 250)); }
}
try {
  const context = browser.contexts()[0];
  const page = context.pages()[0] ?? await context.waitForEvent('page');
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.waitForURL(/tauri\.localhost/);
  await expect(page.getByTestId('opening')).toHaveCount(0);
  await expect(page.locator('#main-content')).toBeVisible();
  const resume = page.getByRole('button', { name: 'Resume puzzle' });
  if (await resume.isVisible()) await resume.click();
  if (!process.argv.includes('--restore')) {
    await page.getByRole('link', { name: 'Archive', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Rated puzzles only' }).check();
    await expect(page.getByRole('article')).toHaveCount(9);
    await page.getByRole('combobox').selectOption('hard');

    await expect(page.getByRole('article')).toHaveCount(9);
    await page.getByRole('searchbox', { name: 'Find puzzle number' }).fill('43');
    await page.getByRole('article', { name: 'Puzzle 043' }).getByRole('button', { name: 'Start puzzle' }).click();
    await page.getByRole('button', { name: 'Open puzzle', exact: true }).click();
    await page.getByRole('gridcell', { name: /empty/ }).first().click(); await page.keyboard.press('n'); await page.keyboard.press('2');
  }
  await expect(page.getByText(/No. 043/)).toBeVisible();
  await expect(page.getByRole('gridcell', { name: /notes 2/ })).toBeVisible();
  await page.getByRole('link', { name: 'Archive', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Rated puzzles only' }).check();
  await page.getByRole('combobox').selectOption('hard');

  await page.getByRole('searchbox', { name: 'Find puzzle number' }).fill('43');
  const current = page.getByRole('article', { name: 'Puzzle 043' });
  await expect(current).toContainText('Your puzzle in progress');
  await current.getByRole('link', { name: 'Return to puzzle' }).click();
  await page.getByRole('button', { name: 'Resume puzzle' }).click();
  await expect(page.getByRole('gridcell', { name: /notes 2/ })).toBeVisible();
  await page.getByRole('button', { name: 'Pause game' }).click();
  const save = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    return new Promise((resolve, reject) => {
      const tx = db.transaction('keyval'); const r = tx.objectStore('keyval').get('editorial-sudoku-session');
      r.onsuccess = () => resolve(JSON.parse(r.result)); r.onerror = () => reject(r.error); tx.oncomplete = () => db.close();
    });
  });
  expect(save.state.session.puzzleId).toBe('graded-v1-hard-1');
  expect(save.state.results).toHaveLength(0);
  expect(errors).toEqual([]);
  console.log(`Installed graded pack ${process.argv.includes('--restore') ? 'relaunch' : 'selection'} passed: puzzle 043, notes, filter, and no runtime errors.`);
} finally { await browser.close(); }