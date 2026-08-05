<script lang="ts">
  import { db, type Debt } from '../../db';
  import { liveQuery } from 'dexie';
  import { onMount } from 'svelte';
  
  let { onNavigate }: { onNavigate?: (tab: 'settings' | 'hutang') => void } = $props();

  let showDropdown = $state(false);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const reminderData = liveQuery(async () => {
    const settings = await db.reminderSettings.get(1);
    if (!settings || !settings.enabled) return { count: 0, reminders: [] };

    const now = Date.now();
    
    // Get all active debts with due dates, not disabled
    const activeDebts = await db.debts
      .filter((d: Debt) => d.status === 'aktif' && !!d.jatuh_tempo && !d.reminderDisabled)
      .toArray();

    const dueDebts = [];

    for (const debt of activeDebts) {
      if (!debt.jatuh_tempo) continue;
      const daysUntilDue = Math.ceil((debt.jatuh_tempo - now) / MS_PER_DAY);
      
      if (daysUntilDue <= settings.daysBefore) {
        dueDebts.push({ ...debt, daysUntilDue });
      }
    }

    return { count: dueDebts.length, reminders: dueDebts.sort((a,b) => a.daysUntilDue - b.daysUntilDue) };
  });

  function toggleDropdown() {
    showDropdown = !showDropdown;
  }

  function closeDropdown(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.reminder-container')) {
      showDropdown = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  });
</script>

<div class="relative reminder-container">
  <button 
    class="p-2 text-gray-600 hover:text-gray-900 focus:outline-none relative"
    onclick={toggleDropdown}
    aria-label="Notifikasi"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
    </svg>
    
    {#if $reminderData && $reminderData.count > 0}
      <span class="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
        {$reminderData.count}
      </span>
    {/if}
  </button>

  {#if showDropdown}
    <div class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
      <div class="p-3 border-b border-gray-100 bg-gray-50 font-medium flex justify-between items-center">
        <span>Pengingat Jatuh Tempo</span>
        <button type="button" class="text-xs text-blue-600 hover:underline cursor-pointer" onclick={() => { showDropdown = false; onNavigate?.('settings'); }}>Pengaturan</button>
      </div>
      
      <div class="max-h-96 overflow-y-auto">
        {#if $reminderData && $reminderData.reminders.length > 0}
          {#each $reminderData.reminders as debt}
            <button 
              type="button"
              class="w-full text-left block p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
              onclick={() => { showDropdown = false; onNavigate?.('hutang'); }}
            >
              <div class="flex justify-between items-start mb-1">
                <span class="font-medium text-sm text-gray-900 capitalize">{debt.tipe}</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full {debt.daysUntilDue < 0 ? 'bg-red-100 text-red-700' : debt.daysUntilDue === 0 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}">
                  {debt.daysUntilDue < 0 ? `Terlewat ${Math.abs(debt.daysUntilDue)} hari` : debt.daysUntilDue === 0 ? 'Hari ini' : `${debt.daysUntilDue} hari lagi`}
                </span>
              </div>
              <div class="text-xs text-gray-500 mb-1">
                Sisa: <span class="font-medium text-gray-900">Rp {debt.nominal_awal.toLocaleString('id-ID')}</span>
                <!-- Note: In a real app we'd calc sisa from debt_payments, using nominal_awal for MVP simplicity in UI badge -->
              </div>
            </button>
          {/each}
        {:else}
          <div class="p-6 text-center text-gray-500 text-sm">
            Tidak ada pengingat saat ini.
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
