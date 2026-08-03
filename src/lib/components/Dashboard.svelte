<script lang="ts">
  import { liveQuery } from 'dexie';
  import { db } from '../db';
  import { onMount } from 'svelte';

  // Live queries using runes via store subscriptions (Svelte 5 way to handle RxJS observables/stores)
  let transactions = $state([]);
  let wallets = $state([]);
  
  let totalBalance = $derived(
    wallets.reduce((acc, w) => acc + w.saldo_awal, 0) + 
    transactions.reduce((acc, t) => {
      if (t.tipe === 'income') return acc + t.nominal;
      if (t.tipe === 'expense') return acc - t.nominal;
      return acc; // transfer handled differently later
    }, 0)
  );

  onMount(() => {
    const tSub = liveQuery(() => db.transactions.orderBy('tanggal').reverse().limit(5).toArray())
      .subscribe(val => { transactions = val; });
    
    const wSub = liveQuery(() => db.wallets.toArray())
      .subscribe(val => { wallets = val; });

    return () => {
      tSub.unsubscribe();
      wSub.unsubscribe();
    };
  });
  
  function formatRupiah(angka: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  }
</script>

<div class="space-y-6">
  <!-- Total Balance Card -->
  <div class="bg-primary-dark text-white rounded-xl p-6 shadow-card relative overflow-hidden">
    <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary-light rounded-full opacity-20"></div>
    <p class="text-primary-bg text-sm mb-1">Total Saldo</p>
    <h2 class="text-3xl font-extrabold tracking-tight">{formatRupiah(totalBalance)}</h2>
  </div>

  <!-- Recent Transactions -->
  <div>
    <div class="flex justify-between items-center mb-3">
      <h3 class="font-bold text-gray-800 border-b-2 border-dashed border-gray-200 pb-1 w-full flex items-center">
        <span class="mr-2">📝</span> Transaksi Terakhir
      </h3>
    </div>
    
    <div class="space-y-3">
      {#if transactions.length === 0}
        <div class="bg-white p-4 rounded-xl shadow-sm text-center text-gray-500">
          Belum ada transaksi.
        </div>
      {:else}
        {#each transactions as t}
          <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 flex justify-between items-center {t.tipe === 'income' ? 'border-l-primary' : 'border-l-coral'}">
            <div>
              <p class="font-bold text-sm">{t.catatan || (t.tipe === 'income' ? 'Pemasukan' : 'Pengeluaran')}</p>
              <p class="text-xs text-gray-400">{new Date(t.tanggal).toLocaleDateString('id-ID')}</p>
            </div>
            <p class="font-bold {t.tipe === 'income' ? 'text-primary-dark' : 'text-coral-dark'}">
              {t.tipe === 'income' ? '+' : '-'}{formatRupiah(t.nominal)}
            </p>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>