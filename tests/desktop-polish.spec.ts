import { test, expect } from '@playwright/test';

test('opening credits are brief, skippable, and do not accept game input', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('opening')).toContainText('Antonis Valvis');
  await page.keyboard.press('4'); await page.keyboard.press('Escape');
  await expect(page.getByTestId('opening')).toHaveCount(0);
  await expect(page.getByTestId('cell-0-0')).toHaveAttribute('aria-label', /empty/);
  await expect(page).toHaveTitle('Sudoku');
  await expect(page.getByRole('link', { name: 'Sudoku home' })).toBeVisible();
});

for (const [width, height] of [[1920, 1080], [1920, 1000], [1536, 824], [1280, 680], [1280, 900]]) {
  test(`Classic and Daily fit without scrolling at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/'); await expect(page.getByTestId('opening')).toHaveCount(0);
    for (const mode of ['Classic', 'Daily']) {
      await page.getByRole('link', { name: mode, exact: true }).click();
      await expect(page.getByRole('heading', { name: mode, exact: true })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const dimensions = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight }));
      expect(dimensions.scrollHeight).toBeLessThanOrEqual(height);
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(width);
      const board = await page.getByTestId('board-frame').boundingBox();
      const controls = await page.getByRole('complementary').boundingBox();
      expect(board!.y + board!.height).toBeLessThanOrEqual(height);
      expect(controls!.y + controls!.height).toBeLessThanOrEqual(height);
      await page.screenshot({ path: `test-results/fit-${mode}-${width}-${height}.png` });
    }
  });
}
