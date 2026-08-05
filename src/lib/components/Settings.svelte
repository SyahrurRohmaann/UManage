<script lang="ts">
  import { onMount } from 'svelte';
  import { db, type ReminderSettings } from '../db';
  import { liveQuery } from 'dexie';

  let settings = $state<ReminderSettings | null>(null);
  let loading = $state(true);

  // Gunakan liveQuery untuk mantau settings
  const settingsQuery = liveQuery(() => db.reminderSettings.get(1));

  onMount(() => {
    const sub = settingsQuery.subscribe(data => {
      if (data) {
        settings = data;
        loading = false;
      }
    });

    return () => sub.unsubscribe();
  });

  async function handleToggle(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    
    if (checked && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      await db.reminderSettings.update(1, { 
        enabled: true, 
        notifPermissionAsked: true,
        updatedAt: Date.now() 
      });
      if (permission !== 'granted') {
        alert('Izin notifikasi browser ditolak. Pengingat hanya akan muncul di dalam aplikasi.');
      }
    } else {
      await db.reminderSettings.update(1, { 
        enabled: checked, 
        updatedAt: Date.now() 
      });
    }
  }

  async function updateDaysBefore(e: Event) {
    const value = parseInt((e.target as HTMLSelectElement).value, 10);
    await db.reminderSettings.update(1, { 
      daysBefore: value, 
      updatedAt: Date.now() 
    });
  }
</script>

<div class="max-w-xl mx-auto p-4 space-y-6">
  <h1 class="text-2xl font-bold">Pengaturan</h1>

  <section class="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-100">
    <div class="flex items-start justify-between mb-4">
      <div>
        <h2 class="text-lg font-semibold text-primary-dark">Notifikasi Pengingat Jatuh Tempo</h2>
        <p class="text-sm text-gray-500 mt-1">
          Pengingat muncul saat aplikasi dibuka. Mengingatkan hutang/piutang yang mendekati jatuh tempo.
        </p>
      </div>
      
      {#if !loading && settings}
        <label class="relative inline-flex items-center cursor-pointer mt-1">
          <input type="checkbox" class="sr-only peer" checked={settings.enabled} onchange={handleToggle}>
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      {/if}
    </div>

    {#if !loading && settings?.enabled}
      <div class="mt-6 pt-6 border-t border-gray-100">
        <label for="daysBefore" class="block text-sm font-medium text-gray-700 mb-2">
          Ingatkan saya sejak
        </label>
        <select 
          id="daysBefore"
          class="bg-gray-50 border border-gray-300 text-grey-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          value={settings.daysBefore}
          onchange={updateDaysBefore}
        >
          <option value={1}>H-1 Jatuh Tempo</option>
          <option value={2}>H-2 Jatuh Tempo</option>
          <option value={3}>H-3 Jatuh Tempo</option>
          <option value={7}>H-7 Jatuh Tempo</option>
          <option value={14}>H-14 Jatuh Tempo</option>
        </select>
        <p class="mt-2 text-xs text-gray-500">
          Notifikasi maksimal muncul 1x per hari untuk menghindari spam.
        </p>
      </div>
    {/if}
  </section>
</div>
