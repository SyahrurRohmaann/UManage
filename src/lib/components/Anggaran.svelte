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
  <header class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 class="text-xl font-extrabold text-text-primary">Anggaran Bulan Ini</h2>
      <p class="text-sm text-text-muted">Kendalikan pengeluaran dengan limit kategori.</p>
    </div>
    <button type="button" onclick={openCreate} class="rounded-lg bg-primary px-5 py-2.5 font-bold text-white dark:text-primary-bg shadow-sm">Atur Anggaran</button>
  </header>

  {#if usage.loading}
    <p class="rounded-xl bg-surface-card p-8 text-center text-text-muted">Memuat anggaran...</p>
  {:else}
    <div class="bg-surface-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden">
      <p class="text-sm font-semibold text-text-secondary tracking-wide uppercase">Sisa Anggaran Total</p>
      <h2 class="text-4xl font-extrabold mt-3 text-text-primary tracking-tight">{formatRupiah(usage.totalRemaining)}</h2>
      
      <div class="mt-4 pt-4 border-t border-border flex justify-between items-center flex-wrap gap-4">
        <div>
          <p class="text-xs text-text-muted font-bold uppercase">Terpakai</p>
          <p class="font-bold text-text-primary mt-1">{formatRupiah(usage.totalSpent)} <span class="text-text-muted font-normal text-xs">dari {formatRupiah(usage.totalLimit)}</span></p>
        </div>
        <div class="text-right">
          <p class="text-xs text-text-muted font-bold uppercase">Rekomendasi Harian</p>
          <p class="font-bold text-success mt-1">{formatRupiah(usage.globalSafeDaily)} <span class="text-text-muted font-normal text-xs">/ hari</span></p>
        </div>
      </div>
    </div>

    {#if usage.usages.length === 0}
      <div class="rounded-xl border-2 border-dashed border-gray-200 bg-surface-card p-10 text-center text-text-secondary">
        <p class="font-bold mb-2">Belum ada anggaran bulan ini</p>
        <p class="text-sm mb-4">Mulai atur limit pengeluaran untuk kategori seperti Makanan atau Transportasi.</p>
        <button type="button" onclick={openCreate} class="rounded-lg bg-gray-100 px-4 py-2 font-bold text-text-primary">Buat Anggaran</button>
      </div>
    {:else}
      <div class="space-y-4">
        {#each usage.usages as item (item.id)}
          <article class="bg-surface-card border border-border rounded-xl p-5 shadow-sm">
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-3">
                <span class="w-4 h-4 rounded-full" style="background-color: {item.categoryColor}"></span>
                <h3 class="font-bold text-text-primary">{item.categoryName}</h3>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick={() => openEdit(item)} class="text-xs font-bold text-primary hover:bg-primary-bg px-2 py-1 rounded">Edit</button>
                <button type="button" onclick={() => deleteBudget(item.id)} class="text-xs font-bold text-coral hover:bg-red-50 px-2 py-1 rounded">Hapus</button>
              </div>
            </div>
            
            <div class="mb-2 flex justify-between text-sm">
              <span class="font-bold {item.status === 'danger' ? 'text-coral' : item.status === 'warning' ? 'text-orange-600' : 'text-text-primary'}">
                {formatRupiah(item.spent)}
              </span>
              <span class="text-text-muted font-medium">Limit: {formatRupiah(item.limit_nominal)}</span>
            </div>
            
            <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div 
                class="h-2.5 rounded-full transition-all {item.status === 'danger' ? 'bg-coral' : item.status === 'warning' ? 'bg-orange-500' : 'bg-success'}" 
                style="width: {item.percentage}%"
              ></div>
            </div>
            
            <div class="mt-3 flex justify-between items-center text-xs">
              {#if item.status === 'danger'}
                <span class="font-bold text-coral bg-red-50 px-2 py-1 rounded">Melebihi limit!</span>
              {:else if item.status === 'warning'}
                <span class="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">Mendekati limit</span>
              {:else}
                <span class="font-bold text-success bg-success-bg px-2 py-1 rounded">Aman</span>
              {/if}
              
              {#if item.remaining > 0}
                <span class="text-text-secondary font-medium">Sisa: <span class="font-bold">{formatRupiah(item.safeDaily)}</span> /hari</span>
              {/if}
            </div>
          </article>
        {/each}
      </div>
    {/if}
  {/if}
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/50 p-4" role="presentation">
    <div role="dialog" aria-modal="true" class="w-full max-w-sm rounded-xl bg-surface-card p-6 shadow-xl">
      <h3 class="text-xl font-extrabold text-primary-dark">{editingId ? 'Edit Anggaran' : 'Atur Anggaran Baru'}</h3>
      <form class="mt-5 space-y-4" onsubmit={(e) => { e.preventDefault(); saveBudget(); }}>
        <label class="block text-sm font-bold text-text-secondary">Kategori Pengeluaran
          <select required bind:value={formCategoryId} class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3">
            <option value={0} disabled>Pilih kategori</option>
            {#each categories as category (category.id)}
              <option value={category.id}>{category.nama}</option>
            {/each}
          </select>
        </label>
        <label class="block text-sm font-bold text-text-secondary">Limit Bulanan (Rp)
          <input required type="number" min="1" step="1" bind:value={formLimit} class="mt-1 w-full rounded-lg bg-surface-base border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors px-4 py-3 font-bold" />
        </label>
        
        <div class="flex gap-3 pt-4">
          <button type="button" onclick={() => showForm = false} class="flex-1 rounded-lg bg-gray-100 px-4 py-3 font-bold">Batal</button>
          <button type="submit" class="flex-1 rounded-lg bg-primary px-4 py-3 font-bold text-white dark:text-primary-bg">Simpan</button>
        </div>
      </form>
    </div>
  </div>
{/if}
