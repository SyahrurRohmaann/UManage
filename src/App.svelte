<script lang="ts">
  import Dashboard from './lib/components/Dashboard.svelte';
  import Transaksi from './lib/components/Transaksi.svelte';
  import HutangPiutang from './lib/components/HutangPiutang.svelte';
  import Patungan from './lib/components/Patungan.svelte';
  import BackupRestore from './lib/components/BackupRestore.svelte';
  import Toast from './lib/components/Toast.svelte';
  import ReminderLogic from './lib/components/reminders/ReminderLogic.svelte';
  import ReminderBadge from './lib/components/reminders/ReminderBadge.svelte';
  import Settings from './lib/components/Settings.svelte';

  type Tab = 'dashboard' | 'transaksi' | 'hutang' | 'patungan' | 'settings';

  let currentTab = $state<Tab>('dashboard');
  let previousTab = $state<Tab>('dashboard');
  
  let isDarkMode = $state(
    localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  $effect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  });

  const tabTitles: Record<Tab, string> = {
    dashboard: 'Ringkasan',
    transaksi: 'Transaksi',
    hutang: 'Hutang & Piutang',
    patungan: 'Patungan',
    settings: 'Pengaturan'
  };

  function selectTab(tab: Tab): void {
    if (tab !== 'settings') {
      previousTab = tab;
    }
    currentTab = tab;
  }

  function toggleSettings(): void {
    if (currentTab === 'settings') {
      currentTab = previousTab;
    } else {
      previousTab = currentTab;
      currentTab = 'settings';
    }
  }

  function toggleDarkMode(): void {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.theme = isDarkMode ? 'dark' : 'light';
  }
</script>

<Toast />

<main class="uwangg-shell relative mx-auto min-h-screen max-w-md pb-24 transition-colors bg-surface-base text-text-primary">
  <header class="shell-header sticky top-0 z-30 border-b border-teal-800/40 bg-primary px-5 py-4 text-white shadow-md dark:border-teal-950 dark:bg-primary-dark">
    <div class="flex min-h-12 items-center justify-between gap-4">
      <div class="min-w-0">
        <a href="#main-content" class="block w-fit rounded-md text-2xl font-extrabold tracking-tight focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark">
          Duwekk
        </a>
        <p class="truncate text-sm font-medium text-teal-50">{tabTitles[currentTab]}</p>
      </div>
      
      <div class="flex items-center gap-2">
        <ReminderBadge onNavigate={selectTab} />
        <button
          type="button"
          class="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/30 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark {currentTab === 'settings' ? 'bg-white/25' : 'bg-white/10'}"
          aria-label={currentTab === 'settings' ? 'Tutup pengaturan' : 'Buka pengaturan'}
          aria-current={currentTab === 'settings' ? 'page' : undefined}
          onclick={toggleSettings}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.94 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.53-1H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.53V3h4v.08A1.7 1.7 0 0 0 15.06 4.6a1.7 1.7 0 0 0 1.88-.34L17 4.2 19.83 7l-.06.06A1.7 1.7 0 0 0 19.4 9c.24.62.85 1.02 1.52 1.02H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z" />
          </svg>
        </button>
      </div>
    </div>
  </header>

  <ReminderLogic />

  <div id="main-content" class="p-4">
    {#if currentTab === 'dashboard'}
      <Dashboard />
    {:else if currentTab === 'transaksi'}
      <Transaksi />
    {:else if currentTab === 'hutang'}
      <HutangPiutang />
    {:else if currentTab === 'patungan'}
      <Patungan />
    {:else}
      <section aria-labelledby="settings-title" class="space-y-6">
        <Settings />
        <div class="settings-card rounded-xl border border-border bg-surface-card p-5 shadow-card transition-colors">
          <h2 id="settings-title" class="mb-4 text-xl font-bold">Tampilan</h2>
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="font-semibold">Mode gelap</p>
              <p class="text-sm text-text-secondary">Kurangi cahaya layar saat lingkungan gelap.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isDarkMode}
              aria-label={isDarkMode ? 'Nonaktifkan mode gelap' : 'Aktifkan mode gelap'}
              onclick={toggleDarkMode}
              class="relative h-11 w-14 shrink-0 rounded-full border border-gray-300 p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:focus:ring-offset-gray-900"
              class:bg-primary={isDarkMode}
              class:bg-gray-200={!isDarkMode}
            >
              <span class="block h-8 w-8 rounded-full bg-white shadow-md transition-transform" class:translate-x-3={isDarkMode}></span>
            </button>
          </div>
        </div>

        <div class="backup-wrapper">
          <BackupRestore />
        </div>
      </section>
    {/if}
  </div>

  <nav aria-label="Navigasi utama" class="shell-nav fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-md rounded-t-xl border-t border-border bg-surface-card shadow-lg transition-colors">
    <div class="flex h-20 items-center justify-around px-2 pb-2">
      <button type="button" aria-current={currentTab === 'dashboard' ? 'page' : undefined} class="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary {currentTab === 'dashboard' ? 'text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-secondary'}" onclick={() => selectTab('dashboard')}>
        <svg aria-hidden="true" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12 12 3l9 9"/><path d="M5 10v11h14V10M9 21v-6h6v6"/></svg>
        Ringkasan
      </button>
      <button type="button" aria-current={currentTab === 'transaksi' ? 'page' : undefined} class="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary {currentTab === 'transaksi' ? 'text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-secondary'}" onclick={() => selectTab('transaksi')}>
        <svg aria-hidden="true" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg>
        Transaksi
      </button>
      <button type="button" aria-current={currentTab === 'hutang' ? 'page' : undefined} class="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary {currentTab === 'hutang' ? 'text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-secondary'}" onclick={() => selectTab('hutang')}>
        <svg aria-hidden="true" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 11h10M12 6v10"/><circle cx="12" cy="12" r="9"/></svg>
        Hutang
      </button>
      <button type="button" aria-current={currentTab === 'patungan' ? 'page' : undefined} class="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary {currentTab === 'patungan' ? 'text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-secondary'}" onclick={() => selectTab('patungan')}>
        <svg aria-hidden="true" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-4 2.5-7 6-7s6 3 6 7M15 14c3 0 5 2 5 5"/></svg>
        Patungan
      </button>
    </div>
  </nav>
</main>

<style>
</style>
