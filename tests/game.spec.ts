import { test, expect, type Page } from '@playwright/test';
import puzzles from '../src/domain/puzzle-pack.json' with { type: 'json' };

const puzzle = puzzles.find(p => p.id === 'medium-1')!;
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.locator('[role="gridcell"]')).toHaveCount(81);
  const resume = page.getByRole('button', { name: 'Back to the puzzle' });
  if (await resume.isVisible()) await resume.click();
  await expect(page.getByRole('gridcell')).toHaveCount(81);
  await page.evaluate(() => document.fonts.ready);
}
test('keyboard play, notes, undo, hint, reload, and themes', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await ready(page);
  const cell = page.getByTestId('cell-0-0');
  await cell.click(); await page.keyboard.press('n'); await page.keyboard.press('2'); await page.keyboard.press('4');
  await expect(cell).toHaveAttribute('aria-label', /notes 2, 4/);
  await page.keyboard.press('Control+z'); await expect(cell).toHaveAttribute('aria-label', /notes 2$/);
  await page.keyboard.press('n'); await page.keyboard.press(String(puzzle.solution[0][0]));
  await expect(cell).toHaveText(String(puzzle.solution[0][0]));
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByRole('dialog')).toContainText('Take your time.');
  await page.getByRole('button', { name: 'Back to the puzzle' }).click();
  await expect(cell).toHaveText(String(puzzle.solution[0][0]));
  await page.keyboard.press('Control+z'); await expect(cell).toHaveAttribute('aria-label', /notes 2$/);
  await page.getByRole('button', { name: /Hint/ }).click();
  await expect(cell).toHaveText(String(puzzle.solution[0][0]));
  await page.getByRole('link', { name: 'Daily', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tomorrow’s ritual.');
  await page.getByRole('link', { name: 'Return to Classic' }).click();
  await expect(page.getByRole('dialog')).toContainText('Take your time.');
  expect(errors).toEqual([]);
});

test('three duplicate entries pause, practice keeps counters, and held keys are ignored', async ({ page }) => {
  await ready(page); const cell = page.getByTestId('cell-0-0'); await cell.click();
  for (const d of ['6', '8', '1']) await page.keyboard.press(d);
  await expect(page.getByRole('dialog')).toContainText('Three mistakes');
  await page.getByRole('button', { name: 'Continue practice' }).click();
  await expect(page.getByTestId('mistakes')).toHaveText('3 total');
  await page.keyboard.press('Control+z');
  await expect(cell).toHaveText('8'); await expect(page.getByTestId('mistakes')).toHaveText('3 total');
  await page.dispatchEvent('body', 'keydown', { key: '6', repeat: true });
  await expect(cell).toHaveText('8');
});

test('completion, review, and next puzzle work end to end', async ({ page }) => {
  await ready(page);
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    if (puzzle.givens[r][c] !== null) continue;
    await page.getByTestId(`cell-${r}-${c}`).click(); await page.keyboard.press(String(puzzle.solution[r][c]));
  }
  await expect(page.getByRole('dialog')).toContainText('Beautifully done.');
  await page.getByRole('button', { name: 'Review board' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'A new puzzle' }).click();
  await page.getByRole('button', { name: 'Start puzzle', exact: true }).click();
  await expect(page.getByText('No. 005', { exact: false })).toBeVisible();
});

test('pause traps focus, suspends keys, and supports resume', async ({ page }) => {
  await ready(page); await page.getByRole('button', { name: 'Pause game' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('4'); await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('cell-0-0')).toHaveAttribute('aria-label', /empty/);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('difficulty selection confirms before replacing the board', async ({ page }) => {
  await ready(page); await page.getByRole('button', { name: /Change difficulty/ }).click();
  await page.getByRole('radio', { name: /hard/i }).check();
  await page.keyboard.press('9');
  await page.getByRole('button', { name: 'Start puzzle', exact: true }).click();
  await expect(page.getByRole('button', { name: /Change difficulty, currently hard/ })).toBeVisible();
  await expect(page.getByTestId('mistakes')).toHaveText('0 / 3');
});

test('corrupt saves are preserved until explicit recovery', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Pause game' }).click();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    await new Promise<void>((resolve, reject) => { const tx = db.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put('broken JSON', 'editorial-sudoku-session'); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  });
  // Avoid pagehide writing over the intentionally corrupt fixture during reload.
  await page.reload();
  await expect(page.getByRole('dialog')).toContainText('A fresh page?');
  const value = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => resolve(r.result); });
    return new Promise(resolve => { const r = db.transaction('keyval').objectStore('keyval').get('editorial-sudoku-session'); r.onsuccess = () => { db.close(); resolve(r.result); }; });
  });
  expect(value).toBe('broken JSON');
  await page.getByRole('button', { name: 'Start fresh' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

for (const [width, height] of [[900, 700], [1280, 900], [1440, 900], [1920, 1080], [2560, 1080]]) {
  test(`layout at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await ready(page); await page.emulateMedia({ reducedMotion: 'reduce' });
    const board = await page.getByTestId('board-frame').boundingBox();
    expect(board).not.toBeNull(); expect(Math.abs(board!.width - board!.height)).toBeLessThan(1);
    expect(board!.width).toBeGreaterThanOrEqual(360); expect(board!.width).toBeLessThanOrEqual(720);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const controls = await page.getByRole('complementary').boundingBox();
    expect(width < 1100 ? controls!.y > board!.y + board!.height : controls!.x > board!.x + board!.width).toBe(true);
    await page.screenshot({ path: `test-results/desktop-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    expect(await page.locator('html').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(18, 22, 26)');
    await page.screenshot({ path: `test-results/desktop-${width}-dark.png`, fullPage: true });
  });
}

for (const scale of [1.25, 1.5, 2]) {
  test(`desktop scaling at ${scale * 100}%`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: Math.round(1920 / scale), height: Math.round(1080 / scale) }, deviceScaleFactor: scale, reducedMotion: 'reduce' });
    const page = await context.newPage(); await ready(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'A new puzzle' }).click();
    const dialog = await page.getByRole('dialog').boundingBox();
    expect(dialog!.y).toBeGreaterThanOrEqual(0); expect(dialog!.y + dialog!.height).toBeLessThanOrEqual(Math.round(1080 / scale));
    await context.close();
  });
}

test('unavailable audio and storage leave the game playable with a save warning', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', { value: undefined });
    Object.defineProperty(window, 'indexedDB', { get: () => { throw new Error('Storage unavailable'); } });
  });
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await ready(page);
  await expect(page.getByRole('alert')).toContainText('could not be saved');
  await page.getByTestId('cell-0-0').click(); await page.keyboard.press('n'); await page.keyboard.press('2');
  await expect(page.getByTestId('cell-0-0')).toHaveAttribute('aria-label', /notes 2/);
  expect(errors).toEqual([]);
});

test('offline play, numpad input, and dark-mode number contrast', async ({ page, context }) => {
  await ready(page); await context.setOffline(true);
  await page.getByTestId('cell-0-0').click(); await page.keyboard.press(`Numpad${puzzle.solution[0][0]}`);
  await expect(page.getByTestId('cell-0-0')).toHaveText(String(puzzle.solution[0][0]));
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  const ratios = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    const luma = (color: string) => {
      const rgb = color.trim().replace('#', '').match(/.{2}/g)!.map(x => parseInt(x, 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
      return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
    };
    const contrast = (a: string, b: string) => { const x = luma(css.getPropertyValue(a)), y = luma(css.getPropertyValue(b)); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    return ['--cell-rest', '--cell-guide', '--cell-selected', '--cell-match'].flatMap(bg => ['--ink', '--accent-text'].map(fg => contrast(fg, bg))).concat(contrast('--error', '--cell-conflict'));
  });
  expect(Math.min(...ratios)).toBeGreaterThanOrEqual(7);
});
