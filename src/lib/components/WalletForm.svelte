<script lang="ts">
  import { onMount } from 'svelte';
  import { transactionStore, walletStore, type UIWallet } from '../stores';
  import { toastStore } from '../stores/toast';

  export let model: UIWallet | null = null;
  export let editId: number | null = null;
  export let onsaved: (() => void) | undefined = undefined;
  export let oncancel: (() => void) | undefined = undefined;

  let nama = '';
  let saldo_awal = 0;
  let adjustSaldo = false;
  let newCurrentSaldo = 0;
  let currentSaldoOriginal = 0;
  let submitting = false;

  onMount(() => {
    if (model) {
      nama = model.nama;
      saldo_awal = model.saldo_awal;
      currentSaldoOriginal = model.saldo;
      newCurrentSaldo = model.saldo;
    }
  });

  async function handleSubmit(): Promise<void> {
    if (!nama.trim()) {
      toastStore.error('Nama dompet harus diisi.');
      return;
    }
    if (!Number.isFinite(saldo_awal) || !Number.isFinite(newCurrentSaldo)) {
      toastStore.error('Saldo harus berupa angka yang valid.');
      return;
    }

    submitting = true;
    try {
      if (editId !== null) {
        await walletStore.updateWallet(editId, { nama: nama.trim(), saldo_awal });

        if (adjustSaldo && newCurrentSaldo !== currentSaldoOriginal) {
          const difference = newCurrentSaldo - currentSaldoOriginal;
          await transactionStore.addTransaction({
            tipe: difference > 0 ? 'income' : 'expense',
            nominal: Math.abs(difference),
            tanggal: Date.now(),
            wallet_id: editId,
            catatan: 'Penyesuaian saldo manual'
          });
        }
      } else {
        await walletStore.addWallet(nama.trim(), saldo_awal);
      }
      onsaved?.();
      toastStore.success(editId !== null ? 'Dompet diperbarui.' : 'Dompet berhasil ditambahkan.');
    } catch (error: unknown) {
      toastStore.error(`Gagal menyimpan dompet: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      submitting = false;
    }
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) oncancel?.();
  }

  function handleBackdropKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') oncancel?.();
  }
</script>

<div
  class="fixed inset-0 bg-primary-dark/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  onclick={handleBackdropClick}
  onkeydown={handleBackdropKeydown}
  role="presentation"
>
  <div
    class="bg-surface-card rounded-xl shadow-xl w-full max-w-sm relative overflow-hidden transform transition-all"
    role="dialog"
    aria-modal="true"
    aria-labelledby="wallet-form-title"
  >
    <div class="h-2 bg-gradient-to-r from-primary to-accent w-full"></div>

    <form class="p-6" onsubmit={(event) => { event.preventDefault(); void handleSubmit(); }}>
      <h2 id="wallet-form-title" class="text-2xl font-extrabold text-primary-dark mb-6">
        {editId !== null ? 'Edit Dompet' : 'Tambah Dompet'}
      </h2>

      <div class="space-y-5">
        <div>
          <label for="wallet-name" class="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wide">Nama Dompet</label>
          <input
            id="wallet-name"
            name="wallet-name"
            type="text"
            bind:value={nama}
            autocomplete="off"
            required
            placeholder="Contoh: Tunai, BCA, GoPay"
            class="w-full px-4 py-3 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors border-2 border-transparent rounded-lg focus:border-accent focus:bg-surface-card focus:shadow-focus transition-all text-text-primary font-bold placeholder:text-gray-400 placeholder:font-medium"
          />
        </div>

        {#if editId === null || !adjustSaldo}
          <div>
            <label for="wallet-initial-balance" class="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wide">Saldo Awal (Rp)</label>
            <input
              id="wallet-initial-balance"
              name="wallet-initial-balance"
              type="number"
              bind:value={saldo_awal}
              step="1000"
              placeholder="0"
              class="w-full px-4 py-3 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors border-2 border-transparent rounded-lg focus:border-accent focus:bg-surface-card focus:shadow-focus transition-all text-text-primary font-bold"
            />
          </div>
        {/if}

        {#if editId !== null}
          <div class="flex items-start gap-3 p-3 bg-primary-bg/50 border border-primary-light/30 rounded-xl">
            <input
              id="wallet-adjust-balance"
              name="wallet-adjust-balance"
              type="checkbox"
              bind:checked={adjustSaldo}
              class="mt-1 w-4 h-4 text-primary accent-primary rounded border-gray-300"
            />
            <div>
              <label for="wallet-adjust-balance" class="text-sm font-bold text-primary-dark">Sesuaikan Saldo Saat Ini</label>
              <p id="wallet-adjust-description" class="text-xs font-medium text-primary-dark/70 mt-0.5">
                Sistem akan membuat transaksi penyesuaian otomatis agar saldo akhir sesuai.
              </p>
            </div>
          </div>

          {#if adjustSaldo}
            <div>
              <label for="wallet-current-balance" class="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wide">Saldo Baru (Rp)</label>
              <input
                id="wallet-current-balance"
                name="wallet-current-balance"
                type="number"
                bind:value={newCurrentSaldo}
                step="1000"
                aria-describedby="wallet-recorded-balance"
                class="w-full px-4 py-3 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors border-2 border-transparent rounded-lg focus:border-accent focus:bg-surface-card focus:shadow-focus transition-all text-text-primary font-bold"
              />
              <p id="wallet-recorded-balance" class="text-xs text-text-muted mt-2 font-bold text-right">
                Saldo tercatat: Rp {currentSaldoOriginal.toLocaleString('id-ID')}
              </p>
            </div>
          {/if}
        {/if}
      </div>

      <div class="mt-8 flex gap-3">
        <button
          type="button"
          onclick={() => oncancel?.()}
          disabled={submitting}
          class="flex-1 px-4 py-3 bg-gray-100 rounded-lg text-text-secondary font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={submitting}
          class="flex-[2] bg-gradient-to-r from-primary to-primary-light text-white dark:text-primary-bg px-6 py-3 rounded-lg shadow-sm hover:scale-[0.98] transition-transform font-extrabold text-lg disabled:opacity-50"
        >
          {submitting ? 'Menyimpan…' : editId !== null ? 'Simpan' : 'Tambah'}
        </button>
      </div>
    </form>
  </div>
</div>
