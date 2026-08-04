<script lang="ts">
  import { onMount } from 'svelte';
  import {
    categoryStore,
    getDashboardSummary,
    initStores,
    transactionStore,
    walletStore,
    type DashboardSummary
  } from '../stores';
  import WalletList from './WalletList.svelte';
  import TransactionHistory from './TransactionHistory.svelte';

  const emptySummary: DashboardSummary = {
    income: 0,
    expense: 0,
    net: 0,
    totalBalance: 0,
    walletCount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    dailyTrend: [],
    topCategories: []
  };

  let summary = emptySummary;
  let currentSection: 'wallets' | 'transactions' = 'wallets';
  let summaryError: string | null = null;
  let summaryRequest = 0;
  let trendMaximum = 1;

  $: trendMaximum = Math.max(
    1,
    ...summary.dailyTrend.flatMap((point) => [point.income, point.expense])
  );

  async function loadSummary(): Promise<void> {
    const request = ++summaryRequest;
    try {
      const data = await getDashboardSummary();
      if (request === summaryRequest) {
        summary = data;
        summaryError = null;
      }
    } catch (error: unknown) {
      if (request === summaryRequest) {
        summaryError = error instanceof Error ? error.message : 'Ringkasan tidak dapat dimuat.';
      }
    }
  }

  onMount(() => {
    let ready = false;
    let updateQueued = false;

    const queueSummaryUpdate = (): void => {
      if (!ready || updateQueued) return;
      updateQueued = true;
      queueMicrotask(() => {
        updateQueued = false;
        void loadSummary();
      });
    };

    const unsubscribers = [
      walletStore.subscribe(queueSummaryUpdate),
      transactionStore.subscribe(queueSummaryUpdate),
      categoryStore.subscribe(queueSummaryUpdate)
    ];

    void initStores()
      .then(() => {
        ready = true;
        return loadSummary();
      })
      .catch((error: unknown) => {
        summaryError = error instanceof Error ? error.message : 'Data tidak dapat dimuat.';
      });

    return () => {
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  });

  function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatDay(timestamp: number): string {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(timestamp);
  }
</script>

<div class="space-y-6">
  <section class="grid grid-cols-1 gap-4" aria-labelledby="ringkasan-title">
    <h1 id="ringkasan-title" class="sr-only">Ringkasan keuangan</h1>
    <div class="bg-gradient-to-br from-primary to-primary-light rounded-xl shadow-teal-glow p-6 text-white relative overflow-hidden">
      <div class="absolute -right-10 -top-10 w-32 h-32 bg-white opacity-10 rounded-round"></div>
      <div class="absolute -right-4 top-10 w-16 h-16 bg-accent opacity-20 rounded-round"></div>
      <p class="text-sm font-medium opacity-90 tracking-wide">Total Saldo</p>
      <h2 class="text-4xl font-extrabold mt-2 tracking-tight drop-shadow-md">{formatRupiah(summary.totalBalance)}</h2>
      <p class="text-xs mt-3 opacity-80 bg-primary-dark inline-block px-2 py-1 rounded-sm">
        {summary.walletCount} dompet aktif
      </p>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="bg-surface-card rounded-lg shadow-card p-4 border-l-[6px] border-success">
        <span class="text-sm font-bold text-text-secondary">Pemasukan bulan ini</span>
        <p class="text-xl font-extrabold text-text-primary mt-2">{formatRupiah(summary.income)}</p>
      </div>
      <div class="bg-surface-card rounded-lg shadow-card p-4 border-l-[6px] border-coral">
        <span class="text-sm font-bold text-text-secondary">Pengeluaran bulan ini</span>
        <p class="text-xl font-extrabold text-text-primary mt-2">{formatRupiah(summary.expense)}</p>
      </div>
    </div>
  </section>

  {#if summaryError}
    <p class="rounded-lg bg-red-50 p-3 text-sm font-medium text-coral-dark" role="alert">
      Gagal memperbarui ringkasan: {summaryError}
    </p>
  {/if}

  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <section class="bg-surface-card rounded-xl shadow-card p-5" aria-labelledby="trend-title">
      <div class="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 id="trend-title" class="font-extrabold text-text-primary">Tren bulan ini</h2>
          <p class="text-xs text-text-muted mt-1">Pemasukan dan pengeluaran per hari</p>
        </div>
        <div class="flex gap-3 text-xs font-bold text-text-secondary" aria-hidden="true">
          <span><span class="inline-block w-2 h-2 rounded-round bg-success mr-1"></span>Masuk</span>
          <span><span class="inline-block w-2 h-2 rounded-round bg-coral mr-1"></span>Keluar</span>
        </div>
      </div>

      {#if summary.dailyTrend.length === 0}
        <p class="py-10 text-center text-sm text-text-muted">Belum ada transaksi bulan ini.</p>
      {:else}
        <div class="flex h-44 items-end gap-2 overflow-x-auto pb-1" role="img" aria-label="Grafik tren pemasukan dan pengeluaran harian bulan ini">
          {#each summary.dailyTrend as point (point.tanggal)}
            <div class="flex h-full min-w-10 flex-1 flex-col justify-end" title={`${formatDay(point.tanggal)} — masuk ${formatRupiah(point.income)}, keluar ${formatRupiah(point.expense)}`}>
              <div class="flex h-32 items-end justify-center gap-1">
                <div class="w-2 rounded-t bg-success" style={`height: ${Math.max(point.income > 0 ? 4 : 0, point.income / trendMaximum * 100)}%`}></div>
                <div class="w-2 rounded-t bg-coral" style={`height: ${Math.max(point.expense > 0 ? 4 : 0, point.expense / trendMaximum * 100)}%`}></div>
              </div>
              <span class="mt-2 truncate text-center text-[10px] font-medium text-text-muted">{formatDay(point.tanggal)}</span>
              <span class="sr-only">Pemasukan {formatRupiah(point.income)}, pengeluaran {formatRupiah(point.expense)}</span>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <section class="bg-surface-card rounded-xl shadow-card p-5" aria-labelledby="kategori-title">
      <h2 id="kategori-title" class="font-extrabold text-text-primary">5 kategori pengeluaran terbesar</h2>
      <p class="text-xs text-text-muted mt-1 mb-4">Bulan berjalan</p>
      {#if summary.topCategories.length === 0}
        <p class="py-10 text-center text-sm text-text-muted">Belum ada pengeluaran berkategori.</p>
      {:else}
        <ol class="space-y-3">
          {#each summary.topCategories as category, index}
            <li class="flex items-center gap-3">
              <span class="w-5 text-xs font-bold text-text-muted">{index + 1}</span>
              <span class="h-3 w-3 shrink-0 rounded-round" style={`background-color: ${category.warna}`}></span>
              <span class="min-w-0 flex-1 truncate text-sm font-bold text-text-secondary">{category.nama}</span>
              <span class="text-sm font-extrabold text-text-primary">{formatRupiah(category.total)}</span>
            </li>
          {/each}
        </ol>
      {/if}
    </section>
  </div>

  <div class="flex border-b-[3px] border-dashed border-gray-200 mt-6 relative" role="tablist" aria-label="Isi dasbor">
    <button
      type="button"
      role="tab"
      aria-selected={currentSection === 'wallets'}
      onclick={() => currentSection = 'wallets'}
      class="{currentSection === 'wallets' ? 'text-primary font-extrabold' : 'text-text-muted font-bold'} pb-3 px-6 transition-colors relative"
    >
      Dompet Saya
      {#if currentSection === 'wallets'}
        <span class="absolute bottom-[-3px] left-0 w-full h-[3px] bg-primary rounded-round shadow-teal-glow"></span>
      {/if}
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={currentSection === 'transactions'}
      onclick={() => currentSection = 'transactions'}
      class="{currentSection === 'transactions' ? 'text-primary font-extrabold' : 'text-text-muted font-bold'} pb-3 px-6 transition-colors relative"
    >
      Riwayat
      {#if currentSection === 'transactions'}
        <span class="absolute bottom-[-3px] left-0 w-full h-[3px] bg-primary rounded-round shadow-teal-glow"></span>
      {/if}
    </button>
  </div>

  <div class="pt-2">
    {#if currentSection === 'wallets'}
      <WalletList />
    {:else}
      <TransactionHistory />
    {/if}
  </div>
</div>
