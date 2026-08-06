<script lang="ts">
  import { budgetUsageStore } from '../budget';
  import { budgetStore, categoryStore } from '../stores';
  import { toastStore } from '../stores/toast';
  import ConfirmationDialog from './ConfirmationDialog.svelte';

  const usage = $derived($budgetUsageStore);
  const categories = $derived($categoryStore.data.filter(c => c.tipe === 'expense'));

  let showForm = $state(false);
  let formCategoryId = $state<number>(0);
  let formLimit = $state<string>('');
  let editingId = $state<number | undefined>();

  let showConfirm = $state(false);
  let confirmTitle = $state('');
  let confirmMessage = $state('');
  let confirmText = $state('Hapus');
  let confirmAction = $state<(() => Promise<void>) | undefined>(undefined);

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
    confirmTitle = 'Hapus Anggaran';
    confirmMessage = 'Hapus anggaran ini? Limit akan hilang namun pengeluaran tetap tercatat.';
    confirmText = 'Hapus';
    confirmAction = async () => {
      try {
        await budgetStore.deleteBudget(id);
        toastStore.success('Anggaran dihapus');
      } catch (e: any) {
        toastStore.error(e.message || 'Gagal menghapus anggaran');
      }
    };
    showConfirm = true;
  }
</script>

<div class="space-y-6">
  <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h2 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Anggaran Bulan Ini</h2>
      <p class="font-body-md text-body-md text-on-surface-variant">Kelola pengeluaran Anda dengan bijak.</p>
    </div>
    <button type="button" onclick={openCreate} class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-label-md text-label-md text-on-primary hover:bg-surface-tint transition-colors"><span class="material-symbols-outlined text-[18px]">add</span>Atur Anggaran</button>
  </header>

  {#if usage.loading}
    <p class="rounded-xl bg-surface-container-lowest p-8 text-center text-on-surface-variant border border-outline-variant">Memuat anggaran...</p>
  {:else}
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 relative overflow-hidden">
      <div class="flex flex-col md:flex-row justify-between md:items-end gap-stack-lg">
        <div class="flex-1">
          <p class="font-label-sm text-label-sm text-on-surface-variant mb-1">Sisa Anggaran</p>
          <h2 class="font-display-lg text-display-lg text-primary">{formatRupiah(usage.totalRemaining)}</h2>
          <p class="font-body-md text-body-md text-on-surface-variant mt-2">dari total {formatRupiah(usage.totalLimit)}</p>
        </div>
        <div class="w-full md:w-1/3">
          <div class="flex justify-between font-label-sm text-label-sm mb-2">
            <span class="text-on-surface-variant">Terpakai {usage.totalLimit > 0 ? ((usage.totalSpent / usage.totalLimit) * 100).toFixed(0) : 0}%</span>
            <span class="text-primary font-bold">{usage.totalLimit > 0 && usage.totalSpent <= usage.totalLimit ? 'Aman' : 'Melebihi Limit'}</span>
          </div>
          <div class="h-3 w-full bg-surface-variant rounded-full overflow-hidden">
            <div class="h-full {usage.totalSpent > usage.totalLimit ? 'bg-error' : 'bg-secondary'} rounded-full" style="width: {usage.totalLimit > 0 ? Math.min((usage.totalSpent / usage.totalLimit) * 100, 100) : 0}%"></div>
          </div>
        </div>
      </div>
    </div>

    {#if usage.usages.length === 0}
      <div class="bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl p-10 flex flex-col items-center justify-center gap-2 hover:bg-surface-container-high transition-colors min-h-[140px] text-center">
        <p class="font-bold mb-2">Belum ada anggaran bulan ini</p>
        <p class="font-label-sm text-label-sm mb-4 text-on-surface-variant">Mulai atur limit pengeluaran untuk kategori seperti Makanan atau Transportasi.</p>
        <button type="button" onclick={openCreate} class="rounded-lg bg-surface-container px-4 py-2 font-label-md text-label-md font-bold text-on-surface hover:bg-surface-container-high transition-colors">Buat Anggaran</button>
      </div>
    {:else}
      <h3 class="font-headline-md text-headline-md text-primary mb-4 mt-6">Rincian Kategori</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {#each usage.usages as item (item.id)}
          <div class="bg-surface-container-lowest border {item.status === 'danger' ? 'border-error/30' : 'border-outline-variant'} rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden group">
            {#if item.status === 'danger'}
               <div class="absolute top-0 right-0 w-16 h-16 bg-error/5 rounded-bl-full -z-10"></div>
            {/if}
            <div class="flex justify-between items-start">
              <div class="flex items-center gap-3">
                <div class="p-2 {item.status === 'danger' ? 'bg-error-container/50 text-error' : 'bg-surface-container-low text-primary'} rounded-lg">
                  <span class="material-symbols-outlined">category</span>
                </div>
                <div>
                  <h4 class="font-label-md text-label-md text-primary">{item.categoryName}</h4>
                  <p class="font-label-sm text-label-sm {item.status === 'danger' ? 'text-error' : 'text-on-surface-variant'}">{formatRupiah(item.spent)} / {formatRupiah(item.limit_nominal)}</p>
                </div>
              </div>
              <span class="font-label-sm text-label-sm {item.status === 'danger' ? 'text-on-error bg-error' : item.status === 'warning' ? 'text-secondary bg-secondary-container/20' : 'text-on-surface-variant bg-surface-variant/50'} px-2 py-1 rounded-md">{item.percentage.toFixed(0)}%</span>
            </div>
            
            <div class="flex gap-2 justify-end mb-1">
              <button type="button" onclick={() => openEdit(item)} class="text-xs text-primary hover:underline">Edit</button>
              <button type="button" onclick={() => deleteBudget(item.id)} class="text-xs text-error hover:underline">Hapus</button>
            </div>

            <div class="h-2 w-full bg-surface-variant rounded-full overflow-hidden mt-auto">
              <div class="h-full {item.status === 'danger' ? 'bg-error' : item.status === 'warning' ? 'bg-secondary' : 'bg-primary-container'} rounded-full" style="width: {Math.min(item.percentage, 100)}%"></div>
            </div>
          </div>
        {/each}
        
        <!-- Add New Category Button -->
        <button onclick={openCreate} class="bg-surface-container-low border border-dashed border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-surface-container-high transition-colors min-h-[140px]">
          <span class="material-symbols-outlined text-on-surface-variant">add_circle</span>
          <span class="font-label-md text-label-md text-on-surface-variant">Tambah Anggaran</span>
        </button>
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

<ConfirmationDialog 
  bind:show={showConfirm}
  title={confirmTitle}
  message={confirmMessage}
  confirmText={confirmText}
  isDestructive={true}
  onConfirm={confirmAction}
/>
