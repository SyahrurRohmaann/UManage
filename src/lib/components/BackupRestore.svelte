<script lang="ts">
  import { db } from '../db';
  import 'dexie-export-import';
  import { toastStore } from '../stores/toast';

  let fileInput: HTMLInputElement;
  let isExporting = false;
  let isImporting = false;

  async function handleExport() {
    try {
      isExporting = true;
      const blob = await db.export();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'uwangg-backup-' + new Date().toISOString().slice(0,10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      toastStore.success('Database berhasil diexport!');
    } catch (error) {
      toastStore.error('Gagal export data: ' + error);
    } finally {
      isExporting = false;
    }
  }

  async function handleImport(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    
    if(!confirm('Import akan me-replace database saat ini jika ada konflik ID. Lanjutkan?')) {
        input.value = '';
        return;
    }

    try {
      isImporting = true;
      const file = input.files[0];
      await db.import(file, { overwriteValues: true });
      toastStore.success('Data berhasil di-import! Silakan refresh aplikasi.');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toastStore.error('Gagal import data: ' + error);
    } finally {
      isImporting = false;
      input.value = '';
    }
  }
</script>

<div class="bg-surface-card rounded-xl p-5 shadow-card border-[3px] border-dashed border-gray-100">
  <h3 class="font-extrabold text-lg mb-4 text-primary-dark">Data & Cadangan</h3>
  
  <p class="text-sm text-text-secondary mb-4">
    Aplikasi ini menyimpan data secara lokal di HP/Browser Anda. Gunakan fitur Backup berkala untuk menghindari kehilangan data.
  </p>

  <div class="flex flex-col gap-3">
    <button 
      onclick={handleExport}
      disabled={isExporting}
      class="w-full bg-gradient-to-r from-sky to-[#3498db] text-white font-extrabold py-3 rounded-xl shadow-sky-glow hover:scale-[0.99] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
    >
      <span>📥</span> {isExporting ? 'Proses Export...' : 'Backup Data (Export)'}
    </button>

    <div class="relative">
      <input 
        bind:this={fileInput}
        type="file" 
        accept=".json"
        onchange={handleImport}
        class="hidden"
        id="import-file"
      />
      <button 
        onclick={() => fileInput.click()}
        disabled={isImporting}
        class="w-full bg-gray-100 text-text-primary border-2 border-gray-200 font-extrabold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <span>📤</span> {isImporting ? 'Proses Import...' : 'Restore Data (Import)'}
      </button>
    </div>
  </div>
</div>
