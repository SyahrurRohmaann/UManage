<script lang="ts">
  import type { Category, Transaction } from '../db';
  import { categoryStore, transactionStore, walletStore } from '../stores';
  import { toastStore } from '../stores/toast';
  import ConfirmationDialog from './ConfirmationDialog.svelte';

  const transactionState = $derived($transactionStore);
  const walletState = $derived($walletStore);
  const categoryState = $derived($categoryStore);
  const transactions = $derived(transactionState.data);
  const wallets = $derived(walletState.data);
  const categories = $derived(categoryState.data);

  let showTransactionForm = $state(false);
  let showCategories = $state(false);
  let editingTransactionId = $state<number | undefined>();
  let editingCategoryId = $state<number | undefined>();

  let searchQuery = $state('');
  let filterType = $state<'all' | 'income' | 'expense' | 'transfer'>('all');
  let filterWallet = $state(0);
  let filterCategory = $state(0);
  let filterDateFrom = $state('');
  let filterDateTo = $state('');

  let transactionType = $state<'income' | 'expense' | 'transfer'>('expense');
  let transactionAmount = $state('');
  let transactionDate = $state(today());
  let transactionWalletId = $state(0);
  let transferDestinationWalletId = $state(0);
  let transactionCategoryId = $state(0);
  let transactionNote = $state('');
  let transactionTag = $state('');

  let categoryName = $state('');
  let categoryType = $state<'income' | 'expense'>('expense');
  let categoryIcon = $state('circle');
  let categoryColor = $state('#EF6C4A');

  let showConfirm = $state(false);
  let confirmTitle = $state('');
  let confirmMessage = $state('');
  let confirmText = $state('Hapus');
  let confirmAction: (() => Promise<void>) | null = null;

  let categoryFormElement: HTMLElement | null = $state(null);

  function today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(value);
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  function walletName(id: number): string {
    return wallets.find((wallet) => wallet.id === id)?.nama ?? 'Wallet dihapus';
  }

  function categoryNameFor(id: number | undefined): string {
    return categories.find((category) => category.id === id)?.nama ?? 'Tanpa kategori';
  }

  function openCreateTransaction(): void {
    editingTransactionId = undefined;
    transactionType = 'expense';
    transactionAmount = '';
    transactionDate = today();
    transactionWalletId = wallets[0]?.id ?? 0;
    transferDestinationWalletId = wallets[1]?.id ?? 0;
    transactionCategoryId = 0;
    transactionNote = '';
    transactionTag = '';
    showTransactionForm = true;
  }

  function openEditTransaction(transaction: Transaction): void {
    if (transaction.id === undefined || transaction.tipe === 'transfer') return;
    editingTransactionId = transaction.id;
    transactionType = transaction.tipe;
    transactionAmount = String(transaction.nominal);
    transactionDate = new Date(transaction.tanggal).toISOString().slice(0, 10);
    transactionWalletId = transaction.wallet_id;
    transactionCategoryId = transaction.category_id ?? 0;
    transactionNote = transaction.catatan ?? '';
    transactionTag = transaction.tag ?? '';
    showTransactionForm = true;
  }

  async function saveTransaction(): Promise<void> {
    const amount = Number(transactionAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toastStore.error('Masukkan nominal yang valid.');
      return;
    }
    if (!transactionWalletId) {
      toastStore.error('Pilih wallet terlebih dahulu.');
      return;
    }

    if (transactionType === 'transfer') {
      if (!transferDestinationWalletId || transferDestinationWalletId === transactionWalletId) {
        toastStore.error('Pilih wallet tujuan yang berbeda.');
        return;
      }
      try {
        await transactionStore.addTransfer({
          fromWalletId: transactionWalletId,
          toWalletId: transferDestinationWalletId,
          nominal: amount,
          tanggal: new Date(`${transactionDate}T00:00:00`).getTime(),
          catatan: transactionNote.trim() || undefined,
          tag: transactionTag.trim() || undefined
        });
        showTransactionForm = false;
        toastStore.success('Transfer berhasil dicatat.');
      } catch (error) {
        toastStore.error(`Gagal menyimpan transfer: ${errorMessage(error)}`);
      }
      return;
    }

    const data = {
      tipe: transactionType,
      nominal: amount,
      tanggal: new Date(`${transactionDate}T00:00:00`).getTime(),
      wallet_id: transactionWalletId,
      category_id: transactionCategoryId || undefined,
      catatan: transactionNote.trim() || undefined,
      tag: transactionTag.trim() || undefined
    };

    try {
      if (editingTransactionId === undefined) {
        await transactionStore.addTransaction(data);
        toastStore.success('Transaksi berhasil ditambahkan.');
      } else {
        await transactionStore.updateTransaction(editingTransactionId, data);
        toastStore.success('Transaksi berhasil diperbarui.');
      }
      showTransactionForm = false;
    } catch (error) {
      toastStore.error(`Gagal menyimpan transaksi: ${errorMessage(error)}`);
    }
  }

  async function deleteTransaction(transaction: Transaction): Promise<void> {
    if (transaction.id === undefined) return;
    confirmTitle = 'Hapus Transaksi';
    confirmMessage = `Hapus transaksi ${transaction.catatan || formatRupiah(transaction.nominal)}? Tindakan ini tidak dapat dibatalkan.`;
    confirmText = 'Hapus';
    confirmAction = async () => {
      try {
        await transactionStore.deleteTransaction(transaction.id!);
        toastStore.success('Transaksi berhasil dihapus.');
      } catch (error) {
        toastStore.error(`Gagal menghapus transaksi: ${errorMessage(error)}`);
      }
    };
    showConfirm = true;
  }

  function resetCategoryForm(): void {
    editingCategoryId = undefined;
    categoryName = '';
    categoryType = 'expense';
    categoryIcon = 'circle';
    categoryColor = '#EF6C4A';
  }

  function editCategory(category: Category): void {
    editingCategoryId = category.id;
    categoryName = category.nama;
    categoryType = category.tipe;
    categoryIcon = category.ikon;
    categoryColor = category.warna;
    // Scroll ke form kategori
    setTimeout(() => {
      categoryFormElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  }

  async function saveCategory(): Promise<void> {
    if (!categoryName.trim()) {
      toastStore.error('Nama kategori harus diisi.');
      return;
    }
    const data = { nama: categoryName.trim(), tipe: categoryType, ikon: categoryIcon.trim() || 'circle', warna: categoryColor };
    try {
      if (editingCategoryId === undefined) {
        await categoryStore.addCategory(data);
        toastStore.success('Kategori berhasil ditambahkan.');
      } else {
        await categoryStore.updateCategory(editingCategoryId, data);
        toastStore.success('Kategori berhasil diperbarui.');
      }
      resetCategoryForm();
    } catch (error) {
      toastStore.error(`Gagal menyimpan kategori: ${errorMessage(error)}`);
    }
  }

  async function deleteCategory(category: Category): Promise<void> {
    if (category.id === undefined) return;
    confirmTitle = 'Hapus Kategori';
    confirmMessage = `Hapus kategori ${category.nama}? Tindakan ini tidak dapat dibatalkan.`;
    confirmText = 'Hapus';
    confirmAction = async () => {
      try {
        await categoryStore.deleteCategory(category.id!);
        if (editingCategoryId === category.id) resetCategoryForm();
        toastStore.success('Kategori berhasil dihapus.');
      } catch (error) {
        toastStore.error(`Kategori tidak dapat dihapus: ${errorMessage(error)}`);
      }
    };
    showConfirm = true;
  }

  const filteredTransactions = $derived.by(() => {
    const query = searchQuery.trim().toLocaleLowerCase('id-ID');
    const from = filterDateFrom ? new Date(`${filterDateFrom}T00:00:00`).getTime() : undefined;
    const to = filterDateTo ? new Date(`${filterDateTo}T23:59:59.999`).getTime() : undefined;
    return transactions.filter((transaction) => {
      const searchable = `${transaction.catatan ?? ''} ${transaction.tag ?? ''}`.toLocaleLowerCase('id-ID');
      const isTransfer = transaction.tag?.split(/\s+/).some((tag) => tag.startsWith('transfer:')) ?? false;
      const matchesType = filterType === 'all'
        || (filterType === 'transfer' ? isTransfer : !isTransfer && transaction.tipe === filterType);
      return (!query || searchable.includes(query))
        && matchesType
        && (!filterWallet || transaction.wallet_id === filterWallet)
        && (!filterCategory || transaction.category_id === filterCategory)
        && (from === undefined || transaction.tanggal >= from)
        && (to === undefined || transaction.tanggal <= to);
    });
  });

</script>

<div class="space-y-6">
  <header class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 class="text-xl font-extrabold text-text-primary">Transaksi</h2>
      <p class="text-sm text-text-muted">Catat pemasukan dan pengeluaran harian.</p>
    </div>
    <div class="flex gap-2">
      <button type="button" onclick={() => showCategories = true} class="rounded-lg border-2 border-primary px-4 py-2 font-bold text-primary">Kelola kategori</button>
      <button type="button" onclick={openCreateTransaction} class="rounded-lg bg-primary px-5 py-2.5 font-bold text-white dark:text-primary-bg shadow-sm">Tambah transaksi</button>
    </div>
  </header>

  <section aria-labelledby="filter-heading" class="space-y-4 rounded-xl bg-surface-card p-5 shadow-card">
    <h3 id="filter-heading" class="font-extrabold text-text-primary">Filter riwayat</h3>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label class="text-sm font-bold text-text-secondary">Cari catatan atau tag
        <input type="search" bind:value={searchQuery} placeholder="Contoh: makan, kantor" class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3 font-medium focus:ring-2 focus:ring-accent" />
      </label>
      <label class="text-sm font-bold text-text-secondary">Dari tanggal
        <input type="date" bind:value={filterDateFrom} class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3" />
      </label>
      <label class="text-sm font-bold text-text-secondary">Sampai tanggal
        <input type="date" bind:value={filterDateTo} class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3" />
      </label>
      <label class="text-sm font-bold text-text-secondary">Tipe
        <select bind:value={filterType} class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3"><option value="all">Semua tipe</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option><option value="transfer">Transfer</option></select>
      </label>
      <label class="text-sm font-bold text-text-secondary">Wallet
        <select bind:value={filterWallet} class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3"><option value={0}>Semua wallet</option>{#each wallets as wallet (wallet.id)}<option value={wallet.id}>{wallet.nama}</option>{/each}</select>
      </label>
      <label class="text-sm font-bold text-text-secondary">Kategori
        <select bind:value={filterCategory} class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3"><option value={0}>Semua kategori</option>{#each categories as category (category.id)}<option value={category.id}>{category.nama}</option>{/each}</select>
      </label>
    </div>
  </section>

  {#if transactionState.error || walletState.error || categoryState.error}
    <p role="alert" class="rounded-lg bg-red-50 p-4 font-bold text-red-700">Data gagal dimuat: {transactionState.error ?? walletState.error ?? categoryState.error}</p>
  {:else if transactionState.loading || walletState.loading || categoryState.loading}
    <p class="rounded-xl bg-surface-card p-8 text-center text-text-muted">Memuat transaksi...</p>
  {:else if filteredTransactions.length === 0}
    <p class="rounded-xl border-2 border-dashed border-gray-200 bg-surface-card p-10 text-center text-text-secondary">Belum ada transaksi yang sesuai.</p>
  {:else}
    <!-- Desktop Table View -->
    <div class="hidden lg:block bg-surface-card rounded-xl shadow-card overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 border-b border-border text-text-secondary">
          <tr>
            <th class="p-4 font-bold">Catatan</th>
            <th class="p-4 font-bold">Tanggal</th>
            <th class="p-4 font-bold">Kategori</th>
            <th class="p-4 font-bold">Wallet</th>
            <th class="p-4 font-bold">Tag</th>
            <th class="p-4 font-bold text-right">Nominal</th>
            <th class="p-4 font-bold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each filteredTransactions as transaction (transaction.id)}
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="p-4 font-bold text-text-primary">{transaction.catatan || '-'}</td>
              <td class="p-4 text-text-secondary">{formatDate(transaction.tanggal)}</td>
              <td class="p-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-surface-base border border-border">
                  <span class="w-2 h-2 rounded-full" style="background-color: {categories.find(c => c.id === transaction.category_id)?.warna || '#cbd5e1'}"></span>
                  {categoryNameFor(transaction.category_id)}
                </span>
              </td>
              <td class="p-4 text-text-secondary">{walletName(transaction.wallet_id)}</td>
              <td class="p-4 text-text-secondary">{transaction.tag ? `#${transaction.tag}` : '-'}</td>
              <td class="p-4 text-right font-extrabold {transaction.tipe === 'income' ? 'text-success' : 'text-coral'}">
                {transaction.tipe === 'income' ? '+' : '-'}{formatRupiah(transaction.nominal)}
              </td>
              <td class="p-4 text-right">
                <button type="button" onclick={() => openEditTransaction(transaction)} class="px-2 py-1 text-xs font-bold text-primary hover:bg-primary-bg rounded transition-colors">Edit</button>
                <button type="button" onclick={() => deleteTransaction(transaction)} class="px-2 py-1 text-xs font-bold text-coral hover:bg-red-50 rounded transition-colors ml-1">Hapus</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile Card View -->
    <div class="space-y-3 lg:hidden">
      {#each filteredTransactions as transaction (transaction.id)}
        <article class="flex flex-wrap items-center justify-between gap-4 rounded-xl border-l-[6px] bg-surface-card p-4 shadow-card {transaction.tipe === 'income' ? 'border-success' : 'border-coral'}">
          <div class="min-w-0 flex-1">
            <p class="font-extrabold text-text-primary">{transaction.catatan || categoryNameFor(transaction.category_id)}</p>
            <p class="mt-1 text-sm text-text-muted">{formatDate(transaction.tanggal)} · {walletName(transaction.wallet_id)} · {categoryNameFor(transaction.category_id)}</p>
            {#if transaction.tag}<p class="mt-2 inline-block rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-text-secondary">#{transaction.tag}</p>{/if}
          </div>
          <p class="text-lg font-extrabold {transaction.tipe === 'income' ? 'text-success' : 'text-coral'}">{transaction.tipe === 'income' ? '+' : '-'}{formatRupiah(transaction.nominal)}</p>
          <div class="flex gap-2">
            <button type="button" onclick={() => openEditTransaction(transaction)} class="rounded-lg border px-3 py-2 text-sm font-bold text-primary">Edit</button>
            <button type="button" onclick={() => deleteTransaction(transaction)} class="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700">Hapus</button>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>

{#if showTransactionForm}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/50 p-4" role="presentation">
    <div role="dialog" aria-modal="true" aria-labelledby="transaction-form-title" class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface-card p-6 shadow-xl">
      <h3 id="transaction-form-title" class="text-xl font-extrabold text-primary-dark">{editingTransactionId === undefined ? 'Tambah transaksi' : 'Edit transaksi'}</h3>
      <form class="mt-5 space-y-4" onsubmit={(event) => { event.preventDefault(); void saveTransaction(); }}>
        <fieldset><legend class="mb-2 text-sm font-bold text-text-secondary">Tipe transaksi</legend><div class="grid grid-cols-3 gap-2"><label class="rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors p-3 font-bold"><input type="radio" bind:group={transactionType} value="income" /> Pemasukan</label><label class="rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors p-3 font-bold"><input type="radio" bind:group={transactionType} value="expense" /> Pengeluaran</label><label class="rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors p-3 font-bold"><input type="radio" bind:group={transactionType} value="transfer" disabled={editingTransactionId !== undefined} /> Transfer</label></div></fieldset>
        <label class="block text-sm font-bold text-text-secondary">Nominal (Rp)<input required type="number" min="1" step="1" bind:value={transactionAmount} class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3 text-lg font-bold" /></label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="text-sm font-bold text-text-secondary">Tanggal<input required type="date" bind:value={transactionDate} class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3" /></label>
          <label class="text-sm font-bold text-text-secondary">Wallet<select required bind:value={transactionWalletId} class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3"><option value={0} disabled>Pilih wallet</option>{#each wallets as wallet (wallet.id)}<option value={wallet.id}>{wallet.nama}</option>{/each}</select></label>
        </div>
        {#if transactionType === 'transfer'}
          <label class="block text-sm font-bold text-text-secondary">Wallet tujuan<select required bind:value={transferDestinationWalletId} class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3"><option value={0} disabled>Pilih wallet tujuan</option>{#each wallets.filter((wallet) => wallet.id !== transactionWalletId) as wallet (wallet.id)}<option value={wallet.id}>{wallet.nama}</option>{/each}</select></label>
        {:else}
          <label class="block text-sm font-bold text-text-secondary">Kategori<select bind:value={transactionCategoryId} class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3"><option value={0}>Tanpa kategori</option>{#each categories.filter((category) => category.tipe === transactionType) as category (category.id)}<option value={category.id}>{category.nama}</option>{/each}</select></label>
        {/if}
        <label class="block text-sm font-bold text-text-secondary">Catatan<textarea bind:value={transactionNote} rows="2" placeholder="Keterangan transaksi" class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3"></textarea></label>
        <label class="block text-sm font-bold text-text-secondary">Tag<input type="text" bind:value={transactionTag} placeholder="Contoh: kantor" class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3" /></label>
        {#if transactionType === 'transfer'}<p class="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">Transfer disimpan sebagai dua transaksi berpasangan agar saldo total tidak berubah.</p>{/if}
        <div class="flex gap-3 pt-2"><button type="button" onclick={() => showTransactionForm = false} class="flex-1 rounded-lg bg-gray-100 px-4 py-3 font-bold">Batal</button><button type="submit" class="flex-1 rounded-lg bg-primary px-4 py-3 font-bold text-white">Simpan</button></div>
      </form>
    </div>
  </div>
{/if}

{#if showCategories}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/50 p-4" role="presentation">
    <div role="dialog" aria-modal="true" aria-labelledby="category-title" class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface-card p-6 shadow-xl">
      <div class="flex items-center justify-between"><h3 id="category-title" class="text-xl font-extrabold text-primary-dark">Kelola kategori</h3><button type="button" onclick={() => showCategories = false} aria-label="Tutup pengelolaan kategori" class="rounded-lg px-3 py-2 font-bold">Tutup</button></div>
      <form class="mt-5 grid gap-3 sm:grid-cols-2" bind:this={categoryFormElement} onsubmit={(event) => { event.preventDefault(); void saveCategory(); }}>
        <label class="text-sm font-bold text-text-secondary">Nama kategori<input required bind:value={categoryName} class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3" /></label>
        <label class="text-sm font-bold text-text-secondary">Tipe<select bind:value={categoryType} class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3"><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></label>
        <label class="text-sm font-bold text-text-secondary">Nama ikon<input bind:value={categoryIcon} placeholder="circle" class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3" /></label>
        <label class="text-sm font-bold text-text-secondary">Warna<input type="color" bind:value={categoryColor} class="mt-1 h-12 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors p-2" /></label>
        <div class="flex gap-2 sm:col-span-2">{#if editingCategoryId !== undefined}<button type="button" onclick={resetCategoryForm} class="rounded-lg bg-gray-100 px-4 py-2 font-bold">Batal edit</button>{/if}<button type="submit" class="rounded-lg bg-primary px-5 py-2 font-bold text-white">{editingCategoryId === undefined ? 'Tambah kategori' : 'Simpan perubahan'}</button></div>
      </form>
      <div class="mt-6 space-y-2">
        {#each categories as category (category.id)}
          <div class="flex items-center justify-between gap-3 rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors p-3"><div class="flex items-center gap-3"><span aria-hidden="true" class="h-4 w-4 rounded-full" style:background-color={category.warna}></span><span><strong>{category.nama}</strong><small class="ml-2 text-text-muted">{category.tipe === 'income' ? 'Pemasukan' : 'Pengeluaran'}</small></span></div><div class="flex gap-2"><button type="button" onclick={() => editCategory(category)} class="rounded-lg border px-3 py-2 text-sm font-bold">Edit</button><button type="button" onclick={() => deleteCategory(category)} class="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700">Hapus</button></div></div>
        {/each}
      </div>
    </div>
  </div>
{/if}
