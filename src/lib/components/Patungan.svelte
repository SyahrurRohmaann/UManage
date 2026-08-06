<script lang="ts">
  import { patunganStore, contactStore } from '../stores';
  import type { UIPatunganSession } from '../stores';
  import type { Contact } from '../db';
  import { toastStore } from '../stores/toast';
  import ConfirmationDialog from './ConfirmationDialog.svelte';

  const patunganState = patunganStore;
  const contactState = contactStore;

  const sessions = $derived([...$patunganState.data].sort((a, b) => b.tanggal - a.tanggal));
  const contacts = $derived($contactState.data);
  
  $effect(() => {
    if ($patunganState.error) toastStore.error(`Gagal memuat patungan: ${$patunganState.error}`);
    if ($contactState.error) toastStore.error(`Gagal memuat kontak: ${$contactState.error}`);
  });
  
  let showModal = $state(false);

  let showConfirm = $state(false);
  let confirmTitle = $state('');
  let confirmMessage = $state('');
  let confirmText = $state('Hapus');
  let confirmAction = $state<(() => Promise<void>) | null>(null);
  let sessionToDelete = $state<UIPatunganSession | null>(null);

  // Form State
  let sessionName = $state('');
  let sessionDate = $state(new Date().toISOString().split('T')[0]);
  let items = $state<{ id: number, name: string, price: string }[]>([]);
  let participants = $state<{ id: number, contactId: number | 'new' | 'me', name: string, percent: number }[]>([]);
  let autoPiutang = $state(false);

  function formatRupiah(amount: number) {
    return 'Rp ' + Math.abs(amount).toLocaleString('id-ID');
  }

  function formatDate(dateStr: string | number) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function toTimestamp(date: string): number {
    return new Date(`${date}T00:00:00`).getTime();
  }

  function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
  }

  function openModal() {
    sessionName = '';
    sessionDate = new Date().toISOString().split('T')[0];
    items = [{ id: Date.now(), name: '', price: '' }];
    participants = [
      { id: Date.now(), contactId: 'me', name: 'Saya (Penalang)', percent: 50 },
      { id: Date.now() + 1, contactId: 'new', name: '', percent: 50 }
    ];
    autoPiutang = true;
    showModal = true;
  }

  function addItem() {
    items = [...items, { id: Date.now(), name: '', price: '' }];
  }

  function removeItem(id: number) {
    items = items.filter(i => i.id !== id);
  }

  function addParticipant() {
    participants = [...participants, { id: Date.now(), contactId: 'new', name: '', percent: 0 }];
    distributePercent();
  }

  function removeParticipant(id: number) {
    participants = participants.filter(p => p.id !== id);
    distributePercent();
  }

  function distributePercent() {
    if (participants.length === 0) return;
    const base = Math.floor(100 / participants.length);
    let remainder = 100 - (base * participants.length);
    participants = participants.map((p, i) => ({
      ...p,
      percent: base + (i < remainder ? 1 : 0)
    }));
  }

  function getTotal() {
    return items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  }

  function getTotalPercent() {
    return participants.reduce((sum, p) => sum + p.percent, 0);
  }

  async function handleSave() {
    if (!sessionName.trim()) {
      toastStore.error('Nama sesi harus diisi!'); return;
    }
    if (items.length === 0 || items.some((item) => !item.name.trim())) {
      toastStore.error('Nama setiap item harus diisi!'); return;
    }
    if (items.some((item) => !Number.isFinite(Number(item.price)) || Number(item.price) <= 0)) {
      toastStore.error('Harga setiap item harus lebih dari nol!'); return;
    }
    if (participants.length < 2) {
      toastStore.error('Minimal harus ada 2 partisipan!'); return;
    }
    if (participants.some((participant) => participant.contactId === 'new' && !participant.name.trim())) {
      toastStore.error('Nama setiap partisipan baru harus diisi!'); return;
    }
    if (participants.some((participant) => !Number.isFinite(participant.percent) || participant.percent < 0 || participant.percent > 100)) {
      toastStore.error('Persentase setiap partisipan harus antara 0 sampai 100!'); return;
    }
    if (Math.abs(getTotalPercent() - 100) > 0.000001) {
      toastStore.error('Total persentase harus tepat 100%!'); return;
    }

    const createdContactIds: number[] = [];
    try {
      const preparedParticipants = [];
      for (const participant of participants) {
        let contactId: number | undefined;
        let name = participant.contactId === 'me' ? 'Saya' : participant.name.trim();
        if (participant.contactId === 'new') {
          const existing = contacts.find((contact) => contact.nama.toLowerCase() === name.toLowerCase());
          if (existing?.id !== undefined) contactId = existing.id;
          else {
            contactId = await contactStore.addContact(name);
            createdContactIds.push(contactId);
          }
        } else if (typeof participant.contactId === 'number') {
          contactId = participant.contactId;
          name = contacts.find((contact) => contact.id === contactId)?.nama ?? name;
        }
        preparedParticipants.push({ contact_id: contactId, nama: name, persen: participant.percent, is_talangan: participant.contactId === 'me' });
      }

      await patunganStore.createPatungan({
        session: { nama_sesi: sessionName.trim(), tanggal: toTimestamp(sessionDate) },
        items: items.map((item) => ({ nama_item: item.name.trim(), harga: Number(item.price) })),
        participants: preparedParticipants,
        generatedDebts: autoPiutang
          ? preparedParticipants.flatMap((participant, index) => participant.is_talangan || participant.contact_id === undefined || participant.persen <= 0
            ? []
            : [{ participantIndex: index, catatan: `Patungan: ${sessionName.trim()}` }])
          : undefined
      });
      showModal = false;
      toastStore.success('Sesi patungan berhasil disimpan!');
    } catch (error: unknown) {
      for (const contactId of createdContactIds) {
        try { await contactStore.deleteContact(contactId); } catch { /* Contact already referenced; keep it. */ }
      }
      toastStore.error(`Gagal menyimpan sesi patungan: ${getErrorMessage(error)}`);
    }
  }

  async function handleDelete(id: number, force: boolean = false) {
    const session = $patunganState.data.find(s => s.id === id);
    if (!session) return;
    
    confirmTitle = force ? 'Hapus Beserta Piutang' : 'Hapus Sesi Patungan';
    confirmMessage = force 
      ? 'Sesi ini terhubung dengan piutang. Apakah Anda yakin ingin menghapus sesi patungan ini beserta SEMUA catatan piutang dan riwayat pembayarannya sekaligus?' 
      : 'Hapus sesi patungan ini?';
    confirmText = force ? 'Ya, Hapus Semua' : 'Hapus';
    sessionToDelete = session;
    
    confirmAction = async () => {
      try {
        await patunganStore.deleteSession(id, force);
        toastStore.success('Sesi berhasil dihapus');
      } catch (error: unknown) {
        const message = getErrorMessage(error);
        if (message.includes('generated debt exists')) {
          showConfirm = false;
          // Prompt for force delete
          setTimeout(() => handleDelete(id, true), 100);
        } else {
          toastStore.error(`Gagal menghapus sesi: ${message}`);
        }
      }
    };
    showConfirm = true;
  }

  function generateWA(session: UIPatunganSession) {
    const total = session.total || 0;
    let text = "🍕 *Patungan: " + session.nama_sesi + "*\n📅 Tanggal: " + formatDate(session.tanggal) + "\n\n🛒 *Rincian Item:*\n";
    
    session.items?.forEach(i => {
      text += "- " + i.nama_item + ": " + formatRupiah(i.harga) + "\n";
    });
    
    text += "---\n💰 *Total Keseluruhan: " + formatRupiah(total) + "*\n\n🧑‍🤝‍🧑 *Tagihan Per Orang:*\n";
    
    session.participants?.forEach(p => {
      const tagihan = (p.persen / 100) * total;
      text += "- " + p.nama + " (" + p.persen + "%): *" + formatRupiah(tagihan) + "*\n";
    });

    text += "\nMohon segera ditransfer ya! Terima kasih 🙏";
    return 'https://wa.me/?text=' + encodeURIComponent(text);
  }

  interface GroupedSessionItem {
    sessionName: string;
    date: number;
    tagihan: number;
  }

  function getGroupedSessions() {
    const groupMap: Record<string, { contactName: string, totalTagihan: number, sessions: GroupedSessionItem[] }> = {};
    
    sessions.forEach(s => {
      if(!s.participants) return;
      s.participants.forEach(p => {
        if(p.is_talangan) return; // Only grouping those who owe
        
        const name = p.nama;
        if(!groupMap[name]) {
          groupMap[name] = { contactName: name, totalTagihan: 0, sessions: [] };
        }
        
        const tagihan = (p.persen / 100) * (s.total || 0);
        groupMap[name].totalTagihan += tagihan;
        groupMap[name].sessions.push({ sessionName: s.nama_sesi, date: s.tanggal, tagihan });
      });
    });
    
    return Object.values(groupMap).sort((a,b) => b.totalTagihan - a.totalTagihan);
  }
  
  let viewMode = $state<'list' | 'grouped'>('list');
  let expandedGroups = $state<Record<string, boolean>>({});

  function toggleGroup(name: string) {
    expandedGroups[name] = !expandedGroups[name];
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col md:flex-row md:justify-between md:items-end mb-stack-lg gap-4">
    <div>
      <h2 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Patungan</h2>
      <p class="font-body-md text-body-md text-on-surface-variant mt-1">Kelola tagihan bersama teman dan keluarga.</p>
    </div>
    <button
      onclick={openModal}
      class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-label-md text-label-md text-on-primary hover:bg-surface-tint transition-colors active:scale-95"
    >
      <span class="material-symbols-outlined text-[18px]">add</span>
      Buat Patungan Baru
    </button>
  </div>
  
  <!-- View Toggle -->
  <div class="flex items-center justify-between bg-surface-container-lowest border border-outline-variant rounded-xl p-1 mb-6">
    <button
      onclick={() => viewMode = 'list'}
      class="flex-1 py-2 rounded-lg text-center font-label-md text-label-md {viewMode === 'list' ? 'bg-surface-container-high text-primary font-bold shadow-sm' : 'text-on-surface-variant'} transition-all"
    >
      Riwayat Sesi
    </button>
    <button
      onclick={() => viewMode = 'grouped'}
      class="flex-1 py-2 rounded-lg text-center font-label-md text-label-md {viewMode === 'grouped' ? 'bg-surface-container-high text-primary font-bold shadow-sm' : 'text-on-surface-variant'} transition-all"
    >
      Rekap per Orang
    </button>
  </div>

  <!-- Content List -->
  <div class="space-y-4 pb-4">
    {#if viewMode === 'list'}
        {#if sessions.length === 0}
          <div class="bg-surface-container-lowest p-10 rounded-xl text-center border-2 border-dashed border-outline-variant">
            <p class="font-bold mb-2">Belum ada sesi patungan</p>
            <p class="font-label-sm text-label-sm mb-4 text-on-surface-variant">Buat sesi baru untuk membagi tagihan.</p>
            <button onclick={openModal} class="text-primary font-bold mt-3 hover:underline">Buat patungan sekarang</button>
          </div>
        {:else}
          <h3 class="font-headline-md text-headline-md font-bold text-primary mb-stack-md mt-6">Daftar Patungan</h3>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {#each sessions as session (session.id)}
              <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:border-outline transition-colors flex flex-col group">
                <div class="p-6 border-b border-surface-variant bg-surface-bright flex justify-between items-start gap-4">
                  <div class="flex items-start gap-3">
                    <div class="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
                      <span class="material-symbols-outlined icon-fill">group</span>
                    </div>
                    <div>
                      <h4 class="font-headline-md text-headline-md font-bold text-primary">{session.nama_sesi}</h4>
                      <p class="font-label-sm text-label-sm text-on-surface-variant mt-1">{formatDate(session.tanggal)}</p>
                    </div>
                  </div>
                </div>
                
                <div class="p-6 flex-1">
                  <div class="flex justify-between items-center mb-4">
                    <span class="font-label-md text-label-md text-on-surface-variant">Total Tagihan: <strong class="text-primary">{formatRupiah(session.total || 0)}</strong></span>
                  </div>
                  
                  <p class="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wide border-b border-outline-variant/30 pb-2">Partisipan ({session.participants?.length})</p>
                  <ul class="space-y-0">
                    {#each session.participants || [] as p}
                      <li class="flex items-center justify-between py-2 border-b border-surface-variant last:border-0">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full {p.is_talangan ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'} flex items-center justify-center font-bold font-label-sm">
                            {p.nama.charAt(0).toUpperCase()}
                          </div>
                          <span class="font-body-md text-body-md text-primary">{p.nama} {p.is_talangan ? '(Talangan)' : ''}</span>
                        </div>
                        <div class="flex items-center gap-4">
                          <span class="font-label-md text-label-md text-primary font-bold">{formatRupiah(((p.persen / 100) * (session.total || 0)))}</span>
                        </div>
                      </li>
                    {/each}
                  </ul>
                </div>

                <div class="p-4 bg-surface-bright border-t border-surface-variant flex gap-3">
                  <a 
                    href={generateWA(session)}
                    target="_blank"
                    class="flex-1 bg-secondary/10 text-secondary font-label-md text-label-md px-3 py-2.5 rounded-lg hover:bg-secondary/20 transition-colors text-center"
                  >
                    Bagikan WA
                  </a>
                  <button 
                    onclick={() => { if(session.id) handleDelete(session.id) }}
                    class="px-4 py-2.5 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors font-label-md text-label-md"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
    {:else}
        {#if getGroupedSessions().length === 0}
            <div class="bg-surface-container-lowest p-10 rounded-xl text-center border-2 border-dashed border-outline-variant">
                <p class="font-bold mb-2">Belum ada rekap patungan</p>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {#each getGroupedSessions() as group}
                  <div class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden transition-all group">
                    <div 
                      class="p-4 flex justify-between items-center cursor-pointer hover:bg-surface-container transition-colors"
                      onclick={() => toggleGroup(group.contactName)}
                      role="button"
                      tabindex="0"
                      onkeypress={(e) => { if(e.key === 'Enter') toggleGroup(group.contactName) }}
                    >
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                          {group.contactName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 class="font-label-md text-label-md font-bold text-on-surface">{group.contactName}</h3>
                          <p class="text-xs text-on-surface-variant">{group.sessions.length} patungan</p>
                        </div>
                      </div>
                      
                      <div class="flex items-center gap-4 text-right">
                        <div>
                          <p class="font-label-md text-label-md font-bold text-primary">{formatRupiah(group.totalTagihan)}</p>
                        </div>
                        <span class="material-symbols-outlined text-on-surface-variant transition-transform duration-300 {expandedGroups[group.contactName] ? 'rotate-180' : ''}">
                          expand_more
                        </span>
                      </div>
                    </div>

                    {#if expandedGroups[group.contactName]}
                      <div class="bg-surface-bright border-t border-outline-variant p-3 space-y-2">
                        {#each group.sessions as s}
                          <div class="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/50 flex justify-between items-center">
                            <div>
                               <p class="font-label-md text-label-md text-on-surface">{s.sessionName}</p>
                               <p class="text-xs text-on-surface-variant mt-0.5">{formatDate(s.date)}</p>
                            </div>
                            <p class="font-label-md text-label-md font-bold text-primary">{formatRupiah(s.tagihan)}</p>
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
              {/each}
            </div>
        {/if}
    {/if}
  </div>

  <!-- Create Session Modal -->
  {#if showModal}
    <div class="fixed inset-0 bg-inverse-surface/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="presentation">
      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-md relative overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
        <div class="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <h3 class="font-headline-md text-headline-md font-bold text-on-surface mb-6">Buat Sesi Patungan</h3>
          
          <div class="space-y-6">
            <!-- Info Dasar -->
            <div class="space-y-3">
              <input
                type="text"
                bind:value={sessionName}
                placeholder="Nama Sesi (cth: Bukber SMA)"
                class="w-full rounded-lg bg-background border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all px-4 py-3 font-label-md text-label-md text-on-surface"
              />
              <input type="date" bind:value={sessionDate} class="w-full rounded-lg bg-background border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all px-4 py-3 font-label-md text-label-md text-on-surface"/>
            </div>

            <!-- Items -->
            <div class="bg-surface-bright rounded-xl p-4 border border-outline-variant">
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-label-sm text-label-sm font-bold text-on-surface-variant uppercase tracking-wide">Item Tagihan</h4>
                <button onclick={addItem} class="text-primary font-label-sm text-label-sm bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 transition-colors">+ Item</button>
              </div>
              
              <div class="space-y-2">
                {#each items as item, i (item.id)}
                  <div class="flex gap-2">
                    <input type="text" bind:value={item.name} placeholder="Nama item" class="flex-[2] px-3 py-2 bg-background border border-outline-variant rounded-md text-sm font-bold focus:border-primary outline-none text-on-surface"/>
                    <input type="number" bind:value={item.price} placeholder="Harga" class="flex-[2] px-3 py-2 bg-background border border-outline-variant rounded-md text-sm font-bold focus:border-primary outline-none text-on-surface"/>
                    <button onclick={() => removeItem(item.id)} class="flex-none px-2 text-error hover:text-error/80 font-bold material-symbols-outlined text-[20px]">close</button>
                  </div>
                {/each}
              </div>
              <div class="mt-4 pt-3 border-t border-outline-variant/50 flex justify-between items-center">
                <span class="font-label-sm text-label-sm font-bold text-on-surface-variant uppercase">Total Sementara:</span>
                <span class="font-headline-md text-headline-md font-bold text-primary">{formatRupiah(getTotal())}</span>
              </div>
            </div>

            <!-- Participants -->
            <div class="bg-surface-bright rounded-xl p-4 border border-outline-variant">
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-label-sm text-label-sm font-bold text-on-surface-variant uppercase tracking-wide">Partisipan ({getTotalPercent()}%)</h4>
                <div class="space-x-2">
                  <button onclick={distributePercent} class="text-secondary font-label-sm text-label-sm bg-secondary/10 px-2 py-1 rounded hover:bg-secondary/20 transition-colors">Bagi Rata</button>
                  <button onclick={addParticipant} class="text-primary font-label-sm text-label-sm bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 transition-colors">+ Orang</button>
                </div>
              </div>
              
              <div class="space-y-2">
                {#each participants as p, i (p.id)}
                  <div class="flex gap-2 items-center">
                    {#if p.contactId === 'me'}
                      <div class="flex-[3] px-3 py-2 bg-primary/10 border border-primary/20 text-primary rounded-md font-label-md text-label-md font-bold flex items-center">Saya (Penalang)</div>
                    {:else}
                      <select bind:value={p.contactId} class="flex-none w-[100px] px-2 py-2 bg-background border border-outline-variant rounded-md font-label-sm text-label-sm text-on-surface outline-none">
                        <option value="new">Baru</option>
                        {#each contacts as c}
                          <option value={c.id}>{c.nama}</option>
                        {/each}
                      </select>
                      {#if p.contactId === 'new'}
                        <input type="text" bind:value={p.name} placeholder="Nama..." class="flex-1 min-w-0 px-2 py-2 bg-background border border-outline-variant rounded-md font-label-sm text-label-sm focus:border-primary outline-none text-on-surface"/>
                      {:else}
                        <div class="flex-1 min-w-0 px-2 py-2 bg-surface-container border border-transparent rounded-md font-label-sm text-label-sm text-on-surface-variant truncate">{contacts.find(c=>c.id===p.contactId)?.nama}</div>
                      {/if}
                    {/if}
                    
                    <div class="flex-none w-16 relative">
                      <input type="number" bind:value={p.percent} class="w-full px-2 py-2 pr-5 bg-background border border-outline-variant rounded-md font-label-sm text-label-sm text-center focus:border-primary outline-none text-on-surface"/>
                      <span class="absolute right-2 top-2 font-label-sm text-label-sm text-on-surface-variant">%</span>
                    </div>
                    
                    {#if p.contactId !== 'me'}
                      <button onclick={() => removeParticipant(p.id)} class="flex-none px-1 text-error hover:text-error/80 font-bold material-symbols-outlined text-[20px]">close</button>
                    {:else}
                      <div class="w-[28px]"></div> <!-- spacer -->
                    {/if}
                  </div>
                {/each}
              </div>
            </div>

            <!-- Auto Piutang Option -->
            <label class="flex items-start gap-3 p-4 bg-secondary/5 border border-secondary/20 rounded-xl cursor-pointer hover:bg-secondary/10 transition-colors">
              <input type="checkbox" bind:checked={autoPiutang} class="mt-0.5 w-4 h-4 text-secondary accent-secondary rounded border-outline-variant"/>
              <div>
                <p class="font-label-md text-label-md font-bold text-on-surface">Catat otomatis sebagai Piutang</p>
                <p class="text-xs mt-1 text-on-surface-variant">Sistem akan otomatis mencatat tagihan partisipan lain ke menu "Hutang/Piutang" karena Anda yang menalangi.</p>
              </div>
            </label>
          </div>

          <div class="mt-8 flex gap-3 pb-2">
            <button
              onclick={() => showModal = false}
              class="flex-1 px-4 py-3 bg-surface-container border border-outline-variant rounded-lg text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors"
            >
              Batal
            </button>
            <button
              onclick={handleSave}
              class="flex-[2] bg-primary text-on-primary px-6 py-3 rounded-lg hover:bg-surface-tint transition-colors font-label-md text-label-md"
            >
              Selesai & Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<ConfirmationDialog
  bind:show={showConfirm}
  title={confirmTitle}
  message={confirmMessage}
  confirmText={confirmText}
  onConfirm={confirmAction}
/>

<style>
  /* Custom scrollbar for modal */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: var(--color-outline-variant);
    border-radius: 20px;
  }
</style>
