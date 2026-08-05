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

  let showConfirm = false;
  let confirmTitle = '';
  let confirmMessage = '';
  let confirmText = 'Hapus';
  let confirmAction: (() => Promise<void>) | null = null;

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

<section class="bg-surface-card rounded-xl shadow-md overflow-hidden" aria-labelledby="transaction-history-title">
  <div class="p-4 border-b border-gray-200">
    <h2 id="transaction-history-title" class="font-semibold text-gray-800">Riwayat Transaksi</h2>
  </div>

  {#if $transactionStore.loading}
    <p class="p-8 text-center text-gray-500" aria-live="polite">Memuat transaksi…</p>
  {:else if $transactionStore.error}
    <p class="p-4 text-coral-dark bg-red-50" role="alert">Gagal memuat transaksi: {$transactionStore.error}</p>
  {:else if $transactionStore.data.length === 0}
    <div class="p-8 text-center">
      <p class="text-gray-500">Belum ada transaksi</p>
    </div>
  {:else}
    <div class="hidden lg:block">
      <table class="w-full text-left text-sm">
        <tbody class="divide-y divide-border">
          {#each $transactionStore.data as transaction (transaction.id)}
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="p-4 w-1/2">
                <p class="font-bold text-text-primary truncate">{transaction.catatan || 'Tanpa catatan'}</p>
                <p class="text-xs text-text-secondary mt-1">{formatDate(transaction.tanggal)} • {formatTime(transaction.tanggal)}</p>
              </td>
              <td class="p-4 text-right">
                <p class="{transaction.tipe === 'income' ? 'text-success' : transaction.tipe === 'expense' ? 'text-danger' : 'text-primary'} font-bold">
                  {transaction.tipe === 'income' ? '+' : transaction.tipe === 'expense' ? '-' : ''}{formatRupiah(transaction.nominal)}
                </p>
                <p class="text-xs text-text-secondary mt-1">{transactionType(transaction.tipe)}</p>
              </td>
              <td class="p-4 text-right w-20">
                {#if transaction.id !== undefined}
                  <button
                    type="button"
                    onclick={() => void handleDelete(transaction.id!)}
                    aria-label={`Hapus transaksi ${transaction.catatan || transactionType(transaction.tipe)}`}
                    class="text-xs font-bold text-coral hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
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
    <div class="divide-y divide-gray-100 lg:hidden">
      {#each $transactionStore.data as transaction (transaction.id)}
        <article class="p-4 hover:bg-gray-50 transition-colors">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">{transaction.catatan || 'Tanpa catatan'}</p>
              <p class="text-xs text-gray-500 mt-1">
                {formatDate(transaction.tanggal)} • {formatTime(transaction.tanggal)}
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="{transaction.tipe === 'income' ? 'text-success' : transaction.tipe === 'expense' ? 'text-danger' : 'text-primary'} font-bold">
                {transaction.tipe === 'income' ? '+' : transaction.tipe === 'expense' ? '-' : ''}{formatRupiah(transaction.nominal)}
              </p>
              <p class="text-xs text-gray-500 mt-1">{transactionType(transaction.tipe)}</p>
            </div>
          </div>
          {#if transaction.id !== undefined}
            <button
              type="button"
              onclick={() => void handleDelete(transaction.id!)}
              aria-label={`Hapus transaksi ${transaction.catatan || transactionType(transaction.tipe)}`}
              class="mt-2 text-xs text-red-600 hover:text-red-700"
            >
              Hapus
            </button>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</section>
