<script lang="ts">
  import { toastStore } from '../stores/toast';
  
  // No complex logic needed here, just subscribing to the store
  let toasts: any[] = [];
  toastStore.subscribe(val => { toasts = val; });
  
  function removeToast(id: number) {
    toastStore.remove(id);
  }
</script>

<div class="fixed top-4 right-0 left-0 z-[100] flex flex-col items-center pointer-events-none px-4 space-y-2">
  {#each toasts as toast (toast.id)}
    <div 
      class="pointer-events-auto transform transition-all duration-300 translate-y-0 opacity-100 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border-l-4 min-w-[300px] max-w-sm
        {toast.type === 'success' ? 'bg-surface-card border-success text-success shadow-sm' : 
         toast.type === 'error' ? 'bg-surface-card border-coral text-coral shadow-sm' : 
         'bg-surface-card border-sky text-sky shadow-sm'}"
      role="alert"
    >
      <div class="text-xl">
        {#if toast.type === 'success'}
          ✨
        {:else if toast.type === 'error'}
          💥
        {:else}
          ℹ️
        {/if}
      </div>
      <div class="flex-1">
        <p class="font-extrabold text-sm text-text-primary">{toast.message}</p>
      </div>
      <button 
        onclick={() => removeToast(toast.id)}
        class="text-gray-400 hover:text-gray-600 transition-colors"
      >
        ✕
      </button>
    </div>
  {/each}
</div>
