import { expect, test } from '@playwright/test';

test('interactive lessons explain mistakes, accept keyboard input, and reset', async ({ page }) => {
  await page.goto('/#how-to-play');
  await expect(page.getByTestId('opening')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'One of each in every row' })).toBeFocused();
  await page.keyboard.press('1');
  await expect(page.locator('.tutorial-feedback')).toContainText('already in this row');
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  for (const digit of ['9', '5', '8']) {
    await page.keyboard.press(`Numpad${digit}`);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await page.keyboard.press('3');
  await expect(page.locator('.tutorial-feedback')).toContainText('already in this column');
  await page.keyboard.press('4');
  await expect(page.locator('.tutorial-feedback')).toContainText('already in this box');
  await page.keyboard.press('9');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.keyboard.press('2');
  await expect(page.locator('.tutorial-feedback')).toContainText('Turn Notes on first');
  await page.keyboard.press('n');
  await page.keyboard.press('2');
  await page.keyboard.press('9');
  await expect(page.getByTestId('tutorial-target')).toHaveAccessibleName(/notes 2, 9/);
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ready to play' })).toBeFocused();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('Step 1 of 5')).toBeVisible();
  await expect(page.getByTestId('tutorial-target')).toHaveText('?');
});

for (const mode of ['Classic', 'Daily']) test(`tutorial preserves ${mode} notes and returns paused`, async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('opening')).toHaveCount(0);
  await page.getByRole('link', { name: mode, exact: true }).click();
  const resume = page.getByRole('button', { name: 'Resume puzzle' });
  if (await resume.isVisible()) await resume.click();
  await page.getByRole('gridcell', { name: /empty/ }).first().click();
  await page.keyboard.press('n');
  await page.keyboard.press('2');
  await expect(page.getByRole('gridcell', { name: /notes 2/ })).toHaveCount(1);
  await page.getByRole('link', { name: 'How to play', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'One of each in every row' })).toBeFocused();
  await page.keyboard.press('1');
  await page.keyboard.press('9');
  await page.getByRole('link', { name: 'Back to game' }).click();
  await expect(page.getByTestId('pause-panel')).toBeVisible();
  await resume.click();
  await expect(page.getByRole('gridcell', { name: /notes 2/ })).toHaveCount(1);
  await page.keyboard.press('Control+z');
  await expect(page.getByRole('gridcell', { name: /notes 2/ })).toHaveCount(0);
});

for (const [width, height] of [[900, 700], [1280, 900], [1920, 1080]]) test(`tutorial fits ${width}x${height}`, async ({ page }) => {
  await page.setViewportSize({ width, height });
  await page.goto('/#how-to-play');
  await expect(page.getByTestId('opening')).toHaveCount(0);
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: /dark theme/i }).click();
    const bounds = await page.locator('.sudoku-board').boundingBox();
    expect(Math.abs(bounds!.width - bounds!.height)).toBeLessThan(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await page.screenshot({ path: `test-results/tutorial-${width}-${theme}.png`, animations: 'disabled' });
  }
});
