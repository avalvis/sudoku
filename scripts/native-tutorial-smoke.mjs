/* global indexedDB */
// Run only against a test-launched WebView2 with an isolated profile.
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
  await page.getByRole('link', { name: 'How to play', exact: true }).click();
  const snapshot = () => page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    return new Promise((resolve, reject) => {
      const tx = db.transaction('keyval'); const r = tx.objectStore('keyval').get('editorial-sudoku-session');
      r.onsuccess = () => resolve(JSON.parse(r.result)); r.onerror = () => reject(r.error); tx.oncomplete = () => db.close();
    });
  });
  const before = await snapshot();
  for (const digit of [9, 5, 8, 9]) {
    await page.getByRole('button', { name: `Enter ${digit}`, exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Notes OFF' }).click();
  await page.getByRole('button', { name: 'Enter 2', exact: true }).click();
  await page.getByRole('button', { name: 'Enter 9', exact: true }).click();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ready to play' })).toBeVisible();
  expect(await snapshot()).toEqual(before);
  await page.screenshot({ path: '.cache/native-tutorial-complete.png' });
  await page.getByRole('link', { name: 'Return to puzzle' }).click();
  await page.getByRole('button', { name: 'Resume puzzle' }).click();
  await expect(page.getByText(/No. 9045/)).toBeVisible();
  await expect(page.getByRole('gridcell', { name: /notes 2/ })).toBeVisible();
  await page.getByRole('button', { name: 'Pause game' }).click();
  expect(errors).toEqual([]);
  console.log('Native tutorial passed: all five lessons, unchanged saved session/history/results, return to puzzle 9045 with notes, no runtime errors.');
} finally { await browser.close(); }
