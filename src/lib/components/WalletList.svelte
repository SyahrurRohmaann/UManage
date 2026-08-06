<script lang="ts">
  import { initStores, walletStore, type UIWallet } from '../stores';
  import { toastStore } from '../stores/toast';
  import WalletForm from './WalletForm.svelte';
  import ConfirmationDialog from './ConfirmationDialog.svelte';

  let showForm = false;
  let editingWallet: UIWallet | null = null;
  let editingId: number | null = null;

  let showConfirm = false;
  let confirmTitle = '';
  let confirmMessage = '';
  let confirmText = 'Hapus';
  let confirmAction: (() => Promise<void>) | null = null;

  void initStores().catch((error: unknown) => {
    toastStore.error(error instanceof Error ? error.message : 'Dompet tidak dapat dimuat.');
  });

  function openAdd(): void {
    editingWallet = null;
    editingId = null;
    showForm = true;
  }

  function openEdit(wallet: UIWallet): void {
    editingWallet = { ...wallet };
    editingId = wallet.id ?? null;
    showForm = true;
  }

  async function handleDelete(walletId: number): Promise<void> {
    confirmTitle = 'Hapus Dompet';
    confirmMessage = 'Hapus dompet ini?';
    confirmText = 'Hapus';
    confirmAction = async () => {
      try {
        await walletStore.deleteWallet(walletId);
        toastStore.success('Dompet berhasil dihapus.');
      } catch (error: unknown) {
        const detail = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
        toastStore.error(`Dompet gagal dihapus: ${detail}`);
      }
    };
    showConfirm = true;
  }

  function closeForm(): void {
    showForm = false;
    editingWallet = null;
    editingId = null;
  }
</script>

<div class="space-y-4">
  <div class="flex justify-between items-center mb-4">
    <h2 class="font-headline-md text-headline-md text-on-background">Dompet Saya</h2>
    <button
      type="button"
      onclick={openAdd}
      class="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-surface-tint transition-colors active:scale-95 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
      <span>Tambah</span>
    </button>
  </div>

  {#if $walletStore.loading}
    <p class="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant text-center text-on-surface-variant" aria-live="polite">Memuat dompet…</p>
  {:else if $walletStore.error}
    <p class="bg-error/10 p-4 rounded-lg text-on-error-container" role="alert">Gagal memuat dompet: {$walletStore.error}</p>
  {:else if $walletStore.data.length === 0}
    <div class="bg-surface-container-lowest p-10 rounded-xl border-[3px] border-dashed border-outline-variant text-center">
      <p class="text-on-surface-variant font-medium">Belum ada dompet</p>
      <button type="button" onclick={openAdd} class="text-primary font-bold mt-3 hover:underline">Tambah sekarang</button>
    </div>
  {:else}
    {#each $walletStore.data as wallet (wallet.id)}
      <article class="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 relative overflow-hidden">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="font-headline-md text-headline-md text-on-surface mb-1">{wallet.nama}</h3>
            <p class="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-low inline-block px-2 py-1 rounded-full">
              Dibuat: {new Date(wallet.created_at).toLocaleDateString('id-ID')}
            </p>
          </div>
          <div class="text-right">
            <p class="font-headline-lg text-headline-lg tracking-tight {wallet.saldo >= 0 ? 'text-primary' : 'text-error'}">
              Rp {Math.abs(wallet.saldo).toLocaleString('id-ID')}
            </p>
            <p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-1">Saldo</p>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-outline-variant flex gap-3">
          <button
            type="button"
            onclick={() => openEdit(wallet)}
            class="flex-1 bg-primary text-on-primary font-bold px-4 py-2 rounded-lg hover:bg-surface-tint transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onclick={() => { if (wallet.id !== undefined) void handleDelete(wallet.id); }}
            disabled={wallet.id === undefined}
            aria-label={`Hapus dompet ${wallet.nama}`}
            class="flex-1 bg-error/10 text-error font-bold px-4 py-2 rounded-lg hover:bg-error hover:text-on-error transition-colors disabled:opacity-50"
          >
            Hapus
          </button>
        </div>
      </article>
    {/each}
  {/if}

  {#if showForm}
    <WalletForm model={editingWallet} editId={editingId} onsaved={closeForm} oncancel={closeForm} />
  {/if}
</div>
