<script lang="ts">
  import { onMount } from 'svelte';
  import { transactionStore, walletStore, type UIWallet } from '../stores';
  import { toastStore } from '../stores/toast';
  import { formatRupiahInput, parseRupiahInput } from '../utils';

  export let model: UIWallet | null = null;
  export let editId: number | null = null;
  export let onsaved: (() => void) | undefined = undefined;
  export let oncancel: (() => void) | undefined = undefined;

  let nama = '';
  let saldo_awal = '';
  let adjustSaldo = false;
  let newCurrentSaldo = '';
  let currentSaldoOriginal = 0;
  let submitting = false;

  onMount(() => {
    if (model) {
      nama = model.nama;
      saldo_awal = String(model.saldo_awal);
      currentSaldoOriginal = model.saldo;
      newCurrentSaldo = String(model.saldo);
    }
  });

  async function handleSubmit(): Promise<void> {
    if (!nama.trim()) {
      toastStore.error('Nama dompet harus diisi.');
      return;
    }
    const parsedSaldoAwal = parseRupiahInput(saldo_awal);
    const parsedNewCurrentSaldo = parseRupiahInput(newCurrentSaldo);

    if (!Number.isFinite(parsedSaldoAwal) || !Number.isFinite(parsedNewCurrentSaldo)) {
      toastStore.error('Saldo harus berupa angka yang valid.');
      return;
    }

    submitting = true;
    try {
      if (editId !== null) {
        await walletStore.updateWallet(editId, { nama: nama.trim(), saldo_awal: parsedSaldoAwal });

        if (adjustSaldo && parsedNewCurrentSaldo !== currentSaldoOriginal) {
          const difference = parsedNewCurrentSaldo - currentSaldoOriginal;
          await transactionStore.addTransaction({
            tipe: difference > 0 ? 'income' : 'expense',
            nominal: Math.abs(difference),
            tanggal: Date.now(),
            wallet_id: editId,
            catatan: 'Penyesuaian saldo manual'
          });
        }
      } else {
        await walletStore.addWallet(nama.trim(), parsedSaldoAwal);
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
  class="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  onclick={handleBackdropClick}
  onkeydown={handleBackdropKeydown}
  role="presentation"
>
  <div
    class="bg-surface-container-lowest rounded-xl border border-outline-variant w-full max-w-sm relative overflow-hidden"
    role="dialog"
    aria-modal="true"
    aria-labelledby="wallet-form-title"
  >
    <form class="p-6" onsubmit={(event) => { event.preventDefault(); void handleSubmit(); }}>
      <h2 id="wallet-form-title" class="font-headline-md text-headline-md text-on-surface mb-6">
        {editId !== null ? 'Edit Dompet' : 'Tambah Dompet'}
      </h2>

      <div class="space-y-5">
        <div>
          <label for="wallet-name" class="block font-label-sm text-label-sm text-on-surface-variant mb-2">Nama Dompet</label>
          <input
            id="wallet-name"
            name="wallet-name"
            type="text"
            bind:value={nama}
            autocomplete="off"
            required
            placeholder="Contoh: Tunai, BCA, GoPay"
            class="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-surface-container-high text-on-surface font-medium placeholder:text-on-surface-variant placeholder:font-normal"
          />
        </div>

        {#if editId === null || !adjustSaldo}
          <div>
            <label for="wallet-initial-balance" class="block font-label-sm text-label-sm text-on-surface-variant mb-2">Saldo Awal (Rp)</label>
              <input
                id="wallet-initial-balance"
                name="wallet-initial-balance"
                type="text"
                inputmode="numeric"
                value={formatRupiahInput(saldo_awal)}
                oninput={(e) => { const raw = e.currentTarget.value.replace(/\D/g, ''); saldo_awal = raw; e.currentTarget.value = formatRupiahInput(raw); }}
                placeholder="0"
              class="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-surface-container-high text-on-surface font-medium"
            />
          </div>
        {/if}

        {#if editId !== null}
          <div class="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-variant rounded-lg">
            <input
              id="wallet-adjust-balance"
              name="wallet-adjust-balance"
              type="checkbox"
              bind:checked={adjustSaldo}
              class="mt-1 w-4 h-4 accent-primary rounded border-outline-variant"
            />
            <div>
              <label for="wallet-adjust-balance" class="font-label-md text-label-md font-bold text-on-surface">Sesuaikan Saldo Saat Ini</label>
              <p id="wallet-adjust-description" class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                Sistem akan membuat transaksi penyesuaian otomatis agar saldo akhir sesuai.
              </p>
            </div>
          </div>

          {#if adjustSaldo}
            <div>
              <label for="wallet-current-balance" class="block font-label-sm text-label-sm text-on-surface-variant mb-2">Saldo Baru (Rp)</label>
                <input
                  id="wallet-current-balance"
                  name="wallet-current-balance"
                  type="text"
                  inputmode="numeric"
                  value={formatRupiahInput(newCurrentSaldo)}
                  oninput={(e) => { const raw = e.currentTarget.value.replace(/\D/g, ''); newCurrentSaldo = raw; e.currentTarget.value = formatRupiahInput(raw); }}
                  aria-describedby="wallet-recorded-balance"
                class="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-surface-container-high text-on-surface font-medium"
              />
              <p id="wallet-recorded-balance" class="font-label-sm text-label-sm text-on-surface-variant mt-2 text-right">
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
          class="flex-1 px-4 py-3 bg-surface-container text-on-surface rounded-lg font-medium hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={submitting}
          class="flex-[2] bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-lg hover:bg-surface-tint transition-colors disabled:opacity-50"
        >
          {submitting ? 'Menyimpan…' : editId !== null ? 'Simpan' : 'Tambah'}
        </button>
      </div>
    </form>
  </div>
</div>
