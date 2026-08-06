<script lang="ts">
  import Dashboard from './lib/components/Dashboard.svelte';
  import Transaksi from './lib/components/Transaksi.svelte';
  import HutangPiutang from './lib/components/HutangPiutang.svelte';
  import Patungan from './lib/components/Patungan.svelte';
  import Anggaran from './lib/components/Anggaran.svelte';
  import Laporan from './lib/components/Laporan.svelte';
  import BackupRestore from './lib/components/BackupRestore.svelte';
  import Toast from './lib/components/Toast.svelte';
  import ReminderLogic from './lib/components/reminders/ReminderLogic.svelte';
  import ReminderBadge from './lib/components/reminders/ReminderBadge.svelte';
  import Settings from './lib/components/Settings.svelte';

  type Tab = 'dashboard' | 'transaksi' | 'hutang' | 'patungan' | 'anggaran' | 'laporan' | 'settings';

  let currentTab = $state<Tab>('dashboard');
  let previousTab = $state<Tab>('dashboard');
  let isMoreMenuOpen = $state(false);
  
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
    anggaran: 'Anggaran',
    laporan: 'Laporan',
    settings: 'Pengaturan'
  };

  const tabSubtitles: Record<Tab, string> = {
    dashboard: 'Pantau arus kas dan aset finansial Anda',
    transaksi: 'Pencatatan riwayat transaksi harian',
    hutang: 'Kelola hutang dan piutang antar kontak',
    patungan: 'Pembagian tagihan bersama partisipan',
    anggaran: 'Batas pengeluaran per kategori bulanan',
    laporan: 'Analisis visual dan persebaran keuangan',
    settings: 'Konfigurasi tampilan dan cadangan data'
  };

  function selectTab(tab: Tab): void {
    if (tab !== 'settings') {
      previousTab = tab;
    }
    currentTab = tab;
    isMoreMenuOpen = false;
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

<div class="flex h-screen bg-surface-base text-text-primary transition-colors overflow-hidden w-full">
  <!-- Desktop Sidebar (Stitch FinancePro Style) -->
  <aside class="hidden lg:flex flex-col w-64 bg-surface-container-lowest border-r border-outline-variant shrink-0 transition-colors z-20">
    <div class="h-16 flex items-center px-6 border-b border-outline-variant">
      <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center mr-3">
        <span class="material-symbols-outlined text-on-primary" style="font-variation-settings: 'FILL' 1;">account_balance_wallet</span>
      </div>
      <div>
        <a href="#main-content" class="block rounded-md text-xl font-bold tracking-tight text-primary focus:outline-none focus:ring-2 focus:ring-primary">
          Uwang
        </a>
        <span class="block text-xs font-medium text-on-surface-variant -mt-0.5">Personal Wealth</span>
      </div>
    </div>

    <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1" aria-label="Navigasi utama">
      <button type="button" aria-current={currentTab === 'dashboard' ? 'page' : undefined} class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary {currentTab === 'dashboard' ? 'bg-surface-container-low text-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}" onclick={() => selectTab('dashboard')}>
        <span class="material-symbols-outlined h-5 w-5">dashboard</span>
        Ringkasan
      </button>
      <button type="button" aria-current={currentTab === 'transaksi' ? 'page' : undefined} class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary {currentTab === 'transaksi' ? 'bg-surface-container-low text-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}" onclick={() => selectTab('transaksi')}>
        <span class="material-symbols-outlined h-5 w-5">receipt_long</span>
        Transaksi
      </button>
      <button type="button" aria-current={currentTab === 'anggaran' ? 'page' : undefined} class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary {currentTab === 'anggaran' ? 'bg-surface-container-low text-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}" onclick={() => selectTab('anggaran')}>
        <span class="material-symbols-outlined h-5 w-5">account_balance_wallet</span>
        Anggaran
      </button>
      <button type="button" aria-current={currentTab === 'hutang' ? 'page' : undefined} class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary {currentTab === 'hutang' ? 'bg-surface-container-low text-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}" onclick={() => selectTab('hutang')}>
        <span class="material-symbols-outlined h-5 w-5">compare_arrows</span>
        Hutang &amp; Piutang
      </button>
      <button type="button" aria-current={currentTab === 'patungan' ? 'page' : undefined} class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary {currentTab === 'patungan' ? 'bg-surface-container-low text-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}" onclick={() => selectTab('patungan')}>
        <span class="material-symbols-outlined h-5 w-5">group</span>
        Patungan
      </button>
      <button type="button" aria-current={currentTab === 'laporan' ? 'page' : undefined} class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary {currentTab === 'laporan' ? 'bg-surface-container-low text-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}" onclick={() => selectTab('laporan')}>
        <span class="material-symbols-outlined h-5 w-5">analytics</span>
        Laporan
      </button>
    </nav>
    <div class="p-4 border-t border-outline-variant">
      <button type="button" onclick={() => selectTab('transaksi')} class="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-on-primary font-medium text-sm hover:bg-surface-tint transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
        <span class="material-symbols-outlined h-5 w-5">add</span>
        Tambah Transaksi
      </button>
    </div>
  </aside>

  <!-- Main Content Area -->
  <main class="flex-1 flex flex-col min-w-0 h-full relative">
    <!-- Top Bar Mobile -->
    <header class="sticky top-0 z-30 lg:hidden border-b border-outline-variant bg-surface-bright/80 backdrop-blur-md px-5 py-4 text-text-primary transition-colors">
      <div class="flex min-h-12 items-center justify-between gap-4">
        <div class="min-w-0">
          <a href="#main-content" class="block w-fit rounded-md text-xl font-bold tracking-tight text-primary focus:outline-none focus:ring-2 focus:ring-primary">
            Uwang
          </a>
          <p class="truncate text-xs font-medium text-on-surface-variant">{tabTitles[currentTab]}</p>
        </div>
        
        <div class="flex items-center gap-2">
          <ReminderBadge onNavigate={selectTab} />
          <button
            type="button"
            class="flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary {currentTab === 'settings' ? 'bg-surface-container text-primary' : 'bg-transparent'}"
            aria-label={currentTab === 'settings' ? 'Tutup pengaturan' : 'Buka pengaturan'}
            onclick={toggleSettings}
          >
            <span class="material-symbols-outlined h-5 w-5 text-[20px]">settings</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Top Bar Desktop (Stitch Header Style) -->
    <div class="hidden lg:flex sticky top-0 z-30 bg-surface-bright/90 backdrop-blur-md px-8 py-5 border-b border-outline-variant items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-on-surface tracking-tight">{tabTitles[currentTab]}</h1>
        <p class="text-xs text-on-surface-variant mt-0.5">{tabSubtitles[currentTab]}</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          type="button" 
          onclick={() => selectTab('transaksi')} 
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-medium text-xs rounded-lg hover:bg-surface-tint transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <span class="material-symbols-outlined h-4 w-4 text-[18px]">add</span>
          Tambah Transaksi
        </button>
        <ReminderBadge onNavigate={selectTab} />
      </div>
    </div>

    <ReminderLogic />

    <div id="main-content" class="flex-1 overflow-y-auto overflow-x-hidden p-container-padding-mobile lg:p-container-padding-desktop pb-24 lg:pb-8">
      <div class="mx-auto max-w-6xl">
        {#if currentTab === 'dashboard'}
          <Dashboard />
        {:else if currentTab === 'transaksi'}
          <Transaksi />
        {:else if currentTab === 'hutang'}
          <HutangPiutang />
        {:else if currentTab === 'patungan'}
          <Patungan />
        {:else if currentTab === 'anggaran'}
          <Anggaran />
        {:else if currentTab === 'laporan'}
          <Laporan />
        {:else}
          <section aria-labelledby="settings-title" class="space-y-6 max-w-2xl mx-auto">
            <Settings />
            <div class="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 transition-colors">
              <h2 id="settings-title" class="mb-4 text-lg font-bold">Tampilan</h2>
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="font-semibold text-sm">Mode Gelap</p>
                  <p class="text-xs text-on-surface-variant">Kurangi cahaya layar saat lingkungan gelap.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDarkMode}
                  aria-label={isDarkMode ? 'Nonaktifkan mode gelap' : 'Aktifkan mode gelap'}
                  onclick={toggleDarkMode}
                  class="relative h-10 w-14 shrink-0 rounded-full border border-outline-variant p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  class:bg-primary={isDarkMode}
                  class:bg-surface-container-high={!isDarkMode}
                >
                  <span class="block h-7 w-7 rounded-full bg-white shadow-sm transition-transform" class:translate-x-4={isDarkMode}></span>
                </button>
              </div>
            </div>

            <div class="backup-wrapper">
              <BackupRestore />
            </div>
          </section>
        {/if}
      </div>
    </div>

    <!-- Mobile Bottom Nav (Stitch: 5 Tab + Drawer 'Lainnya') -->
    <nav aria-label="Navigasi utama" class="lg:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-outline-variant bg-surface-container-lowest transition-colors pb-safe">
      <div class="flex h-16 items-center justify-around px-2">
        <button type="button" aria-current={currentTab === 'dashboard' ? 'page' : undefined} class="flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors focus:outline-none {currentTab === 'dashboard' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}" onclick={() => selectTab('dashboard')}>
          <span class="material-symbols-outlined h-5 w-5" style="font-variation-settings: 'FILL' {currentTab === 'dashboard' ? 1 : 0};">dashboard</span>
          <span class="text-[10px] leading-tight">Ringkasan</span>
        </button>
        <button type="button" aria-current={currentTab === 'transaksi' ? 'page' : undefined} class="flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors focus:outline-none {currentTab === 'transaksi' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}" onclick={() => selectTab('transaksi')}>
          <span class="material-symbols-outlined h-5 w-5" style="font-variation-settings: 'FILL' {currentTab === 'transaksi' ? 1 : 0};">receipt_long</span>
          <span class="text-[10px] leading-tight">Transaksi</span>
        </button>
        <button type="button" aria-current={currentTab === 'anggaran' ? 'page' : undefined} class="flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors focus:outline-none {currentTab === 'anggaran' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}" onclick={() => selectTab('anggaran')}>
          <span class="material-symbols-outlined h-5 w-5" style="font-variation-settings: 'FILL' {currentTab === 'anggaran' ? 1 : 0};">account_balance_wallet</span>
          <span class="text-[10px] leading-tight">Anggaran</span>
        </button>
        <button type="button" aria-current={currentTab === 'hutang' ? 'page' : undefined} class="flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors focus:outline-none {currentTab === 'hutang' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}" onclick={() => selectTab('hutang')}>
          <span class="material-symbols-outlined h-5 w-5" style="font-variation-settings: 'FILL' {currentTab === 'hutang' ? 1 : 0};">account_balance</span>
          <span class="text-[10px] leading-tight">Hutang</span>
        </button>
        <button type="button" aria-current={currentTab === 'laporan' ? 'page' : undefined} class="flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors focus:outline-none {currentTab === 'laporan' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}" onclick={() => selectTab('laporan')}>
          <span class="material-symbols-outlined h-5 w-5" style="font-variation-settings: 'FILL' {currentTab === 'laporan' ? 1 : 0};">assessment</span>
          <span class="text-[10px] leading-tight">Laporan</span>
        </button>
        <button type="button" aria-current={['patungan', 'settings'].includes(currentTab) || isMoreMenuOpen ? 'page' : undefined} class="flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors focus:outline-none {['patungan', 'settings'].includes(currentTab) || isMoreMenuOpen ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}" onclick={() => isMoreMenuOpen = !isMoreMenuOpen}>
          <span class="material-symbols-outlined h-5 w-5" style="font-variation-settings: 'FILL' {['patungan', 'settings'].includes(currentTab) || isMoreMenuOpen ? 1 : 0};">menu</span>
          <span class="text-[10px] leading-tight">Lainnya</span>
        </button>
      </div>

      <!-- Sheet popover untuk menu 'Lainnya' -->
      {#if isMoreMenuOpen}
        <div class="fixed inset-0 bg-black/40 z-30" onclick={() => isMoreMenuOpen = false} aria-hidden="true"></div>
        <div class="absolute bottom-16 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant p-4 rounded-t-2xl z-40 space-y-2 shadow-lg">
          <div class="text-xs font-semibold text-on-surface-variant uppercase px-2 mb-2">Menu Lainnya</div>
          <button type="button" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container" onclick={() => selectTab('patungan')}>
            <span class="material-symbols-outlined h-5 w-5 text-on-surface-variant">group</span>
            Patungan
          </button>
          <button type="button" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container" onclick={() => selectTab('settings')}>
            <span class="material-symbols-outlined h-5 w-5 text-on-surface-variant">settings</span>
            Pengaturan
          </button>
        </div>
      {/if}
    </nav>
</main>
</div>
