import { expect, test, type Page } from '@playwright/test';

async function resetApp(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    const databases = await indexedDB.databases();
    await Promise.all(databases.map(({ name }) => new Promise<void>((resolve, reject) => {
      if (!name) return resolve();
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    })));
  });
  await page.reload();
  await expect(page.getByText('Total Saldo', { exact: true })).toBeVisible();
}

async function openTab(page: Page, name: 'Ringkasan' | 'Transaksi' | 'Hutang' | 'Patungan'): Promise<void> {
  await page.getByRole('navigation', { name: 'Navigasi utama' }).first().getByRole('button', { name, exact: true }).click();
}

async function addTransaction(page: Page, type: 'Pemasukan' | 'Pengeluaran', amount: string, note: string): Promise<void> {
  await openTab(page, 'Transaksi');
  await page.getByRole('button', { name: 'Tambah transaksi' }).click();
  const dialog = page.getByRole('dialog', { name: 'Tambah transaksi' });
  await dialog.getByRole('radio', { name: type }).check();
  await dialog.getByRole('spinbutton', { name: 'Nominal (Rp)' }).fill(amount);
  await dialog.getByRole('textbox', { name: 'Catatan' }).fill(note);
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(page.getByText(note, { exact: true }).first()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await resetApp(page);
});

test('fresh install renders seeded wallets', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Cash' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bank' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'E-Wallet' })).toBeVisible();
  await expect(page.getByText('3 dompet aktif')).toBeVisible();
});

test('income and expense update dashboard after navigation', async ({ page }) => {
  await addTransaction(page, 'Pemasukan', '150000', 'Gaji E2E');
  await addTransaction(page, 'Pengeluaran', '40000', 'Belanja E2E');

  await openTab(page, 'Ringkasan');
  const summary = page.getByLabel('Ringkasan keuangan');
  await expect(summary.getByText('Rp 150.000', { exact: true })).toBeVisible();
  await expect(summary.getByText('Rp 40.000', { exact: true })).toBeVisible();
  await expect(summary.getByRole('heading', { name: 'Rp 110.000' })).toBeVisible();
});

test('wallet transfer preserves total and appears in history', async ({ page }) => {
  await addTransaction(page, 'Pemasukan', '200000', 'Modal transfer');
  await openTab(page, 'Ringkasan');
  await expect(page.getByRole('heading', { name: 'Rp 200.000' })).toBeVisible();

  await openTab(page, 'Transaksi');
  await page.getByRole('button', { name: 'Tambah transaksi' }).click();
  const dialog = page.getByRole('dialog', { name: 'Tambah transaksi' });
  await dialog.getByRole('radio', { name: 'Transfer' }).check();
  await dialog.getByRole('spinbutton', { name: 'Nominal (Rp)' }).fill('75000');
  await dialog.getByRole('combobox', { name: 'Wallet', exact: true }).selectOption({ label: 'Cash' });
  await dialog.getByRole('combobox', { name: 'Wallet tujuan' }).selectOption({ label: 'Bank' });
  await dialog.getByRole('textbox', { name: 'Catatan' }).fill('Pindah dana E2E');
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(page.getByText('Pindah dana E2E', { exact: true })).toHaveCount(4); // Desktop + mobile views = 4 elements for 2 transactions

  await openTab(page, 'Ringkasan');
  await expect(page.getByRole('heading', { name: 'Rp 200.000' })).toBeVisible();
  await page.getByRole('tab', { name: 'Riwayat' }).click();
  await expect(page.getByText('Pindah dana E2E', { exact: true })).toHaveCount(4);
});

test('debt partial payment updates wallet and remaining amount', async ({ page }) => {
  await openTab(page, 'Hutang');
  await page.getByRole('button', { name: 'Catat' }).click();
  const debtDialog = page.getByRole('dialog', { name: 'Catat hutang/piutang' });
  await debtDialog.getByRole('textbox', { name: 'Nama' }).fill('Budi E2E');
  await debtDialog.getByRole('spinbutton', { name: 'Nominal' }).fill('100000');
  await debtDialog.getByRole('textbox', { name: 'Catatan' }).fill('Pinjaman E2E');
  await debtDialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(page.getByText('Pinjaman E2E', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Bayar' }).click();
  const paymentDialog = page.getByRole('dialog', { name: 'Catat pembayaran' });
  await paymentDialog.getByRole('spinbutton', { name: 'Nominal' }).fill('30000');
  const paymentWallet = paymentDialog.getByRole('combobox', { name: 'Wallet' });
  const cashOption = await paymentWallet.locator('option', { hasText: 'Cash' }).getAttribute('value');
  await paymentWallet.selectOption(cashOption!);
  await paymentDialog.getByRole('textbox', { name: 'Catatan' }).fill('Cicilan E2E');
  await paymentDialog.getByRole('button', { name: 'Simpan' }).click();

  const debtArticle = page.getByRole('article').filter({ hasText: 'Pinjaman E2E' });
  await expect(debtArticle.getByText('Rp 70.000', { exact: true })).toBeVisible();
  await expect(debtArticle.getByText('Riwayat pembayaran (1)', { exact: true })).toBeVisible();
  await debtArticle.getByRole('button', { name: 'Edit pembayaran' }).click();
  const editPaymentDialog = page.getByRole('dialog', { name: 'Edit pembayaran' });
  await editPaymentDialog.getByRole('spinbutton', { name: 'Nominal' }).fill('40000');
  await editPaymentDialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(debtArticle.getByText('Rp 60.000', { exact: true })).toBeVisible();
  await openTab(page, 'Ringkasan');
  await expect(page.getByRole('heading', { name: 'Rp 40.000' })).toBeVisible();
  const cashWallet = page.getByRole('heading', { name: 'Cash' }).locator('xpath=ancestor::article');
  await expect(cashWallet.getByText('Rp 40.000', { exact: true })).toBeVisible();
});

test('creates basic patungan through practical selectors', async ({ page }) => {
  await openTab(page, 'Patungan');
  await page.getByRole('button', { name: 'Buat Sesi' }).click();
  await page.getByPlaceholder('Nama Sesi (cth: Bukber SMA)').fill('Makan E2E');
  await page.getByPlaceholder('Nama item').fill('Pizza');
  await page.getByPlaceholder('Harga').fill('120000');
  await page.getByPlaceholder('Nama...').fill('Sari E2E');
  await expect(page.getByText('Partisipan (100%)')).toBeVisible();
  await page.getByRole('button', { name: /Selesai & Simpan/ }).click();

  await expect(page.getByRole('heading', { name: 'Makan E2E' })).toBeVisible();
  await expect(page.getByText('Sari E2E')).toBeVisible();
  await expect(page.getByText('Rp 120.000')).toBeVisible();
});

test('settings opens restore dialog with generated valid backup', async ({ page }) => {
  await page.getByRole('button', { name: /pengaturan/i }).first().click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Cadangkan data' }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).not.toBeNull();

  await page.getByTestId('backup-file-input').setInputFiles(backupPath!);
  const dialog = page.getByRole('dialog', { name: 'Pilih cara pemulihan' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/File terpilih:/)).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Ganti semua data' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Gabungkan data' })).toBeVisible();
});
