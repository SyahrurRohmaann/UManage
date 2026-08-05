<script lang="ts">
  import { reportStore } from '../reports';
  import { getDashboardSummary, type DashboardSummary } from '../stores';
  import DonutChart from './DonutChart.svelte';
  import SixMonthTrendChart from './SixMonthTrendChart.svelte';
  import { onMount } from 'svelte';

  const report = $derived($reportStore);
  let summary = $state<DashboardSummary | null>(null);

  onMount(async () => {
    summary = await getDashboardSummary();
  });

  function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  }
</script>

<div class="space-y-6">
  <header class="mb-6">
    <h2 class="text-xl font-extrabold text-text-primary">Laporan & Analitik</h2>
    <p class="text-sm text-text-muted">Wawasan dan distribusi pengeluaran bulan ini.</p>
  </header>

  {#if report.loading || !summary}
    <p class="rounded-xl bg-surface-card p-8 text-center text-text-muted">Memuat laporan...</p>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Donut Chart & Legend -->
      <section class="bg-surface-card rounded-xl shadow-card p-6 border border-border">
        <h3 class="font-bold text-text-primary mb-6">Distribusi Pengeluaran</h3>
        
        <DonutChart dataPoints={report.spendingByCategory.map(c => ({
          label: c.categoryName,
          value: c.total,
          color: c.categoryColor
        }))} />

        <div class="mt-8 space-y-3">
          {#each report.spendingByCategory as cat}
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full shrink-0" style="background-color: {cat.categoryColor}"></span>
                <span class="font-medium text-text-secondary truncate max-w-[120px]">{cat.categoryName}</span>
              </div>
              <div class="flex items-center gap-4 shrink-0">
                <span class="font-bold text-text-primary">{formatRupiah(cat.total)}</span>
                <span class="text-text-muted font-mono text-xs w-10 text-right">{cat.percentage.toFixed(0)}%</span>
              </div>
            </div>
          {/each}
        </div>
      </section>

      <div class="space-y-6">
        <!-- Insights -->
        <section class="bg-surface-card rounded-xl shadow-card p-6 border border-border">
          <h3 class="font-bold text-text-primary mb-4 flex items-center gap-2">
            <svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
            Wawasan Keuangan
          </h3>
          <div class="space-y-3">
            {#each report.insights as insight}
              <div class="p-4 rounded-lg border-l-4 
                {insight.type === 'spike' ? 'border-coral bg-red-50 text-coral-dark' : 
                 insight.type === 'savings' ? 'border-success bg-success-bg text-green-800' : 
                 'border-sky bg-blue-50 text-blue-800'}">
                <p class="font-bold text-sm">{insight.title}</p>
                <p class="text-xs mt-1 opacity-90">{insight.description}</p>
              </div>
            {/each}
          </div>
        </section>

        <!-- Monthly Bar Chart (reusing SixMonthTrendChart for now since it's a trend chart) -->
        <section class="bg-surface-card rounded-xl shadow-card p-6 border border-border">
          <h3 class="font-bold text-text-primary mb-4">Performa 6 Bulan (Arus Kas)</h3>
          <div class="flex gap-3 text-xs font-bold text-text-secondary mb-4" aria-hidden="true">
            <span><span class="inline-block w-2 h-2 rounded-lg bg-success mr-1"></span>Masuk</span>
            <span><span class="inline-block w-2 h-2 rounded-lg bg-coral mr-1"></span>Keluar</span>
          </div>
          <SixMonthTrendChart dataPoints={summary.monthlyTrend} />
        </section>
      </div>
    </div>
  {/if}
</div>
