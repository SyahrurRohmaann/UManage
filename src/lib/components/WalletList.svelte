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
    <h2 class="text-xl font-extrabold text-text-primary tracking-wide">Dompet Saya</h2>
    <button
      type="button"
      onclick={openAdd}
      class="bg-primary from-accent-light to-accent-dark px-5 py-2.5 rounded-lg shadow-sm hover:scale-95 transition-transform font-bold flex items-center gap-2 active:bg-accent-light"
    >
      <span class="text-lg leading-none text-white dark:text-primary-bg" aria-hidden="true">+</span>
      <span class="text-white dark:text-primary-bg">Tambah</span>
    </button>
  </div>

  {#if $walletStore.loading}
    <p class="bg-surface-card p-8 rounded-xl shadow-card text-center text-text-muted" aria-live="polite">Memuat dompet…</p>
  {:else if $walletStore.error}
    <p class="bg-red-50 p-4 rounded-xl text-coral-dark" role="alert">Gagal memuat dompet: {$walletStore.error}</p>
  {:else if $walletStore.data.length === 0}
    <div class="bg-surface-card p-10 rounded-xl shadow-card text-center border-[3px] border-dashed border-gray-200">
      <p class="text-text-secondary font-medium">Belum ada dompet</p>
      <button type="button" onclick={openAdd} class="text-primary font-bold mt-3 hover:text-primary-light">Tambah sekarang</button>
    </div>
  {:else}
    {#each $walletStore.data as wallet (wallet.id)}
      <article class="bg-surface-card rounded-xl shadow-card p-5 border-l-[6px] {wallet.saldo >= 0 ? 'border-primary-light' : 'border-coral'} relative overflow-hidden group">
        <div class="flex justify-between items-start relative z-10">
          <div class="flex-1">
            <h3 class="font-extrabold text-xl text-text-primary mb-1">{wallet.nama}</h3>
            <p class="text-xs font-medium text-text-muted bg-gray-50 inline-block px-2 py-1 rounded-sm">
              Dibuat: {new Date(wallet.created_at).toLocaleDateString('id-ID')}
            </p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-extrabold {wallet.saldo >= 0 ? 'text-primary' : 'text-coral'}">
              Rp {Math.abs(wallet.saldo).toLocaleString('id-ID')}
            </p>
            <p class="text-xs font-bold text-text-secondary uppercase tracking-wider mt-1">Saldo</p>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-dashed border-gray-100 flex gap-3 relative z-10">
          <button
            type="button"
            onclick={() => openEdit(wallet)}
            class="flex-1 bg-primary-bg text-primary-dark font-bold px-4 py-2 rounded-lg hover:bg-primary-light hover:text-white transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onclick={() => { if (wallet.id !== undefined) void handleDelete(wallet.id); }}
            disabled={wallet.id === undefined}
            aria-label={`Hapus dompet ${wallet.nama}`}
            class="flex-1 bg-red-50 text-coral-dark dark:text-primary-bg font-bold px-4 py-2 rounded-lg hover:bg-coral hover:text-white transition-colors disabled:opacity-50"
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
