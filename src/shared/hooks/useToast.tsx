import { create } from 'zustand';
import { Icon } from '@iconify/react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast]
    }));

    // Автоматическое удаление через заданное время
    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }));
      }, toast.duration || 3000);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  }
}));

// Хук для удобного использования
export const useToast = () => {
  const { addToast, removeToast, clearToasts } = useToastStore();

  return {
    success: (message: string, duration?: number) =>
      addToast({ type: 'success', message, duration }),

    error: (message: string, duration?: number) =>
      addToast({ type: 'error', message, duration }),

    warning: (message: string, duration?: number) =>
      addToast({ type: 'warning', message, duration }),

    info: (message: string, duration?: number) =>
      addToast({ type: 'info', message, duration }),

    dismiss: removeToast,
    dismissAll: clearToasts
  };
};

// Компонент для отображения уведомлений
export const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <Icon icon="solar:check-circle-linear" width={20} className="text-green-500" />;
      case 'error':
        return <Icon icon="solar:close-circle-linear" width={20} className="text-red-500" />;
      case 'warning':
        return <Icon icon="solar:danger-circle-linear" width={20} className="text-orange-500" />;
      case 'info':
        return <Icon icon="solar:info-circle-linear" width={20} className="text-blue-500" />;
    }
  };

  const getStyles = (type: ToastType) => {
    const base = 'bg-zinc-900 border rounded-lg shadow-lg shadow-black/40 p-4 mb-2 flex items-center gap-3 min-w-[300px] max-w-[500px]';

    switch (type) {
      case 'success':
        return `${base} border-green-500/20`;
      case 'error':
        return `${base} border-red-500/20`;
      case 'warning':
        return `${base} border-orange-500/20`;
      case 'info':
        return `${base} border-blue-500/20`;
    }
  };

  return (
    <div className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 right-4 lg:left-auto lg:right-6 lg:top-6 z-[9999] flex flex-col items-center lg:items-end gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getStyles(toast.type)} pointer-events-auto transform transition-all duration-300 animate-in fade-in slide-in-from-top-4 lg:slide-in-from-right-4 w-full sm:w-auto`}
          onClick={() => removeToast(toast.id)}
          style={{ cursor: 'pointer' }}
        >
          <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>
          <p className="flex-1 text-sm font-medium text-gray-100">{toast.message}</p>
        </div>
      ))}
    </div>
  );
};