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
    <h2 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Laporan & Analitik</h2>
    <p class="font-body-md text-body-md text-on-surface-variant mt-1">Wawasan dan distribusi pengeluaran bulan ini.</p>
  </header>

  {#if report.loading || !summary}
    <p class="rounded-xl bg-surface-container-lowest border border-outline-variant p-8 text-center text-on-surface-variant">Memuat laporan...</p>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Donut Chart & Legend -->
      <section class="bg-surface-container-lowest rounded-[24px] border border-outline-variant p-6 flex flex-col shadow-sm relative overflow-hidden">
        <h3 class="font-headline-md text-headline-md text-primary mb-6">Pengeluaran per Kategori</h3>
        
        <div class="relative w-48 h-48 mb-6 mx-auto">
          <DonutChart dataPoints={report.spendingByCategory.map(c => ({
            label: c.categoryName,
            value: c.total,
            color: c.categoryColor
          }))} />
        </div>

        <div class="w-full flex flex-col gap-3 mt-4">
          {#each report.spendingByCategory as cat}
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full shrink-0" style="background-color: {cat.categoryColor}"></div>
                <span class="font-body-md text-body-md text-on-surface truncate max-w-[120px]">{cat.categoryName}</span>
              </div>
              <div class="flex items-center gap-4 shrink-0">
                <span class="font-label-md text-label-md text-primary font-bold">{formatRupiah(cat.total)}</span>
                <span class="font-label-md text-label-md text-on-surface-variant w-10 text-right">{cat.percentage.toFixed(0)}%</span>
              </div>
            </div>
          {/each}
        </div>
      </section>

      <div class="space-y-6">
        <!-- Insights -->
        <section class="bg-surface-container-lowest rounded-[24px] border border-outline-variant p-6 shadow-sm">
          <h3 class="font-headline-md text-headline-md text-primary mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-orange">lightbulb</span>
            Wawasan Keuangan
          </h3>
          <div class="space-y-3">
            {#each report.insights as insight}
              <div class="p-4 rounded-xl border border-outline-variant/50 flex flex-col gap-1
                {insight.type === 'spike' ? 'bg-error-container/20 text-on-surface' : 
                 insight.type === 'savings' ? 'bg-secondary-container/20 text-on-surface' : 
                 'bg-surface-container text-on-surface'}">
                <p class="font-label-md text-label-md font-bold">{insight.title}</p>
                <p class="font-body-md text-[13px] text-on-surface-variant">{insight.description}</p>
              </div>
            {/each}
          </div>
        </section>

        <!-- Monthly Bar Chart -->
        <section class="bg-surface-container-lowest rounded-[24px] border border-outline-variant p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
             <h3 class="font-headline-md text-headline-md text-primary">Arus Kas (6 Bulan)</h3>
             <div class="flex gap-3 font-label-sm text-label-sm text-on-surface-variant" aria-hidden="true">
               <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-full bg-secondary"></span>Masuk</span>
               <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-full bg-error"></span>Keluar</span>
             </div>
          </div>
          <div class="w-full h-64 bg-surface rounded-lg border border-outline-variant/50 relative p-4 flex items-end">
             <SixMonthTrendChart dataPoints={summary.monthlyTrend} />
          </div>
        </section>
      </div>
    </div>
  {/if}
</div>
