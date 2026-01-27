'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, type?: ToastType, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', duration = 5000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newToast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 z-100 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

const toastStyles: Record<ToastType, string> = {
  success: 'border-primary/50 bg-primary/10 text-primary',
  error: 'border-destructive/50 bg-destructive/10 text-destructive',
  warning: 'border-secondary/50 bg-secondary/10 text-secondary-foreground',
  info: 'border-accent/50 bg-accent/10 text-accent-foreground',
};

const toastIcons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = toastIcons[toast.type];

  return (
    <div
      className={cn(
        'flex w-80 items-center gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm',
        'animate-in slide-in-from-top-full fade-in-0 duration-300',
        toastStyles[toast.type]
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
