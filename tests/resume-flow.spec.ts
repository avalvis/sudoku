import { expect, test, type Page } from '@playwright/test';

async function ready(page: Page) {
  await expect(page.getByTestId('opening')).toHaveCount(0);
  await expect(page.locator('#main-content')).toBeVisible();
  const resume = page.getByRole('button', { name: 'Resume puzzle' });
  if (await resume.isVisible()) await resume.click();
}

test('saved progress gets an inline choice, a stopped clock, and keyboard resume', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await ready(page);
  const cell = page.getByTestId('cell-0-0');
  await cell.click(); await page.keyboard.press('n'); await page.keyboard.press('2');
  await page.reload();
  const panel = page.getByTestId('pause-panel');
  await expect(panel.getByRole('heading')).toHaveText('Continue your puzzle?');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const time = await page.getByTestId('timer').textContent();
  await page.clock.fastForward(30_000);
  await expect(page.getByTestId('timer')).toHaveText(time!);
  await page.keyboard.press('4');
  await expect(cell).toHaveAttribute('aria-label', /notes 2$/);
  await panel.getByRole('button', { name: 'Resume puzzle' }).focus();
  await page.keyboard.press('Enter');
  await expect(panel).toHaveCount(0); await expect(cell).toBeFocused();
  await page.getByRole('button', { name: 'Pause game' }).click();
  await expect(panel.getByRole('heading')).toHaveText('Paused');
  await page.getByRole('link', { name: 'Archive', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Archive' })).toBeVisible();
});

test('new-puzzle confirmation can be cancelled without losing saved progress', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.getByTestId('cell-0-0').click(); await page.keyboard.press('n'); await page.keyboard.press('2');
  await page.reload();
  await page.getByRole('button', { name: 'Start new puzzle' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('replaces your current progress');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start new puzzle' })).toBeFocused();
  await expect(page.getByTestId('cell-0-0')).toHaveAttribute('aria-label', /notes 2$/);
  await page.getByRole('button', { name: 'Start new puzzle' }).click();
  await page.getByRole('radio', { name: 'hard' }).check();
  await page.getByRole('button', { name: 'Start puzzle', exact: true }).click();
  await expect(page.getByTestId('pause-panel')).toHaveCount(0);
  await expect(page.getByText(/No. 6046/)).toBeVisible();
  await expect(page.getByTestId('timer')).toHaveText('00:00');
});

test('Daily pause offers Classic without discarding the Daily board', async ({ page }) => {
  await page.goto('/#daily');
  await expect(page.getByTestId('opening')).toHaveCount(0);
  const resume = page.getByRole('button', { name: 'Resume puzzle' });
  if (await resume.isVisible()) await resume.click();
  const cell = page.getByRole('gridcell', { name: /empty/ }).first();
  const id = (await cell.getAttribute('data-testid'))!;
  await cell.click(); await page.keyboard.press('n'); await page.keyboard.press('2');
  await page.getByRole('button', { name: 'Pause game' }).click();
  await expect(page.getByRole('button', { name: 'Start new puzzle' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Play Classic' }).click();
  await page.getByRole('link', { name: 'Daily', exact: true }).click();
  await page.getByRole('button', { name: 'Resume puzzle' }).click();
  await expect(page.getByTestId(id)).toHaveAttribute('aria-label', /notes 2$/);
});

for (const [width, height] of [[900, 700], [1280, 900], [1920, 1080]]) test(`pause panel fits at ${width}x${height} in both themes`, async ({ page }) => {
  await page.setViewportSize({ width, height }); await page.goto('/');
  await ready(page);
  await page.getByTestId('cell-0-0').click(); await page.keyboard.press('n'); await page.keyboard.press('2');
  await page.reload();
  const panel = page.getByTestId('pause-panel');
  await expect(panel).toBeVisible();
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    const frame = (await page.getByTestId('board-frame').boundingBox())!;
    const button = (await panel.getByRole('button', { name: 'Start new puzzle' }).boundingBox())!;
    expect(button.y + button.height).toBeLessThan(frame.y + frame.height);
    expect(button.x).toBeGreaterThan(frame.x);
    await page.screenshot({ path: `test-results/resume-${width}-${theme}.png`, fullPage: true });
  }
});
