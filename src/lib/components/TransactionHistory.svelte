<script lang="ts">
  import { transactionStore } from '../stores';
  import { toastStore } from '../stores/toast';
  import ConfirmationDialog from './ConfirmationDialog.svelte';

  function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function transactionType(type: 'income' | 'expense' | 'transfer'): string {
    if (type === 'income') return 'Pemasukan';
    if (type === 'expense') return 'Pengeluaran';
    return 'Transfer';
  }

  let showConfirm = $state(false);
  let confirmTitle = $state('');
  let confirmMessage = $state('');
  let confirmText = $state('Hapus');
  let confirmAction = $state<(() => Promise<void>) | null>(null);

  async function handleDelete(id: number): Promise<void> {
    confirmTitle = 'Hapus Transaksi';
    confirmMessage = 'Hapus transaksi ini?';
    confirmText = 'Hapus';
    confirmAction = async () => {
      try {
        await transactionStore.deleteTransaction(id);
        toastStore.success('Transaksi berhasil dihapus.');
      } catch (error: unknown) {
        toastStore.error(error instanceof Error ? error.message : 'Transaksi gagal dihapus.');
      }
    };
    showConfirm = true;
  }
</script>

<section class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden" aria-labelledby="transaction-history-title">
  <div class="p-4 border-b border-outline-variant">
    <h2 id="transaction-history-title" class="font-headline-md text-headline-md text-on-background">Riwayat Transaksi</h2>
  </div>

  {#if $transactionStore.loading}
    <p class="p-8 text-center text-on-surface-variant" aria-live="polite">Memuat transaksi…</p>
  {:else if $transactionStore.error}
    <p class="p-4 text-on-error-container bg-error/10" role="alert">Gagal memuat transaksi: {$transactionStore.error}</p>
  {:else if $transactionStore.data.length === 0}
    <div class="p-8 text-center">
      <p class="text-on-surface-variant">Belum ada transaksi</p>
    </div>
  {:else}
    <div class="hidden lg:block">
      <table class="w-full text-left text-sm">
        <tbody class="divide-y divide-outline-variant">
          {#each $transactionStore.data as transaction (transaction.id)}
            <tr class="hover:bg-surface-bright transition-colors">
              <td class="p-4 w-1/2">
                <p class="font-bold text-on-surface truncate">{transaction.catatan || 'Tanpa catatan'}</p>
                <p class="font-label-sm text-label-sm text-on-surface-variant mt-1">{formatDate(transaction.tanggal)} • {formatTime(transaction.tanggal)}</p>
              </td>
              <td class="p-4 text-right">
                <p class="{transaction.tipe === 'income' ? 'text-secondary' : transaction.tipe === 'expense' ? 'text-error' : 'text-primary'} font-bold">
                  {transaction.tipe === 'income' ? '+' : transaction.tipe === 'expense' ? '-' : ''}{formatRupiah(transaction.nominal)}
                </p>
                <p class="font-label-sm text-label-sm text-on-surface-variant mt-1">{transactionType(transaction.tipe)}</p>
              </td>
              <td class="p-4 text-right w-20">
                {#if transaction.id !== undefined}
                  <button
                    type="button"
                    onclick={() => void handleDelete(transaction.id!)}
                    aria-label={`Hapus transaksi ${transaction.catatan || transactionType(transaction.tipe)}`}
                    class="font-label-sm text-label-sm font-bold text-error hover:bg-error/10 px-2 py-1 rounded transition-colors"
                  >
                    Hapus
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile view -->
    <div class="divide-y divide-outline-variant lg:hidden">
      {#each $transactionStore.data as transaction (transaction.id)}
        <article class="p-4 hover:bg-surface-bright transition-colors">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-on-surface truncate">{transaction.catatan || 'Tanpa catatan'}</p>
              <p class="font-label-sm text-label-sm text-on-surface-variant mt-1">
                {formatDate(transaction.tanggal)} • {formatTime(transaction.tanggal)}
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="{transaction.tipe === 'income' ? 'text-secondary' : transaction.tipe === 'expense' ? 'text-error' : 'text-primary'} font-bold">
                {transaction.tipe === 'income' ? '+' : transaction.tipe === 'expense' ? '-' : ''}{formatRupiah(transaction.nominal)}
              </p>
              <p class="font-label-sm text-label-sm text-on-surface-variant mt-1">{transactionType(transaction.tipe)}</p>
            </div>
          </div>
          {#if transaction.id !== undefined}
            <button
              type="button"
              onclick={() => void handleDelete(transaction.id!)}
              aria-label={`Hapus transaksi ${transaction.catatan || transactionType(transaction.tipe)}`}
              class="mt-2 font-label-sm text-label-sm text-error hover:underline"
            >
              Hapus
            </button>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</section>
