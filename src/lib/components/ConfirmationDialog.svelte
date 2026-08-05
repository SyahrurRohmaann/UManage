<script lang="ts">
  interface Props {
    show?: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm?: (() => void) | (() => Promise<void>);
    onCancel?: () => void;
  }

  let { 
    show = $bindable(false),
    title = 'Konfirmasi',
    message = 'Apakah Anda yakin?',
    confirmText = 'Hapus',
    cancelText = 'Batal',
    isDestructive = false,
    onConfirm = async () => {},
    onCancel = () => {}
  }: Props = $props();

  let isLoading = $state(false);

  async function handleConfirm() {
    isLoading = true;
    try {
      await onConfirm();
    } finally {
      isLoading = false;
      show = false;
    }
  }

  function handleCancel() {
    onCancel();
    show = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  }
</script>

{#if show}
  <div
    class="fixed inset-0 bg-primary-dark/40 flex items-center justify-center z-50 p-4"
    role="presentation"
    onkeydown={handleKeydown}
  >
    <div
      class="bg-surface-card rounded-xl p-6 w-full max-w-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <h3 id="confirm-title" class="text-lg font-extrabold mb-2">
        {title}
      </h3>
      <p class="text-sm text-text-secondary mb-6">
        {message}
      </p>
      <div class="flex gap-3">
        <button
          onclick={handleCancel}
          disabled={isLoading}
          class="flex-1 p-3 bg-gray-100 rounded font-bold hover:bg-gray-200 disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          onclick={handleConfirm}
          disabled={isLoading}
          class="flex-1 p-3 rounded font-bold text-white {isDestructive
            ? 'bg-coral hover:bg-coral-dark disabled:opacity-50'
            : 'bg-primary hover:bg-primary-dark disabled:opacity-50'}"
        >
          {isLoading ? 'Memproses...' : confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  button {
    min-height: 44px;
  }

  button:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
</style>
