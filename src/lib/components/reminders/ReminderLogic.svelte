<script lang="ts">
  import { onMount } from 'svelte';
  import { db, type Debt } from '../../db';
  import { liveQuery } from 'dexie';

  let hasPermission = $state(false);

  // Constants
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const reminderData = liveQuery(async () => {
    const settings = await db.reminderSettings.get(1);
    if (!settings || !settings.enabled) return { count: 0, reminders: [] };

    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const now = Date.now();
    
    // Get all active debts with due dates, not disabled
    const activeDebts = await db.debts
      .filter((d: Debt) => d.status === 'aktif' && !!d.jatuh_tempo && !d.reminderDisabled)
      .toArray();

    const dueDebts: Debt[] = [];

    for (const debt of activeDebts) {
      if (!debt.jatuh_tempo) continue;
      
      const daysUntilDue = Math.ceil((debt.jatuh_tempo - now) / MS_PER_DAY);
      
      // Check if within reminder window (can be negative if overdue)
      if (daysUntilDue <= settings.daysBefore) {
        dueDebts.push(debt);
      }
    }

    return { count: dueDebts.length, reminders: dueDebts, todayStr };
  });

  // Effect to trigger OS notifications once per day per debt
  $effect(() => {
    const data = $reminderData;
    if (!data) return;
    
    const { reminders, todayStr } = data;
    if (reminders.length > 0 && hasPermission && todayStr) {
      checkAndSendOSNotifications(reminders, todayStr);
    }
  });

  async function checkAndSendOSNotifications(reminders: Debt[], todayStr: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    for (const debt of reminders) {
      if (!debt.id) continue;

      const log = await db.reminderLogs.where({ debtId: debt.id, notifiedDate: todayStr }).first();
      if (!log) {
        // Send notification
        const title = `Peringatan Jatuh Tempo ${debt.tipe === 'hutang' ? 'Hutang' : 'Piutang'}`;
        const days = Math.ceil((debt.jatuh_tempo! - Date.now()) / MS_PER_DAY);
        const timeText = days < 0 ? `terlewat ${Math.abs(days)} hari` : days === 0 ? 'hari ini' : `dalam ${days} hari`;
        const body = `Rp ${debt.nominal_awal.toLocaleString('id-ID')} - Jatuh tempo ${timeText}`;

        new Notification(title, {
          body,
          icon: '/favicon.png', // Assuming there's a favicon
        });

        // Log to prevent spam
        await db.reminderLogs.add({
          debtId: debt.id,
          notifiedDate: todayStr,
          createdAt: Date.now()
        });
      }
    }
  }

  onMount(() => {
    if ('Notification' in window) {
      hasPermission = Notification.permission === 'granted';
    }
  });
</script>

<!-- We don't render UI here, this just runs logic. UI is in layout navbar. -->
