/* global document, indexedDB */
// Connect only to the dedicated, test-launched WebView2 instance.
import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

let browser;
for (let attempt = 0; attempt < 40; attempt++) {
  try { browser = await chromium.connectOverCDP('http://127.0.0.1:9237'); break; }
  catch (error) { if (attempt === 39) throw error; await new Promise(resolve => setTimeout(resolve, 250)); }
}
try {
  const context = browser.contexts()[0];
  const page = context.pages()[0] ?? await context.waitForEvent('page');
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.waitForURL(/tauri\.localhost/);
  await expect(page.getByTestId('opening')).toHaveCount(0);
  await expect(page.locator('#main-content')).toBeVisible();
  await expect(page.locator('[role="gridcell"]')).toHaveCount(81);
  const resume = page.getByRole('button', { name: 'Resume' });
  if (await resume.isVisible()) await resume.click();
  if (process.argv.includes('--restore')) {
    await expect(page.getByTestId('cell-0-0')).toHaveAttribute('aria-label', /notes 2, 4/);
    await page.keyboard.press('Control+z');
    await expect(page.getByTestId('cell-0-0')).toHaveAttribute('aria-label', /notes 2$/);
    console.log('Native relaunch: saved notes and undo history restored.');
  } else {
    await page.getByTestId('cell-0-0').click();
    await page.keyboard.press('n'); await page.keyboard.press('2'); await page.keyboard.press('4');
    await expect(page.getByTestId('cell-0-0')).toHaveAttribute('aria-label', /notes 2, 4/);
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.evaluate(() => document.fonts.ready);
    const fontsLoaded = await page.evaluate(() => document.fonts.check('14px "Space Grotesk Variable"') && document.fonts.check('14px "Domine Variable"'));
    expect(fontsLoaded).toBe(true);
    mkdirSync('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/native-desktop.png', fullPage: true });
    await page.getByRole('button', { name: 'Pause game' }).click();
    await expect(page.getByRole('dialog')).toContainText('Paused');
    console.log('Native WebView2: bundled fonts, board, keyboard, notes, theme, and pause verified.');
  }
  expect(errors).toEqual([]);
  // Wait for a read transaction behind the last queued write before terminating the test app.
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    await new Promise(resolve => { const tx = db.transaction('keyval'); tx.objectStore('keyval').get('editorial-sudoku-session'); tx.oncomplete = resolve; });
    db.close();
  });
} finally { await browser.close(); }
