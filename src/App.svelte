<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from './lib/db';
  import Dashboard from './lib/components/Dashboard.svelte';
  import Transaksi from './lib/components/Transaksi.svelte';
  import HutangPiutang from './lib/components/HutangPiutang.svelte';
  import Patungan from './lib/components/Patungan.svelte';

  // State management using Svelte 5 runes
  let currentTab = $state('dashboard');

  // Simple seed for MVP if DB is empty
  onMount(async () => {
    const walletCount = await db.wallets.count();
    if (walletCount === 0) {
      await db.wallets.add({
        nama: 'Cash',
        saldo_awal: 0,
        created_at: Date.now()
      });
      await db.categories.add({
        nama: 'Makanan',
        tipe: 'expense',
        ikon: 'utensils',
        warna: '#EF6C4A'
      });
    }
  });
</script>

<main class="min-h-screen pb-20 max-w-md mx-auto bg-surface-base shadow-lg relative">
  <!-- Top App Bar -->
  <header class="bg-primary text-white p-4 shadow-md sticky top-0 z-10 rounded-b-xl">
    <h1 class="text-xl font-bold tracking-wider">
      {#if currentTab === 'dashboard'}Uwangg
      {:else if currentTab === 'transaksi'}Transaksi
      {:else if currentTab === 'hutang'}Hutang & Piutang
      {:else if currentTab === 'patungan'}Patungan
      {/if}
    </h1>
  </header>

  <!-- Content Area -->
  <div class="p-4">
    {#if currentTab === 'dashboard'}
      <Dashboard />
    {:else if currentTab === 'transaksi'}
      <Transaksi />
    {:else if currentTab === 'hutang'}
      <HutangPiutang />
    {:else if currentTab === 'patungan'}
      <Patungan />
    {/if}
  </div>

  <!-- Bottom Navigation -->
  <nav class="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.1)] max-w-md mx-auto rounded-t-xl z-20">
    <div class="flex justify-around items-center h-16">
      <button 
        class="flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors {currentTab === 'dashboard' ? 'text-primary' : 'text-gray-400'}"
        onclick={() => currentTab = 'dashboard'}
      >
        <div class="mb-1">🏠</div>
        Home
      </button>
      <button 
        class="flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors {currentTab === 'transaksi' ? 'text-primary' : 'text-gray-400'}"
        onclick={() => currentTab = 'transaksi'}
      >
        <div class="mb-1">💸</div>
        Transaksi
      </button>
      <button 
        class="flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors {currentTab === 'hutang' ? 'text-primary' : 'text-gray-400'}"
        onclick={() => currentTab = 'hutang'}
      >
        <div class="mb-1">🤝</div>
        Hutang
      </button>
      <button 
        class="flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors {currentTab === 'patungan' ? 'text-primary' : 'text-gray-400'}"
        onclick={() => currentTab = 'patungan'}
      >
        <div class="mb-1">🍕</div>
        Patungan
      </button>
    </div>
  </nav>
</main>