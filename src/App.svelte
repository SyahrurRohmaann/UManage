<script lang="ts">
  import { onMount } from 'svelte';
  import { db, initDB } from './lib/db';
  import { initStores } from './lib/stores';
  import Dashboard from './lib/components/Dashboard.svelte';
  import Transaksi from './lib/components/Transaksi.svelte';
  import HutangPiutang from './lib/components/HutangPiutang.svelte';
  import Patungan from './lib/components/Patungan.svelte';
  import BackupRestore from './lib/components/BackupRestore.svelte';
  import Toast from './lib/components/Toast.svelte';

  let currentTab = 'dashboard';
  let showSettings = false;

  // Simple Dark Mode Logic
  let isDarkMode = false;
  onMount(() => {
    // Check local storage or system preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      isDarkMode = true;
    } else {
      document.documentElement.classList.remove('dark');
      isDarkMode = false;
    }
  });

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }
</script>

<Toast />

<!-- To apply dark mode effectively across the app, 
     in a real scenario we would need dark variants in tailwind config and components.
     For MVP, we just add the class to html and provide the toggle. -->

<main class="min-h-screen pb-20 max-w-md mx-auto bg-surface-base dark:bg-gray-900 relative transition-colors">
  <!-- Top App Bar -->
  <header class="bg-primary relative overflow-hidden shadow-md sticky top-0 z-10 rounded-b-xl px-4 py-3 flex items-center justify-between min-h-[80px]">
    <!-- Cards Background layer for logo effect -->
    <div class="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
      <div class="w-8 h-12 bg-white rounded shadow-sm transform -rotate-[24deg] absolute -ml-16"></div>
      <div class="w-8 h-12 bg-white rounded shadow-sm transform -rotate-[12deg] absolute -ml-8"></div>
      <div class="w-8 h-12 bg-white rounded shadow-sm absolute"></div>
      <div class="w-8 h-12 bg-white rounded shadow-sm transform rotate-[12deg] absolute ml-8"></div>
      <div class="w-8 h-12 bg-white rounded shadow-sm transform rotate-[24deg] absolute ml-16"></div>
    </div>
    
    <div class="w-10"></div> <!-- Spacer for flex balance -->

    <div class="relative z-10 transform -rotate-3 text-center flex-1 flex justify-center">
      <div class="bg-cream inline-block px-4 py-1 border-[3px] border-primary-dark shadow-[2px_2px_0px_#1E8C86] transform -skew-x-6 relative">
        <!-- Ribbon tails -->
        <div class="absolute -left-2 top-2 w-4 h-full bg-[#E5D7BE] border-[3px] border-primary-dark -z-10 skew-x-6"></div>
        <div class="absolute -right-2 top-2 w-4 h-full bg-[#E5D7BE] border-[3px] border-primary-dark -z-10 skew-x-6"></div>
        
        <h1 class="font-extrabold tracking-[4px] text-primary-dark flex items-baseline justify-center whitespace-nowrap transform skew-x-6">
          {#if currentTab === 'dashboard'}
            <span class="text-3xl font-extrabold" style="text-shadow: 1px 1px 0px #fff">UWANG</span>
            <span class="text-5xl font-extrabold text-accent ml-1 transform rotate-6" style="text-shadow: 2px 2px 0px #1E8C86, -1px -1px 0px #1E8C86, 1px -1px 0px #1E8C86, -1px 1px 0px #1E8C86">G</span>
          {:else if currentTab === 'transaksi'}
            <span class="text-2xl font-extrabold">TRANSAKSI</span>
          {:else if currentTab === 'hutang'}
            <span class="text-2xl font-extrabold">HUTANG</span>
          {:else if currentTab === 'patungan'}
            <span class="text-2xl font-extrabold">PATUNGAN</span>
          {:else if currentTab === 'settings'}
            <span class="text-2xl font-extrabold">SETTINGS</span>
          {/if}
        </h1>
      </div>
    </div>

    <!-- Settings Toggle -->
    <button 
      class="relative z-10 w-10 h-10 flex items-center justify-center text-white bg-primary-dark/30 rounded-full hover:bg-primary-dark/50 transition-colors"
      onclick={() => currentTab = 'settings'}
    >
      ⚙️
    </button>
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
    {:else if currentTab === 'settings'}
      <div class="space-y-6">
         <!-- Settings Content -->
         <div class="bg-surface-card rounded-xl p-5 shadow-card border-[3px] border-dashed border-gray-100">
            <h3 class="font-extrabold text-lg mb-4 text-primary-dark">Tampilan</h3>
            <div class="flex items-center justify-between">
              <span class="font-bold text-text-secondary">Mode Gelap (Dark Mode)</span>
              <button 
                onclick={toggleDarkMode}
                class="w-14 h-8 flex items-center rounded-full p-1 transition-colors {isDarkMode ? 'bg-primary' : 'bg-gray-300'}"
              >
                <div class="bg-white w-6 h-6 rounded-full shadow-md transform transition-transform {isDarkMode ? 'translate-x-6' : ''}"></div>
              </button>
            </div>
         </div>

         <BackupRestore />

      </div>
    {/if}
  </div>

  <!-- Bottom Navigation -->
  <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg max-w-md mx-auto rounded-t-xl z-20 pb-safe transition-colors">
    <div class="flex justify-around items-center h-20 px-2 pb-2">
      <button 
        class="flex flex-col items-center justify-center w-full h-full text-xs font-bold transition-all {currentTab === 'dashboard' ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}"
        onclick={() => currentTab = 'dashboard'}
      >
        <div class="mb-1 w-12 h-8 rounded-round flex items-center justify-center transition-all {currentTab === 'dashboard' ? 'bg-primary-bg shadow-teal-glow' : ''}">
          <span class="text-xl">🏠</span>
        </div>
        Home
      </button>
      <button 
        class="flex flex-col items-center justify-center w-full h-full text-xs font-bold transition-all {currentTab === 'transaksi' ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}"
        onclick={() => currentTab = 'transaksi'}
      >
        <div class="mb-1 w-12 h-8 rounded-round flex items-center justify-center transition-all {currentTab === 'transaksi' ? 'bg-primary-bg shadow-teal-glow' : ''}">
          <span class="text-xl">📝</span>
        </div>
        Catat
      </button>
      <button 
        class="flex flex-col items-center justify-center w-full h-full text-xs font-bold transition-all {currentTab === 'hutang' ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}"
        onclick={() => currentTab = 'hutang'}
      >
        <div class="mb-1 w-12 h-8 rounded-round flex items-center justify-center transition-all {currentTab === 'hutang' ? 'bg-primary-bg shadow-teal-glow' : ''}">
          <span class="text-xl">🤝</span>
        </div>
        Hutang
      </button>
      <button 
        class="flex flex-col items-center justify-center w-full h-full text-xs font-bold transition-all {currentTab === 'patungan' ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}"
        onclick={() => currentTab = 'patungan'}
      >
        <div class="mb-1 w-12 h-8 rounded-round flex items-center justify-center transition-all {currentTab === 'patungan' ? 'bg-primary-bg shadow-teal-glow' : ''}">
          <span class="text-xl">🍕</span>
        </div>
        Split
      </button>
    </div>
  </nav>
</main>
