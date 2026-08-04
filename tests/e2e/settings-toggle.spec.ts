import { expect, test } from '@playwright/test';

test('settings button toggles between previous tab and settings', async ({ page }) => {
  await page.goto('/');
  
  // Verify initially on Dashboard
  await expect(page.getByText('Ringkasan keuangan', { exact: true })).toBeVisible();
  
  const settingsBtn = page.getByRole('button', { name: /pengaturan/i });
  
  // Click to open settings
  await settingsBtn.click();
  
  // Verify Settings is open
  await expect(page.getByRole('heading', { name: 'Tampilan' })).toBeVisible();
  // Ensure dashboard is hidden
  await expect(page.getByText('Ringkasan keuangan', { exact: true })).toBeHidden();
  
  // Click again to close settings (toggle back)
  await settingsBtn.click();
  
  // Verify back to Dashboard
  await expect(page.getByText('Ringkasan keuangan', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tampilan' })).toBeHidden();

  // Try going to Transactions tab, then opening and closing settings
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('button', { name: 'Transaksi', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Transaksi' })).toBeVisible();
  
  await settingsBtn.click();
  await expect(page.getByRole('heading', { name: 'Tampilan' })).toBeVisible();
  
  await settingsBtn.click();
  // Verify returned to Transactions, not Dashboard
  await expect(page.getByRole('heading', { name: 'Transaksi' })).toBeVisible();
});
