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
  <section aria-labelledby="ringkasan-title">
    <h1 id="ringkasan-title" class="sr-only">Ringkasan keuangan</h1>

    <!-- Summary Bento Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <span class="text-on-surface-variant font-label-md text-label-md">Total Saldo</span>
          <span class="material-symbols-outlined text-primary">account_balance</span>
        </div>
        <div class="font-display-lg text-display-lg text-primary tracking-tight text-[28px] md:text-display-lg">{formatRupiah(summary.totalBalance)}</div>
        <div class="mt-3 inline-flex items-center gap-1 bg-surface-container-low px-3 py-1 rounded-full border border-surface-variant">
          <span class="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
          <span class="text-secondary font-label-sm text-label-sm">{summary.walletCount} Dompet Aktif</span>
        </div>
      </div>

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <span class="text-on-surface-variant font-label-md text-label-md">Pemasukan Bulan Ini</span>
          <span class="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-secondary text-[18px]">arrow_downward</span>
          </span>
        </div>
        <div class="font-headline-lg text-headline-lg text-primary tracking-tight text-[22px] md:text-headline-lg">{formatRupiah(summary.income)}</div>
        <div class="mt-3">
          <span class="font-label-sm text-label-sm px-2 py-0.5 rounded-full {incomeChange.isPositive ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}">
            {incomeChange.formatted}
          </span>
        </div>
      </div>

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <span class="text-on-surface-variant font-label-md text-label-md">Pengeluaran Bulan Ini</span>
          <span class="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-error text-[18px]">arrow_upward</span>
          </span>
        </div>
        <div class="font-headline-lg text-headline-lg font-headline lg:text-headline-lg text-primary tracking-tight text-[22px] md:text-headline-lg">{formatRupiah(summary.expense)}</div>
        <div class="mt-3">
          <span class="font-label-sm text-label-sm px-2 py-0.5 rounded-full {!expenseChange.isPositive ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}">
            {expenseChange.formatted}
          </span>
        </div>
      </div>
    </div>
  </section>

  {#if summaryError}
    <p class="rounded-xl bg-error/10 p-3.5 text-xs font-medium text-on-error-container border border-error/20" role="alert">
      Gagal memperbarui ringkasan: {summaryError}
    </p>
  {/if}

  <div class="grid grid-cols-1 gap-gutter lg:grid-cols-3">
    <section class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 lg:col-span-2" aria-labelledby="trend-title">
      <div class="flex items-start justify-between gap-3 mb-6">
        <div>
          <h2 id="trend-title" class="font-headline-md text-headline-md text-on-background">Tren 6 Bulan Terakhir</h2>
          <p class="text-on-surface-variant font-label-sm text-label-sm mt-0.5">Perbandingan pendapatan vs pengeluaran</p>
        </div>
        <div class="flex gap-3 font-label-sm text-label-sm text-on-surface-variant" aria-hidden="true">
          <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-full bg-secondary"></span>Masuk</span>
          <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-full bg-error"></span>Keluar</span>
        </div>
      </div>

      {#if summary.monthlyTrend.length === 0}
        <p class="py-10 text-center font-label-sm text-label-sm text-on-surface-variant">Belum ada data transaksi.</p>
      {:else}
        <div class="bg-surface-bright rounded-lg border border-outline-variant/50 p-4">
          <SixMonthTrendChart dataPoints={summary.monthlyTrend} />
        </div>
      {/if}
    </section>

    <section class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6" aria-labelledby="kategori-title">
      <h2 id="kategori-title" class="font-headline-md text-headline-md text-on-background">5 Kategori Pengeluaran Terbesar</h2>
      <p class="text-on-surface-variant font-label-sm text-label-sm mt-0.5 mb-4">Bulan berjalan</p>
      {#if summary.topCategories.length === 0}
        <p class="py-10 text-center font-label-sm text-label-sm text-on-surface-variant">Belum ada pengeluaran berkategori.</p>
      {:else}
        <ol class="space-y-3">
          {#each summary.topCategories as category, index}
            <li class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-bright transition-colors">
              <span class="w-5 font-label-sm text-label-sm text-on-surface-variant text-center">{index + 1}</span>
              <span class="h-2.5 w-2.5 shrink-0 rounded-full" style={`background-color: ${category.warna}`}></span>
              <span class="min-w-0 flex-1 truncate font-label-md text-label-md text-on-surface">{category.nama}</span>
              <span class="font-label-md text-label-md font-bold text-on-surface">{formatRupiah(category.total)}</span>
            </li>
          {/each}
        </ol>
      {/if}
    </section>
  </div>

  <div class="flex border-b-[3px] border-dashed border-outline-variant mt-6 relative" role="tablist" aria-label="Isi dasbor">
    <button
      type="button"
      role="tab"
      aria-selected={currentSection === 'wallets'}
      onclick={() => currentSection = 'wallets'}
      class="{currentSection === 'wallets' ? 'text-primary font-extrabold' : 'text-on-surface-variant font-bold'} pb-3 px-6 transition-colors relative"
    >
      Dompet Saya
      {#if currentSection === 'wallets'}
        <span class="absolute bottom-[-3px] left-0 w-full h-[3px] bg-primary rounded-lg"></span>
      {/if}
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={currentSection === 'transactions'}
      onclick={() => currentSection = 'transactions'}
      class="{currentSection === 'transactions' ? 'text-primary font-extrabold' : 'text-on-surface-variant font-bold'} pb-3 px-6 transition-colors relative"
    >
      Riwayat
      {#if currentSection === 'transactions'}
        <span class="absolute bottom-[-3px] left-0 w-full h-[3px] bg-primary rounded-lg"></span>
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
