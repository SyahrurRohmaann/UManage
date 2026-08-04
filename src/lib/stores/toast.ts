import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,
    add: (message: string, type: ToastType = 'info', timeout = 3000) => {
      const id = Date.now();
      update(toasts => [...toasts, { id, message, type }]);
      
      if (timeout) {
        setTimeout(() => {
          update(toasts => toasts.filter(t => t.id !== id));
        }, timeout);
      }
    },
    remove: (id: number) => {
      update(toasts => toasts.filter(t => t.id !== id));
    },
    success: (message: string, timeout?: number) => {
      toastStore.add(message, 'success', timeout);
    },
    error: (message: string, timeout?: number) => {
      toastStore.add(message, 'error', timeout);
    }
  };
}

export const toastStore = createToastStore();
