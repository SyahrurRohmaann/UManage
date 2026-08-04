import { expect, test } from '@playwright/test';

test('dark mode toggle changes html class and applies styles', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Buka pengaturan' }).click();
  
  const toggle = page.getByRole('switch', { name: /mode gelap/i });
  await expect(toggle).toBeVisible();
  
  // Verify light mode initially
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  
  // Toggle to dark mode
  await toggle.click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  
  // Verify dark mode styles applied to shell
  const shell = page.locator('.uwangg-shell');
  await expect(shell).toHaveCSS('background-color', 'rgb(3, 7, 18)'); // #030712
});
