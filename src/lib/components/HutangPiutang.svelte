<script lang="ts">
  import { debtStore, contactStore, walletStore, getContactDetail, type UIDebt, type UIPayment, type UIContactDetail } from '../stores';
  import { toastStore } from '../stores/toast';
  import ConfirmationDialog from './ConfirmationDialog.svelte';

  $: debts = $debtStore.data;
  $: contacts = $contactStore.data;
  $: wallets = $walletStore.data;
  $: activeDebt = selectedDebtId === null ? undefined : debts.find((d) => d.id === selectedDebtId);
  $: selectedPayment = activeDebt?.payments.find((p) => p.id === selectedPaymentId);
  $: groups = groupedDebts(debts, filterType, filterStatus, sortBy, searchQuery);

  let showAdd = false;
  let showEditDebt = false;
  let showPayment = false;
  let showEditPayment = false;
  let showContact = false;
  let selectedDebtId: number | null = null;
  let selectedPaymentId: number | null = null;
  let contactDetail: UIContactDetail | undefined;
  let contactDetailId: number | null = null;
  let submitting = false;
  let detailLoading = false;

  let filterType: 'all' | 'hutang' | 'piutang' = 'all';
  let filterStatus: 'all' | 'aktif' | 'lunas' | 'terlambat' = 'aktif';
  let sortBy: 'terbaru' | 'terlama' | 'jatuh-tempo' | 'sisa-terbesar' = 'terbaru';
  let searchQuery = '';

  let formType: 'hutang' | 'piutang' = 'piutang';
  let formContactId: number | 'new' = 'new';
  let formContactName = '';
  let formAmount = '';
  let formDate = today();
  let formDue = '';
  let formNote = '';

  let payAmount = '';
  let payDate = today();
  let payWallet: number | '' = '';
  let payNote = '';

  function today(): string { return new Date().toISOString().slice(0, 10); }
  function rupiah(n: number): string { return `Rp ${Math.abs(n).toLocaleString('id-ID')}`; }
  function date(v: number | undefined): string { return v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'; }
  function timestamp(v: string): number { return new Date(`${v}T00:00:00`).getTime(); }
  function errorText(e: unknown): string { return e instanceof Error ? e.message : 'Terjadi kesalahan yang tidak diketahui.'; }
  function overdue(d: UIDebt): boolean { const t = new Date(); t.setHours(0, 0, 0, 0); return d.status === 'aktif' && d.jatuh_tempo !== undefined && d.jatuh_tempo < t.getTime(); }
  function contactName(id: number): string { return contacts.find((c) => c.id === id)?.nama ?? 'Kontak tidak ditemukan'; }

  type ContactHistoryItem =
    | { kind: 'debt'; date: number; debt: UIDebt }
    | { kind: 'payment'; date: number; debt: UIDebt; payment: UIPayment };

  function contactHistory(detail: UIContactDetail): ContactHistoryItem[] {
    return detail.debts
      .flatMap((debt): ContactHistoryItem[] => [
        { kind: 'debt', date: debt.tanggal, debt },
        ...debt.payments.map((payment): ContactHistoryItem => ({ kind: 'payment', date: payment.tanggal, debt, payment }))
      ])
      .sort((a, b) => b.date - a.date);
  }

  function dialog(node: HTMLElement, close: () => void): { destroy: () => void } {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = node.querySelector<HTMLElement>('input, select, textarea, button, [tabindex]:not([tabindex="-1"])');
    focusable?.focus();
    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    node.addEventListener('keydown', handleKeydown);
    return {
      destroy(): void {
        node.removeEventListener('keydown', handleKeydown);
        previouslyFocused?.focus();
      }
    };
  }

  $: totalHutang = debts.filter((d) => d.status === 'aktif' && d.tipe === 'hutang').reduce((s, d) => s + d.sisa, 0);
  $: totalPiutang = debts.filter((d) => d.status === 'aktif' && d.tipe === 'piutang').reduce((s, d) => s + d.sisa, 0);

  let showConfirm = false;
  let confirmTitle = '';
  let confirmMessage = '';
  let confirmText = 'Hapus';
  let confirmAction: (() => Promise<void>) | undefined = undefined;

  function groupedDebts(
    source: UIDebt[],
    type: typeof filterType,
    status: typeof filterStatus,
    order: typeof sortBy,
    query: string
  ) {
    let list = source.filter((d) => type === 'all' || d.tipe === type)
      .filter((d) => status === 'all' || (status === 'terlambat' ? overdue(d) : d.status === status))
      .filter((d) => !query || `${d.contact_name} ${d.catatan ?? ''}`.toLowerCase().includes(query.toLowerCase()));
    const map = new Map<number, { id: number; name: string; hutang: number; piutang: number; debts: UIDebt[] }>();
    for (const d of list) {
      const id = d.contact_id; const g = map.get(id) ?? { id, name: d.contact_name, hutang: 0, piutang: 0, debts: [] };
      g.debts.push(d); if (d.status === 'aktif') d.tipe === 'hutang' ? g.hutang += d.sisa : g.piutang += d.sisa; map.set(id, g);
    }
    return [...map.values()].map((g) => ({ ...g, debts: g.debts.sort((a, b) => order === 'terlama' ? a.tanggal - b.tanggal : order === 'jatuh-tempo' ? (a.jatuh_tempo ?? Infinity) - (b.jatuh_tempo ?? Infinity) : order === 'sisa-terbesar' ? b.sisa - a.sisa : b.tanggal - a.tanggal) }));
  }

  function resetDebtForm(): void { formType = 'piutang'; formContactId = 'new'; formContactName = ''; formAmount = ''; formDate = today(); formDue = ''; formNote = ''; }
  function openAdd(): void { resetDebtForm(); showAdd = true; }
  function openEdit(d: UIDebt): void { if (!d.id) return; selectedDebtId = d.id; formType = d.tipe; formContactId = d.contact_id; formAmount = String(d.nominal_awal); formDate = new Date(d.tanggal).toISOString().slice(0, 10); formDue = d.jatuh_tempo ? new Date(d.jatuh_tempo).toISOString().slice(0, 10) : ''; formNote = d.catatan ?? ''; showEditDebt = true; }

  async function refreshDetail(): Promise<void> { if (contactDetailId !== null) contactDetail = await getContactDetail(contactDetailId); }
  async function openContact(id: number): Promise<void> { contactDetailId = id; showContact = true; detailLoading = true; try { contactDetail = await getContactDetail(id); } catch (e) { toastStore.error(`Gagal memuat detail kontak: ${errorText(e)}`); } finally { detailLoading = false; } }

  async function saveDebt(edit: boolean): Promise<void> {
    const amount = Number(formAmount); if (!Number.isFinite(amount) || amount <= 0) { toastStore.error('Nominal harus lebih dari nol.'); return; }
    if (formContactId === 'new' && !formContactName.trim()) { toastStore.error('Nama kontak harus diisi.'); return; }
    if (submitting) return; submitting = true;
    try {
      if (edit && selectedDebtId !== null) await debtStore.updateDebt(selectedDebtId, { tipe: formType, contact_id: formContactId === 'new' ? undefined : formContactId, nominal_awal: amount, tanggal: timestamp(formDate), jatuh_tempo: formDue ? timestamp(formDue) : undefined, catatan: formNote.trim() || undefined });
      else if (formContactId === 'new') await debtStore.addDebtWithContact({ contactName: formContactName, debt: { tipe: formType, nominal_awal: amount, tanggal: timestamp(formDate), jatuh_tempo: formDue ? timestamp(formDue) : undefined, catatan: formNote.trim() || undefined } });
      else await debtStore.addDebt({ tipe: formType, contact_id: formContactId, nominal_awal: amount, tanggal: timestamp(formDate), jatuh_tempo: formDue ? timestamp(formDue) : undefined, catatan: formNote.trim() || undefined });
      showAdd = false; showEditDebt = false; await refreshDetail(); toastStore.success(edit ? 'Catatan diperbarui.' : 'Catatan berhasil ditambahkan.');
    } catch (e) { toastStore.error(`Gagal menyimpan catatan: ${errorText(e)}`); } finally { submitting = false; }
  }

  function openAddPayment(d: UIDebt): void { if (!d.id) return; selectedDebtId = d.id; selectedPaymentId = null; payAmount = String(d.sisa); payDate = today(); payWallet = wallets[0]?.id ?? ''; payNote = ''; showPayment = true; }
  function openEditPayment(d: UIDebt, p: UIPayment): void { if (!d.id || !p.id) return; selectedDebtId = d.id; selectedPaymentId = p.id; payAmount = String(p.nominal); payDate = new Date(p.tanggal).toISOString().slice(0, 10); payWallet = p.wallet?.id ?? ''; payNote = p.catatan ?? ''; showEditPayment = true; }
  async function savePayment(edit: boolean): Promise<void> {
    const d = activeDebt; const amount = Number(payAmount); if (!d || !d.id || !Number.isFinite(amount) || amount <= 0) { toastStore.error('Nominal pembayaran tidak valid.'); return; }
    if (!edit && amount > d.sisa) { toastStore.error('Pembayaran tidak boleh melebihi sisa.'); return; }
    if (submitting) return; submitting = true;
    try {
      if (edit && selectedPaymentId !== null) await debtStore.updatePayment(selectedPaymentId, { nominal: amount, tanggal: timestamp(payDate), catatan: payNote.trim() || undefined, walletId: payWallet === '' ? null : payWallet });
      else await debtStore.addPayment({ debtId: d.id, nominal: amount, tanggal: timestamp(payDate), catatan: payNote.trim() || undefined, walletId: payWallet === '' ? undefined : payWallet });
      showPayment = false; showEditPayment = false; await refreshDetail(); toastStore.success(edit ? 'Pembayaran diperbarui.' : 'Pembayaran berhasil dicatat.');
    } catch (e) { toastStore.error(`Gagal menyimpan pembayaran: ${errorText(e)}`); } finally { submitting = false; }
  }
  async function removePayment(p: UIPayment): Promise<void> { if (!p.id || submitting) return; confirmTitle = 'Hapus Pembayaran'; confirmMessage = 'Hapus pembayaran ini? Transaksi wallet yang terhubung juga akan dihapus dan sisa akan dihitung ulang.'; confirmText = 'Hapus'; confirmAction = async () => { submitting = true; try { await debtStore.deletePayment(p.id!); await refreshDetail(); toastStore.success('Pembayaran dihapus.'); } catch (e) { toastStore.error(`Gagal menghapus pembayaran: ${errorText(e)}`); } finally { submitting = false; } }; showConfirm = true; }
  async function removeDebt(d: UIDebt): Promise<void> { if (!d.id || submitting) return; confirmTitle = 'Hapus Catatan'; confirmMessage = 'Hapus catatan ini beserta seluruh riwayat pembayaran dan transaksi wallet yang terhubung?'; confirmText = 'Hapus'; confirmAction = async () => { submitting = true; try { await debtStore.deleteDebt(d.id!); await refreshDetail(); toastStore.success('Catatan dihapus.'); } catch (e) { toastStore.error(`Gagal menghapus catatan: ${errorText(e)}`); } finally { submitting = false; } }; showConfirm = true; }
  async function removeContact(): Promise<void> { if (!contactDetailId || submitting) return; confirmTitle = 'Hapus Kontak'; confirmMessage = 'Apakah Anda yakin ingin menghapus kontak ini? Kontak tidak akan muncul lagi di daftar, namun riwayat transaksi yang sudah ada tetap terjaga.'; confirmText = 'Hapus'; confirmAction = async () => { submitting = true; try { await contactStore.softDeleteContact(contactDetailId!); showContact = false; toastStore.success('Kontak dihapus.'); } catch (e) { toastStore.error(`Gagal menghapus kontak: ${errorText(e)}`); } finally { submitting = false; } }; showConfirm = true; }
  function wa(d: UIDebt): string { const text = `Halo ${d.contact_name}, pengingat ${d.tipe === 'piutang' ? 'pinjaman' : 'hutang'} sebesar ${rupiah(d.sisa)}${d.jatuh_tempo ? `, jatuh tempo ${date(d.jatuh_tempo)}` : ''}.`; return `https://wa.me/?text=${encodeURIComponent(text)}`; }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between"><h2 class="text-xl font-extrabold text-text-primary">Hutang &amp; Piutang</h2><button class="bg-primary from-accent-light to-accent-dark text-white dark:text-primary-bg px-5 py-2.5 rounded-lg font-bold" onclick={openAdd}>Catat</button></div>
  <div class="grid grid-cols-2 gap-4"><div class="bg-surface-card rounded-xl shadow-card p-4 border-l-[6px] border-success"><span class="text-xs font-bold text-text-secondary">PIUTANG AKTIF</span><p class="text-lg font-extrabold text-success">{rupiah(totalPiutang)}</p></div><div class="bg-surface-card rounded-xl shadow-card p-4 border-l-[6px] border-coral"><span class="text-xs font-bold text-text-secondary">HUTANG AKTIF</span><p class="text-lg font-extrabold text-coral">{rupiah(totalHutang)}</p></div></div>
  <div class="bg-surface-card rounded-xl p-4 shadow-card space-y-3"><input aria-label="Cari nama atau catatan" bind:value={searchQuery} placeholder="Cari nama atau catatan" class="w-full px-4 py-3 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded-lg font-bold" /><div class="grid grid-cols-3 gap-2"><select aria-label="Filter tipe" bind:value={filterType} class="px-2 py-2 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded-lg font-bold"><option value="all">Semua tipe</option><option value="hutang">Hutang</option><option value="piutang">Piutang</option></select><select aria-label="Filter status" bind:value={filterStatus} class="px-2 py-2 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded-lg font-bold"><option value="all">Semua status</option><option value="aktif">Aktif</option><option value="lunas">Lunas</option><option value="terlambat">Terlambat</option></select><select aria-label="Urutkan" bind:value={sortBy} class="px-2 py-2 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded-lg font-bold"><option value="terbaru">Terbaru</option><option value="terlama">Terlama</option><option value="jatuh-tempo">Jatuh tempo</option><option value="sisa-terbesar">Sisa terbesar</option></select></div></div>

  {#if groups.length === 0}<div class="bg-surface-card rounded-xl p-10 text-center text-text-secondary">Belum ada catatan hutang/piutang.</div>{:else}{#each groups as group (group.id)}<section class="bg-surface-card rounded-xl shadow-card overflow-hidden"><button class="w-full p-4 flex items-center justify-between text-left" aria-label={`Buka catatan ${group.name}`} onclick={() => openContact(group.id)}><span><strong class="text-lg">{group.name}</strong><small class="block text-text-muted">{group.debts.length} catatan · Detail kontak</small></span><span class="text-right">{#if group.piutang}<b class="block text-success">+{rupiah(group.piutang)}</b>{/if}{#if group.hutang}<b class="block text-coral">-{rupiah(group.hutang)}</b>{/if}</span></button><div class="border-t border-gray-100 p-3 space-y-3">{#each group.debts as d (d.id)}<article class="rounded-lg p-4 border-l-4 {d.tipe === 'piutang' ? 'border-success' : 'border-coral'} bg-surface-card"><div class="flex justify-between gap-3"><div><span class="text-[10px] uppercase font-bold">{d.tipe} · {d.status}</span><p class="font-bold">{d.catatan || 'Tanpa catatan'}</p><p class="text-xs text-text-muted">{date(d.tanggal)} · Jatuh tempo {date(d.jatuh_tempo)}</p></div><div class="text-right"><b class="block">{rupiah(d.sisa)}</b><small class="text-text-muted">dari {rupiah(d.nominal_awal)}</small></div></div>{#if d.payments.length}<div class="mt-3 border-t pt-2"><p class="text-xs font-bold text-text-secondary mb-2">Riwayat pembayaran ({d.payments.length})</p>{#each d.payments as p (p.id)}<div class="flex items-center justify-between gap-2 text-sm py-1"><span>{date(p.tanggal)} · {rupiah(p.nominal)}{p.catatan ? ` · ${p.catatan}` : ''}{p.wallet ? ` · ${p.wallet.nama}` : ''}</span><span class="flex gap-1"><button class="min-h-11 min-w-11 rounded px-2 text-primary-dark underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark" aria-label="Edit pembayaran" onclick={() => openEditPayment(d, p)}>Edit</button><button class="min-h-11 min-w-11 rounded px-2 text-coral underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral" aria-label="Hapus pembayaran" onclick={() => removePayment(p)}>Hapus</button></span></div>{/each}</div>{/if}<div class="mt-3 flex flex-wrap gap-2">{#if d.status === 'aktif'}<button class="bg-primary-bg text-primary-dark font-bold px-3 py-1.5 rounded" onclick={() => openAddPayment(d)}>Bayar</button><a class="bg-green-50 dark:bg-primary-bg text-success font-bold px-3 py-1.5 rounded" href={wa(d)} target="_blank" rel="noreferrer">Tagih WA</a>{/if}<button class="bg-gray-100 px-3 py-1.5 rounded font-bold" onclick={() => openEdit(d)}>Edit</button><button class="bg-red-50 dark:bg-primary-bg text-coral px-3 py-1.5 rounded font-bold" onclick={() => removeDebt(d)}>Hapus</button></div></article>{/each}</div></section>{/each}{/if}
</div>

{#if showAdd || showEditDebt}<div class="fixed inset-0 bg-primary-dark/40 flex items-center justify-center z-50 p-4" role="presentation"><div class="bg-surface-card rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="debt-dialog-title" use:dialog={() => { showAdd = false; showEditDebt = false; }}><h3 id="debt-dialog-title" class="text-xl font-extrabold mb-4">{showEditDebt ? 'Edit catatan' : 'Catat hutang/piutang'}</h3><div class="space-y-3"><div class="grid grid-cols-2 gap-2"><button class="p-2 rounded font-bold {formType === 'piutang' ? 'bg-success text-white' : 'bg-gray-100'}" onclick={() => formType = 'piutang'}>Piutang</button><button class="p-2 rounded font-bold {formType === 'hutang' ? 'bg-coral text-white' : 'bg-gray-100'}" onclick={() => formType = 'hutang'}>Hutang</button></div><label class="block text-sm font-bold">Kontak<select bind:value={formContactId} class="w-full mt-1 p-2 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded">{#if !showEditDebt}<option value="new">Kontak baru</option>{/if}{#each contacts as c}<option value={c.id}>{c.nama}</option>{/each}</select></label>{#if formContactId === 'new'}<label class="block text-sm font-bold">Nama<input bind:value={formContactName} class="w-full mt-1 p-2 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded" /></label>{/if}<label class="block text-sm font-bold">Nominal<input type="number" min="1" bind:value={formAmount} class="w-full mt-1 p-2 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded" /></label><div class="grid grid-cols-2 gap-2"><label class="text-sm font-bold">Tanggal<input type="date" bind:value={formDate} class="w-full mt-1 p-2 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded" /></label><label class="text-sm font-bold">Jatuh tempo<input type="date" bind:value={formDue} class="w-full mt-1 p-2 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded" /></label></div><label class="block text-sm font-bold">Catatan<textarea bind:value={formNote} rows="2" class="w-full mt-1 p-2 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded"></textarea></label></div><div class="mt-5 flex gap-2"><button class="flex-1 p-3 bg-gray-100 rounded font-bold" onclick={() => { showAdd = false; showEditDebt = false; }}>Batal</button><button disabled={submitting} class="flex-1 p-3 bg-primary text-white dark:text-primary-bg rounded font-bold" onclick={() => saveDebt(showEditDebt)}>{submitting ? 'Menyimpan...' : 'Simpan'}</button></div></div></div>{/if}

{#if showPayment || showEditPayment}{#if activeDebt}<div class="fixed inset-0 bg-primary-dark/40 flex items-center justify-center z-50 p-4" role="presentation"><div class="bg-surface-card rounded-xl p-6 w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="payment-dialog-title" use:dialog={() => { showPayment = false; showEditPayment = false; }}><h3 id="payment-dialog-title" class="text-xl font-extrabold mb-1">{showEditPayment ? 'Edit pembayaran' : 'Catat pembayaran'}</h3><p class="text-sm text-text-secondary mb-4">Sisa {rupiah(activeDebt.sisa)}</p><div class="space-y-3"><label class="block text-sm font-bold">Nominal<input type="number" min="1" max={showEditPayment ? undefined : activeDebt.sisa} bind:value={payAmount} class="w-full mt-1 p-2 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded" /></label><label class="block text-sm font-bold">Tanggal<input type="date" bind:value={payDate} class="w-full mt-1 p-2 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded" /></label><label class="block text-sm font-bold">Wallet<select bind:value={payWallet} class="w-full mt-1 p-2 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded"><option value="">Tanpa wallet</option>{#each wallets as w}<option value={w.id}>{w.nama} ({rupiah(w.saldo)})</option>{/each}</select></label><label class="block text-sm font-bold">Catatan<input bind:value={payNote} class="w-full mt-1 p-2 bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors rounded" /></label></div><div class="mt-5 flex gap-2"><button class="flex-1 p-3 bg-gray-100 rounded font-bold" onclick={() => { showPayment = false; showEditPayment = false; }}>Batal</button><button disabled={submitting} class="flex-1 p-3 bg-primary text-white rounded font-bold" onclick={() => savePayment(showEditPayment)}>{submitting ? 'Menyimpan...' : 'Simpan'}</button></div></div></div>{/if}{/if}

{#if showContact}<div class="fixed inset-0 bg-primary-dark/40 flex items-center justify-center z-50 p-4" role="presentation"><div class="bg-surface-card rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title" use:dialog={() => showContact = false}><div class="flex justify-between items-start"><div><h3 id="contact-dialog-title" class="text-xl font-extrabold">{contactDetail?.contact.nama ?? 'Detail kontak'}</h3>{#if contactDetail}<p class="text-sm text-text-secondary mt-1">Aktif: piutang {rupiah(contactDetail.debts.filter((d) => d.status === 'aktif' && d.tipe === 'piutang').reduce((s, d) => s + d.sisa, 0))} · hutang {rupiah(contactDetail.debts.filter((d) => d.status === 'aktif' && d.tipe === 'hutang').reduce((s, d) => s + d.sisa, 0))}</p>{/if}</div><div class="flex items-center gap-2">{#if contactDetail && !contactDetail.contact.deleted_at}<button aria-label="Hapus kontak" class="text-coral p-2 rounded hover:bg-gray-100" onclick={removeContact} disabled={submitting}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button>{/if}<button aria-label="Tutup detail kontak" class="text-2xl" onclick={() => showContact = false}>�</button></div></div>{#if detailLoading}<p class="py-8">Memuat detail...</p>{:else if contactDetail}<div class="mt-5 space-y-5"><div><h4 class="font-bold mb-2">Kronologi hutang/piutang dan pembayaran</h4>{#each contactHistory(contactDetail) as item, index (`${item.kind}-${item.debt.id}-${item.kind === 'payment' ? item.payment.id : index}`)}<div class="border-b py-3"><p class="text-xs text-text-muted">{date(item.date)}</p>{#if item.kind === 'debt'}<p class="font-bold">Catatan {item.debt.tipe} · {rupiah(item.debt.nominal_awal)}</p><p class="text-sm text-text-secondary">{item.debt.catatan || 'Tanpa catatan'} · sisa {rupiah(item.debt.sisa)}</p>{:else}<p class="font-bold">Pembayaran {item.debt.tipe} · {rupiah(item.payment.nominal)}</p><p class="text-sm text-text-secondary">{item.payment.wallet ? item.payment.wallet.nama : 'Tanpa wallet'}{item.payment.catatan ? ` · ${item.payment.catatan}` : ''}</p>{/if}</div>{/each}</div><div><h4 class="font-bold mb-2">Partisipasi patungan</h4>{#if contactDetail.patunganParticipants.length}{#each contactDetail.patunganParticipants as p (p.id)}<p class="text-sm border-b py-2">{p.session?.nama_sesi ?? 'Sesi tidak ditemukan'} · {p.persen}% · {p.is_talangan ? 'Talangan' : 'Peserta'}</p>{/each}{:else}<p class="text-sm text-text-secondary">Belum ada partisipasi patungan.</p>{/if}</div></div>{/if}<button class="mt-5 w-full p-3 bg-gray-100 rounded font-bold" onclick={() => showContact = false}>Tutup</button></div></div>{/if}

<ConfirmationDialog 
  bind:show={showConfirm}
  title={confirmTitle}
  message={confirmMessage}
  confirmText={confirmText}
  isDestructive={true}
  onConfirm={confirmAction}
/>

<style>
  button {
    min-height: 44px;
  }

  button:focus-visible,
  a:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
</style>
