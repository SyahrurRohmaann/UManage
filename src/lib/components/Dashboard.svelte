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
  import SixMonthTrendChart from './SixMonthTrendChart.svelte';

  const emptySummary: DashboardSummary = {
    income: 0,
    expense: 0,
    prevIncome: 0,
    prevExpense: 0,
    net: 0,
    totalBalance: 0,
    walletCount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    dailyTrend: [],
    monthlyTrend: [],
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

  function getPercentageChange(current: number, previous: number): { value: number; isPositive: boolean; formatted: string } {
    if (previous === 0) {
      if (current === 0) return { value: 0, isPositive: true, formatted: '0%' };
      return { value: 100, isPositive: true, formatted: '+100%' };
    }
    const change = ((current - previous) / previous) * 100;
    const isPositive = change >= 0;
    const formatted = `${isPositive ? '+' : ''}${Math.abs(change).toFixed(0)}%`;
    return { value: Math.abs(change), isPositive, formatted };
  }

  $: incomeChange = getPercentageChange(summary.income, summary.prevIncome);
  $: expenseChange = getPercentageChange(summary.expense, summary.prevExpense);
</script>

<div class="space-y-6">
  <section class="grid grid-cols-1 gap-4" aria-labelledby="ringkasan-title">
    <h1 id="ringkasan-title" class="sr-only">Ringkasan keuangan</h1>
    <div class="bg-surface-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden">
      <p class="text-sm font-semibold text-text-secondary tracking-wide uppercase">Total Saldo</p>
      <h2 class="text-4xl lg:text-5xl font-extrabold mt-3 text-text-primary tracking-tight">{formatRupiah(summary.totalBalance)}</h2>
      <p class="text-xs font-semibold mt-4 text-text-muted bg-gray-50 inline-block px-3 py-1.5 rounded-md border border-gray-100">
        {summary.walletCount} dompet aktif
      </p>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="bg-surface-card rounded-lg shadow-card p-4 border-l-[6px] border-success flex flex-col justify-between">
        <span class="text-sm font-bold text-text-secondary">Pemasukan bulan ini</span>
        <div class="mt-2 flex items-baseline justify-between flex-wrap gap-2">
          <p class="text-xl font-extrabold text-text-primary">{formatRupiah(summary.income)}</p>
          <span class="text-xs font-bold px-2 py-1 rounded-md {incomeChange.isPositive ? 'bg-success-bg text-success' : 'bg-red-50 text-coral'}">
            {incomeChange.formatted}
          </span>
        </div>
      </div>
      <div class="bg-surface-card rounded-lg shadow-card p-4 border-l-[6px] border-coral flex flex-col justify-between">
        <span class="text-sm font-bold text-text-secondary">Pengeluaran bulan ini</span>
        <div class="mt-2 flex items-baseline justify-between flex-wrap gap-2">
          <p class="text-xl font-extrabold text-text-primary">{formatRupiah(summary.expense)}</p>
          <span class="text-xs font-bold px-2 py-1 rounded-md {!expenseChange.isPositive ? 'bg-success-bg text-success' : 'bg-red-50 text-coral'}">
            {expenseChange.formatted}
          </span>
        </div>
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
          <h2 id="trend-title" class="font-extrabold text-text-primary">Tren 6 bulan terakhir</h2>
          <p class="text-xs text-text-muted mt-1">Perbandingan pendapatan vs pengeluaran</p>
        </div>
        <div class="flex gap-3 text-xs font-bold text-text-secondary" aria-hidden="true">
          <span><span class="inline-block w-2 h-2 rounded-lg bg-success mr-1"></span>Masuk</span>
          <span><span class="inline-block w-2 h-2 rounded-lg bg-coral mr-1"></span>Keluar</span>
        </div>
      </div>

      {#if summary.monthlyTrend.length === 0}
        <p class="py-10 text-center text-sm text-text-muted">Belum ada data transaksi.</p>
      {:else}
        <SixMonthTrendChart dataPoints={summary.monthlyTrend} />
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
              <span class="h-3 w-3 shrink-0 rounded-lg" style={`background-color: ${category.warna}`}></span>
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
        <span class="absolute bottom-[-3px] left-0 w-full h-[3px] bg-primary rounded-lg shadow-sm"></span>
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
        <span class="absolute bottom-[-3px] left-0 w-full h-[3px] bg-primary rounded-lg shadow-sm"></span>
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
