<script lang="ts">
  import { patunganStore, contactStore } from '../stores';
  import type { UIPatunganSession } from '../stores';
  import type { Contact } from '../db';
  import { toastStore } from '../stores/toast';
  import ConfirmationDialog from './ConfirmationDialog.svelte';

  const patunganState = patunganStore;
  const contactState = contactStore;

  $: sessions = [...$patunganState.data].sort((a, b) => b.tanggal - a.tanggal);
  $: contacts = $contactState.data;
  $: if ($patunganState.error) toastStore.error(`Gagal memuat patungan: ${$patunganState.error}`);
  $: if ($contactState.error) toastStore.error(`Gagal memuat kontak: ${$contactState.error}`);
  let showModal = false;

  let showConfirm = false;
  let confirmTitle = '';
  let confirmMessage = '';
  let confirmText = 'Hapus';
  let confirmAction: (() => Promise<void>) | null = null;
  let sessionToDelete: UIPatunganSession | null = null;

  // Form State
  let sessionName = '';
  let sessionDate = new Date().toISOString().split('T')[0];
  let items: { id: number, name: string, price: string }[] = [];
  let participants: { id: number, contactId: number | 'new' | 'me', name: string, percent: number }[] = [];
  let autoPiutang = false;

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

  async function handleDelete(id: number) {
    const session = $patunganState.data.find(s => s.id === id);
    if (!session) return;
    confirmTitle = 'Hapus Sesi Patungan';
    confirmMessage = 'Hapus sesi patungan ini?';
    confirmText = 'Hapus';
    sessionToDelete = session;
    confirmAction = async () => {
      try {
        await patunganStore.deleteSession(id);
        toastStore.success('Sesi berhasil dihapus');
      } catch (error: unknown) {
        const message = getErrorMessage(error);
        if (message.includes('generated debt exists')) {
          toastStore.error('Sesi tidak dapat dihapus karena piutang otomatis masih ada. Hapus piutang terkait lebih dahulu.');
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
  
  let viewMode: 'list' | 'grouped' = 'list';
  let expandedGroups: Record<string, boolean> = {};

  function toggleGroup(name: string) {
    expandedGroups[name] = !expandedGroups[name];
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center mb-2">
    <h2 class="text-xl font-extrabold text-text-primary tracking-wide">Patungan</h2>
    <button
      onclick={openModal}
      class="bg-primary from-accent-light to-accent-dark text-white px-5 py-2.5 rounded-round shadow-accent-glow hover:scale-95 transition-transform font-bold flex items-center gap-2 active:bg-accent-light"
    >
      <span class="text-lg leading-none">+</span>
      <span>Buat Sesi</span>
    </button>
  </div>
  
  <!-- View Toggle -->
  <div class="flex gap-2 p-1 bg-gray-100 rounded-lg">
    <button
      onclick={() => viewMode = 'list'}
      class="{viewMode === 'list' ? 'bg-surface-card text-sky shadow-sm font-bold' : 'text-gray-500 font-medium'} flex-1 py-2 rounded-md transition-all text-sm"
    >
      📋 Riwayat Sesi
    </button>
    <button
      onclick={() => viewMode = 'grouped'}
      class="{viewMode === 'grouped' ? 'bg-surface-card text-sky shadow-sm font-bold' : 'text-gray-500 font-medium'} flex-1 py-2 rounded-md transition-all text-sm"
    >
      👥 Rekap per Orang
    </button>
  </div>

  <!-- Content List -->
  <div class="space-y-4 pb-4">
    {#if viewMode === 'list'}
        {#if sessions.length === 0}
          <div class="bg-surface-card p-10 rounded-xl shadow-card text-center border-[3px] border-dashed border-gray-200">
            <div class="text-4xl mb-3">🍕</div>
            <p class="text-text-secondary font-medium">Belum ada sesi patungan</p>
            <button onclick={openModal} class="text-primary font-bold mt-3 hover:text-primary-light">Buat patungan sekarang ✨</button>
          </div>
        {:else}
          {#each sessions as session (session.id)}
            <div class="bg-surface-card rounded-xl shadow-card p-5 border-l-[6px] border-sky relative overflow-hidden transition-transform hover:scale-[1.01]">
              <div class="flex justify-between items-start mb-3">
                <div>
                  <h3 class="font-extrabold text-xl text-text-primary">{session.nama_sesi}</h3>
                  <p class="text-xs font-medium text-text-muted mt-1 bg-gray-50 inline-block px-2 py-0.5 rounded-sm">
                    {formatDate(session.tanggal)}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-xl font-extrabold text-sky">
                    {formatRupiah(session.total || 0)}
                  </p>
                  <p class="text-[10px] font-bold text-text-muted uppercase mt-1 tracking-wider">Total Tagihan</p>
                </div>
              </div>

              <div class="bg-primary-bg/50 rounded-lg p-3 mb-4">
                <p class="text-xs font-bold text-primary-dark mb-2 uppercase tracking-wide border-b border-primary-light/20 pb-1">Partisipan ({session.participants?.length})</p>
                <div class="grid grid-cols-2 gap-2 mt-2">
                  {#each session.participants || [] as p}
                    <div class="text-xs font-medium text-text-secondary flex justify-between">
                      <span class="truncate pr-1 {p.is_talangan ? 'font-extrabold text-primary' : ''}">
                        {p.is_talangan ? '👑 ' : ''}{p.nama}
                      </span>
                      <span class="font-bold text-text-primary whitespace-nowrap">{formatRupiah(((p.persen / 100) * (session.total || 0)))}</span>
                    </div>
                  {/each}
                </div>
              </div>

              <div class="flex gap-2">
                <a 
                  href={generateWA(session)}
                  target="_blank"
                  class="flex-1 bg-green-50 text-success font-bold px-3 py-2.5 rounded-round hover:bg-success hover:text-white transition-colors text-sm text-center shadow-sm"
                >
                  Bagikan (WA)
                </a>
                <button 
                  onclick={() => { if(session.id) handleDelete(session.id) }}
                  class="px-4 py-2.5 bg-red-50 text-coral rounded-round hover:bg-coral hover:text-white transition-colors font-bold text-sm shadow-sm"
                >
                  Hapus
                </button>
              </div>
            </div>
          {/each}
        {/if}
    {:else}
        {#if getGroupedSessions().length === 0}
            <div class="bg-surface-card p-10 rounded-xl shadow-card text-center border-[3px] border-dashed border-gray-200">
                <div class="text-4xl mb-3">👥</div>
                <p class="text-text-secondary font-medium">Belum ada rekap hutang patungan</p>
            </div>
        {:else}
            {#each getGroupedSessions() as group}
                <div class="bg-surface-card rounded-xl shadow-card border border-gray-100 overflow-hidden transition-all">
                  <div 
                    class="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onclick={() => toggleGroup(group.contactName)}
                    role="button"
                    tabindex="0"
                    onkeypress={(e) => { if(e.key === 'Enter') toggleGroup(group.contactName) }}
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-sky/20 rounded-round flex items-center justify-center text-sky font-extrabold shadow-sm">
                        {group.contactName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 class="font-extrabold text-lg text-text-primary">{group.contactName}</h3>
                        <p class="text-xs font-bold text-text-muted">{group.sessions.length} patungan</p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-4 text-right">
                      <div class="hidden sm:block">
                        <p class="text-sm font-extrabold text-sky">{formatRupiah(group.totalTagihan)}</p>
                        <p class="text-[10px] text-text-muted mt-1 uppercase">Total Ditagih</p>
                      </div>
                      <div class="text-gray-400 transform transition-transform duration-300 {expandedGroups[group.contactName] ? 'rotate-180' : ''}">
                        ▼
                      </div>
                    </div>
                  </div>

                  {#if expandedGroups[group.contactName]}
                    <div class="bg-gray-50 border-t border-gray-100 p-2 space-y-2">
                      {#each group.sessions as s}
                        <div class="bg-surface-card rounded-lg p-3 border-l-[4px] border-sky shadow-sm flex justify-between items-center">
                          <div>
                             <p class="text-sm font-bold text-text-primary">{s.sessionName}</p>
                             <p class="text-[10px] text-text-muted">{formatDate(s.date)}</p>
                          </div>
                          <p class="text-sm font-extrabold text-sky">{formatRupiah(s.tagihan)}</p>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
            {/each}
        {/if}
    {/if}
  </div>

  <!-- Create Session Modal -->
  {#if showModal}
    <div class="fixed inset-0 bg-primary-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="presentation">
      <div class="bg-surface-card rounded-xl shadow-xl w-full max-w-md relative overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
        <div class="h-2 bg-gradient-to-r from-sky to-primary w-full flex-shrink-0"></div>
        <div class="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <h3 class="text-2xl font-extrabold text-primary-dark mb-6">🍕 Buat Sesi Patungan</h3>
          
          <div class="space-y-6">
            <!-- Info Dasar -->
            <div class="space-y-3">
              <input
                type="text"
                bind:value={sessionName}
                placeholder="Nama Sesi (cth: Bukber SMA)"
                class="w-full px-4 py-3 bg-cream border-2 border-transparent rounded-lg focus:border-sky focus:bg-surface-card focus:shadow-sky-glow transition-all text-text-primary font-bold placeholder:text-gray-400 text-lg"
              />
              <input type="date" bind:value={sessionDate} class="w-full px-4 py-3 bg-cream border-2 border-transparent rounded-lg focus:border-sky text-sm font-bold"/>
            </div>

            <!-- Items -->
            <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-extrabold text-text-secondary uppercase tracking-wide text-xs">Item Tagihan</h4>
                <button onclick={addItem} class="text-sky font-bold text-xs bg-sky/10 px-2 py-1 rounded hover:bg-sky/20">+ Item</button>
              </div>
              
              <div class="space-y-2">
                {#each items as item, i (item.id)}
                  <div class="flex gap-2">
                    <input type="text" bind:value={item.name} placeholder="Nama item" class="flex-[2] px-3 py-2 bg-surface-card border border-gray-200 rounded text-sm font-bold focus:border-sky outline-none"/>
                    <input type="number" bind:value={item.price} placeholder="Harga" class="flex-[2] px-3 py-2 bg-surface-card border border-gray-200 rounded text-sm font-bold focus:border-sky outline-none"/>
                    <button onclick={() => removeItem(item.id)} class="flex-none px-2 text-coral hover:text-coral-dark font-bold">✕</button>
                  </div>
                {/each}
              </div>
              <div class="mt-3 text-right">
                <span class="text-xs font-bold text-text-muted uppercase mr-2">Total Sementara:</span>
                <span class="text-lg font-extrabold text-sky">{formatRupiah(getTotal())}</span>
              </div>
            </div>

            <!-- Participants -->
            <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-extrabold text-text-secondary uppercase tracking-wide text-xs">Partisipan ({getTotalPercent()}%)</h4>
                <div class="space-x-2">
                  <button onclick={distributePercent} class="text-primary font-bold text-xs bg-primary/10 px-2 py-1 rounded hover:bg-primary/20">Bagi Rata</button>
                  <button onclick={addParticipant} class="text-sky font-bold text-xs bg-sky/10 px-2 py-1 rounded hover:bg-sky/20">+ Orang</button>
                </div>
              </div>
              
              <div class="space-y-2">
                {#each participants as p, i (p.id)}
                  <div class="flex gap-2 items-center">
                    {#if p.contactId === 'me'}
                      <div class="flex-[3] px-3 py-2 bg-primary-bg border border-primary-light/30 text-primary-dark rounded text-sm font-bold flex items-center">👑 Saya (Penalang)</div>
                    {:else}
                      <select bind:value={p.contactId} class="flex-none w-[100px] px-2 py-2 bg-surface-card border border-gray-200 rounded text-xs font-bold text-gray-600 outline-none">
                        <option value="new">Baru</option>
                        {#each contacts as c}
                          <option value={c.id}>{c.nama}</option>
                        {/each}
                      </select>
                      {#if p.contactId === 'new'}
                        <input type="text" bind:value={p.name} placeholder="Nama..." class="flex-1 min-w-0 px-2 py-2 bg-surface-card border border-gray-200 rounded text-sm font-bold focus:border-sky outline-none"/>
                      {:else}
                        <div class="flex-1 min-w-0 px-2 py-2 bg-gray-100 border border-transparent rounded text-sm font-bold text-gray-500 truncate">{contacts.find(c=>c.id===p.contactId)?.nama}</div>
                      {/if}
                    {/if}
                    
                    <div class="flex-none w-16 relative">
                      <input type="number" bind:value={p.percent} class="w-full px-2 py-2 pr-5 bg-surface-card border border-gray-200 rounded text-sm font-bold text-center focus:border-sky outline-none"/>
                      <span class="absolute right-2 top-2 text-xs font-bold text-gray-400">%</span>
                    </div>
                    
                    {#if p.contactId !== 'me'}
                      <button onclick={() => removeParticipant(p.id)} class="flex-none px-1 text-coral hover:text-coral-dark font-bold">✕</button>
                    {:else}
                      <div class="w-[20px]"></div> <!-- spacer -->
                    {/if}
                  </div>
                {/each}
              </div>
            </div>

            <!-- Auto Piutang Option -->
            <label class="flex items-start gap-3 p-3 bg-primary-bg/50 border border-primary-light/30 rounded-xl cursor-pointer">
              <input type="checkbox" bind:checked={autoPiutang} class="mt-1 w-4 h-4 text-primary accent-primary rounded border-gray-300"/>
              <div>
                <p class="text-sm font-bold text-primary-dark">Catat otomatis sebagai Piutang</p>
                <p class="text-xs font-medium text-primary-dark/70 mt-0.5">Sistem akan otomatis mencatat tagihan partisipan lain ke menu "Hutang/Piutang" karena Anda yang menalangi.</p>
              </div>
            </label>
          </div>

          <div class="mt-8 flex gap-3 pb-2">
            <button
              onclick={() => showModal = false}
              class="flex-1 px-4 py-3 bg-gray-100 rounded-round text-text-secondary font-bold hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              onclick={handleSave}
              class="flex-[2] bg-gradient-to-r from-sky to-[#3498db] text-white px-6 py-3 rounded-round shadow-sky-glow hover:scale-[0.98] transition-transform font-extrabold text-lg"
            >
              Selesai & Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom scrollbar for modal */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 20px;
  }
</style>
