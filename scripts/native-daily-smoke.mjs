/* global indexedDB */
// Run only against a dedicated WebView2 profile on localhost:9237.
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
  await expect(page.locator('[role="gridcell"]')).toHaveCount(81);
  const resume = async () => { const button = page.getByRole('button', { name: 'Resume puzzle' }); if (await button.isVisible()) await button.click(); };
  await resume();
  if (!process.argv.includes('--restore')) {
    await page.getByTestId('cell-0-0').click(); await page.keyboard.press('n'); await page.keyboard.press('2');
  }
  await expect(page.getByTestId('cell-0-0')).toHaveAttribute('aria-label', /notes 2/);
  await page.getByRole('link', { name: 'Daily', exact: true }).click(); await resume();
  if (!process.argv.includes('--restore')) {
    await page.getByRole('gridcell', { name: /empty/ }).first().click(); await page.keyboard.press('n'); await page.keyboard.press('4');
  }
  await expect(page.getByRole('gridcell', { name: /notes 4/ })).toBeVisible();
  await page.getByRole('link', { name: 'Classic', exact: true }).click(); await resume();
  await expect(page.getByTestId('cell-0-0')).toHaveAttribute('aria-label', /notes 2/);
  await page.getByRole('link', { name: 'Daily', exact: true }).click(); await resume();
  await expect(page.getByRole('gridcell', { name: /notes 4/ })).toBeVisible();
  await page.getByRole('button', { name: 'Pause game' }).click();
  const save = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    return new Promise((resolve, reject) => {
      const tx = db.transaction('keyval'); const r = tx.objectStore('keyval').get('editorial-sudoku-session');
      r.onsuccess = () => resolve(JSON.parse(r.result)); r.onerror = () => reject(r.error); tx.oncomplete = () => db.close();
    });
  });
  expect(save.version).toBe(3); expect(save.state.savedGames.classic.history).toHaveLength(1);
  expect(save.state.results).toHaveLength(0); expect(errors).toEqual([]);
  console.log(`Native Daily ${process.argv.includes('--restore') ? 'relaunch' : 'play'} passed: separate Classic and Daily notes, Undo histories, no false abandonments, no runtime errors.`);
} finally { await browser.close(); }
