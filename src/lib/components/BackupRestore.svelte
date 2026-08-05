<script lang="ts">
  import { tick } from 'svelte';
  import {
    backupFilename,
    downloadBackup,
    exportBackup,
    restoreBackup,
    validateBackupFile,
    type RestoreMode
  } from '../backup';
  import { toastStore } from '../stores/toast';

  let fileInput: HTMLInputElement;
  let dialogTitle: HTMLHeadingElement;
  let selectedFile: File | undefined;
  let isExporting = false;
  let isImporting = false;
  let restoreSucceeded = false;
  let errorMessage = '';

  function errorText(error: unknown): string {
    return error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
  }

  async function handleExport() {
    try {
      isExporting = true;
      errorMessage = '';
      const blob = await exportBackup();
      downloadBackup(blob, backupFilename());
      toastStore.success('Cadangan data berhasil diunduh.');
    } catch (error) {
      errorMessage = `Gagal membuat cadangan: ${errorText(error)}`;
      toastStore.error(errorMessage);
    } finally {
      isExporting = false;
    }
  }

  async function handleFileSelection(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    errorMessage = '';
    restoreSucceeded = false;

    try {
      validateBackupFile(file);
      selectedFile = file;
      await tick();
      dialogTitle?.focus();
    } catch (error) {
      errorMessage = errorText(error);
      toastStore.error(errorMessage);
      resetSelection();
    }
  }

  function resetSelection() {
    selectedFile = undefined;
    if (fileInput) fileInput.value = '';
  }

  async function handleRestore(mode: RestoreMode) {
    if (!selectedFile) return;

    try {
      isImporting = true;
      errorMessage = '';
      await restoreBackup(selectedFile, mode);
      restoreSucceeded = true;
      resetSelection();
      toastStore.success('Data berhasil dipulihkan. Muat ulang aplikasi untuk memakai data terbaru.');
    } catch (error) {
      errorMessage = `Gagal memulihkan data: ${errorText(error)}`;
      toastStore.error(errorMessage);
    } finally {
      isImporting = false;
      if (fileInput) fileInput.value = '';
    }
  }

  function reloadApplication() {
    window.location.reload();
  }
</script>

<div class="bg-surface-card rounded-xl p-5 shadow-card border-[3px] border-dashed border-gray-100">
  <h3 class="font-extrabold text-lg mb-4 text-primary-dark">Data & Cadangan</h3>

  <p class="text-sm text-text-secondary mb-4">
    Data tersimpan secara lokal di perangkat dan browser ini. Buat cadangan berkala untuk mengurangi risiko kehilangan data.
  </p>

  <div class="flex flex-col gap-3">
    <button
      type="button"
      onclick={handleExport}
      disabled={isExporting || isImporting}
      class="w-full bg-gradient-to-r from-sky to-[#3498db] text-white font-extrabold py-3 rounded-xl shadow-sm hover:scale-[0.99] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {isExporting ? 'Membuat cadangan...' : 'Cadangkan data'}
    </button>

    <div class="relative">
      <input
        bind:this={fileInput}
        data-testid="backup-file-input"
        type="file"
        accept=".json,application/json"
        onchange={handleFileSelection}
        disabled={isExporting || isImporting}
        class="hidden"
        id="import-file"
      />
      <button
        type="button"
        onclick={() => fileInput.click()}
        disabled={isExporting || isImporting}
        class="w-full bg-gray-100 text-text-primary border-2 border-gray-200 font-extrabold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isImporting ? 'Memulihkan data...' : 'Pulihkan dari cadangan'}
      </button>
    </div>

    {#if errorMessage}
      <p class="text-sm font-semibold text-red-700" role="alert">{errorMessage}</p>
    {/if}

    {#if restoreSucceeded}
      <div class="rounded-xl border-2 border-primary/30 bg-primary/5 p-4" role="status">
        <p class="text-sm font-semibold text-text-primary mb-3">
          Data berhasil dipulihkan. Muat ulang aplikasi agar semua tampilan memakai data terbaru.
        </p>
        <button
          type="button"
          onclick={reloadApplication}
          class="w-full bg-primary text-white font-extrabold py-3 rounded-xl"
        >
          Muat ulang aplikasi
        </button>
      </div>
    {/if}
  </div>
</div>

{#if selectedFile}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-dialog-title"
      aria-describedby="restore-dialog-description"
      class="w-full max-w-lg rounded-2xl bg-surface-card p-6 shadow-xl"
    >
      <h2
        bind:this={dialogTitle}
        id="restore-dialog-title"
        tabindex="-1"
        class="text-xl font-extrabold text-primary-dark"
      >
        Pilih cara pemulihan
      </h2>
      <div id="restore-dialog-description" class="mt-3 space-y-3 text-sm text-text-secondary">
        <p>File terpilih: <strong class="text-text-primary">{selectedFile.name}</strong></p>
        <p>
          <strong class="text-text-primary">Ganti semua data</strong> menghapus seluruh data lokal saat ini, lalu mengisinya dari file cadangan. Gunakan pilihan ini untuk memulihkan kondisi persis dari cadangan.
        </p>
        <p>
          <strong class="text-text-primary">Gabungkan data</strong> mempertahankan data lokal dan hanya menambahkan record tanpa konflik ID. Jika ada ID yang sama, pemulihan dibatalkan agar relasi data tidak rusak.
        </p>
      </div>

      <div class="mt-6 flex flex-col gap-3">
        <button
          type="button"
          data-testid="restore-replace-button"
          onclick={() => handleRestore('replace')}
          disabled={isImporting}
          class="w-full rounded-xl bg-red-700 py-3 font-extrabold text-white disabled:opacity-50"
        >
          {isImporting ? 'Memulihkan data...' : 'Ganti semua data'}
        </button>
        <button
          type="button"
          data-testid="restore-merge-button"
          onclick={() => handleRestore('merge')}
          disabled={isImporting}
          class="w-full rounded-xl bg-primary py-3 font-extrabold text-white disabled:opacity-50"
        >
          {isImporting ? 'Memulihkan data...' : 'Gabungkan data'}
        </button>
        <button
          type="button"
          onclick={resetSelection}
          disabled={isImporting}
          class="w-full rounded-xl border-2 border-gray-200 bg-gray-100 py-3 font-extrabold text-text-primary disabled:opacity-50"
        >
          Batal
        </button>
      </div>
    </div>
  </div>
{/if}
