<script lang="ts">
  import { budgetUsageStore } from '../budget';
  import { budgetStore, categoryStore } from '../stores';
  import { toastStore } from '../stores/toast';

  const usage = $derived($budgetUsageStore);
  const categories = $derived($categoryStore.data.filter(c => c.tipe === 'expense'));

  let showForm = $state(false);
  let formCategoryId = $state<number>(0);
  let formLimit = $state<string>('');
  let editingId = $state<number | undefined>();

  function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  function openCreate() {
    editingId = undefined;
    formCategoryId = categories[0]?.id ?? 0;
    formLimit = '';
    showForm = true;
  }

  function openEdit(budget: { id?: number; category_id: number; limit_nominal: number }) {
    editingId = budget.id;
    formCategoryId = budget.category_id;
    formLimit = String(budget.limit_nominal);
    showForm = true;
  }

  async function saveBudget() {
    const limit = Number(formLimit);
    if (!limit || limit <= 0) {
      toastStore.error('Nominal limit tidak valid');
      return;
    }
    if (!formCategoryId) {
      toastStore.error('Pilih kategori');
      return;
    }

    const now = new Date();
    const payload = {
      category_id: formCategoryId,
      bulan: now.getMonth() + 1,
      tahun: now.getFullYear(),
      limit_nominal: limit
    };

    try {
      if (editingId) {
        await budgetStore.updateBudget(editingId, payload);
        toastStore.success('Anggaran diperbarui');
      } else {
        // Check if exists
        const existing = usage.usages.find(u => u.category_id === formCategoryId);
        if (existing && existing.id) {
          await budgetStore.updateBudget(existing.id, payload);
          toastStore.success('Anggaran diperbarui (kategori sudah ada)');
        } else {
          await budgetStore.addBudget(payload);
          toastStore.success('Anggaran ditambahkan');
        }
      }
      showForm = false;
    } catch (e: any) {
      toastStore.error(e.message || 'Gagal menyimpan anggaran');
    }
  }

  async function deleteBudget(id?: number) {
    if (!id) return;
    if (confirm('Hapus anggaran ini?')) {
      try {
        await budgetStore.deleteBudget(id);
        toastStore.success('Anggaran dihapus');
      } catch (e: any) {
        toastStore.error(e.message || 'Gagal menghapus anggaran');
      }
    }
  }
</script>

<div class="space-y-6">
  <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h2 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Anggaran Bulan Ini</h2>
      <p class="font-body-md text-body-md text-on-surface-variant">Kendalikan pengeluaran dengan limit kategori.</p>
    </div>
    <button type="button" onclick={openCreate} class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-label-md text-label-md text-on-primary hover:bg-surface-tint transition-colors"><span class="material-symbols-outlined text-[18px]">add</span>Atur Anggaran</button>
  </header>

  {#if usage.loading}
    <p class="rounded-xl bg-surface-container-lowest p-8 text-center text-on-surface-variant border border-outline-variant">Memuat anggaran...</p>
  {:else}
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 relative overflow-hidden">
      <p class="font-label-sm text-label-sm text-on-surface-variant tracking-wide uppercase">Sisa Anggaran Total</p>
      <h2 class="font-display-lg text-display-lg mt-3 text-primary tracking-tight text-[32px] md:text-display-lg">{formatRupiah(usage.totalRemaining)}</h2>
      
      <div class="mt-4 pt-4 border-t border-outline-variant flex justify-between items-center flex-wrap gap-4">
        <div>
          <p class="font-label-sm text-label-sm text-on-surface-variant uppercase">Terpakai</p>
          <p class="font-label-md text-label-md font-bold text-on-surface mt-1">{formatRupiah(usage.totalSpent)} <span class="text-on-surface-variant font-normal text-xs">dari {formatRupiah(usage.totalLimit)}</span></p>
        </div>
        <div class="text-right">
          <p class="font-label-sm text-label-sm text-on-surface-variant uppercase">Rekomendasi Harian</p>
          <p class="font-label-md text-label-md font-bold text-secondary mt-1">{formatRupiah(usage.globalSafeDaily)} <span class="text-on-surface-variant font-normal text-xs">/ hari</span></p>
        </div>
      </div>
    </div>

    {#if usage.usages.length === 0}
      <div class="rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-10 text-center text-on-surface-variant">
        <p class="font-bold mb-2">Belum ada anggaran bulan ini</p>
        <p class="font-label-sm text-label-sm mb-4">Mulai atur limit pengeluaran untuk kategori seperti Makanan atau Transportasi.</p>
        <button type="button" onclick={openCreate} class="rounded-lg bg-surface-container px-4 py-2 font-label-md text-label-md font-bold text-on-surface hover:bg-surface-container-high transition-colors">Buat Anggaran</button>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {#each usage.usages as item (item.id)}
          <article class="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-3">
                <span class="w-4 h-4 rounded-full" style="background-color: {item.categoryColor}"></span>
                <h3 class="font-label-md text-label-md font-bold text-on-surface">{item.categoryName}</h3>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick={() => openEdit(item)} class="font-label-sm text-label-sm font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors">Edit</button>
                <button type="button" onclick={() => deleteBudget(item.id)} class="font-label-sm text-label-sm font-bold text-error hover:bg-error/10 px-2 py-1 rounded transition-colors">Hapus</button>
              </div>
            </div>

            <div class="mb-2 flex justify-between font-label-md text-label-md">
              <span class="font-bold {item.status === 'danger' ? 'text-error' : item.status === 'warning' ? 'text-orange' : 'text-on-surface'}">
                {formatRupiah(item.spent)}
              </span>
              <span class="text-on-surface-variant font-medium">Limit: {formatRupiah(item.limit_nominal)}</span>
            </div>

            <div class="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden">
              <div
                class="h-2.5 rounded-full transition-all {item.status === 'danger' ? 'bg-error' : item.status === 'warning' ? 'bg-orange' : 'bg-secondary'}"
                style="width: {item.percentage}%"
              ></div>
            </div>

            <div class="mt-3 flex justify-between items-center font-label-sm text-label-sm">
              {#if item.status === 'danger'}
                <span class="font-bold text-error bg-error/10 px-2 py-1 rounded-full">Melebihi limit!</span>
              {:else if item.status === 'warning'}
                <span class="font-bold text-orange bg-orange/10 px-2 py-1 rounded-full">Mendekati limit</span>
              {:else}
                <span class="font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-full">Aman</span>
              {/if}

              {#if item.remaining > 0}
                <span class="text-on-surface-variant font-medium">Sisa: <span class="font-bold">{formatRupiah(item.safeDaily)}</span> /hari</span>
              {/if}
            </div>
          </article>
        {/each}
      </div>
    {/if}
  {/if}
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 p-4" role="presentation">
    <div role="dialog" aria-modal="true" class="w-full max-w-sm rounded-xl bg-surface-container-lowest border border-outline-variant p-6">
      <h3 class="font-headline-md text-headline-md text-on-surface">{editingId ? 'Edit Anggaran' : 'Atur Anggaran Baru'}</h3>
      <form class="mt-5 space-y-4" onsubmit={(e) => { e.preventDefault(); saveBudget(); }}>
        <label class="block font-label-sm text-label-sm text-on-surface-variant">Kategori Pengeluaran
          <select required bind:value={formCategoryId} class="mt-1 w-full rounded-lg bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all px-4 py-3">
            <option value={0} disabled>Pilih kategori</option>
            {#each categories as category (category.id)}
              <option value={category.id}>{category.nama}</option>
            {/each}
          </select>
        </label>
        <label class="block font-label-sm text-label-sm text-on-surface-variant">Limit Bulanan (Rp)
          <input required type="number" min="1" step="1" bind:value={formLimit} class="mt-1 w-full rounded-lg bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all px-4 py-3 font-label-md text-label-md font-bold text-on-surface" />
        </label>

        <div class="flex gap-3 pt-4">
          <button type="button" onclick={() => showForm = false} class="flex-1 rounded-lg bg-surface-container px-4 py-3 font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors">Batal</button>
          <button type="submit" class="flex-1 rounded-lg bg-primary px-4 py-3 font-label-md text-label-md text-on-primary hover:bg-surface-tint transition-colors">Simpan</button>
        </div>
      </form>
    </div>
  </div>
{/if}
