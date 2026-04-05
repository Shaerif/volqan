'use client';

/**
 * @file components/ui/toast.tsx
 * @description Toast notification system.
 */

import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// ---------------------------------------------------------------------------
// Context & store
// ---------------------------------------------------------------------------

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (item: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, duration: 4000, ...item }]);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}

// ---------------------------------------------------------------------------
// Individual toast
// ---------------------------------------------------------------------------

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: 'border-[hsl(var(--border))]',
  success: 'border-emerald-200 dark:border-emerald-800',
  error: 'border-red-200 dark:border-red-800',
  warning: 'border-amber-200 dark:border-amber-800',
  info: 'border-sky-200 dark:border-sky-800',
};

const ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }> | null> = {
  default: null,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const ICON_COLORS: Record<ToastVariant, string> = {
  default: '',
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-sky-500',
};

function ToastItemComponent({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const variant = item.variant ?? 'default';
  const Icon = ICONS[variant];

  React.useEffect(() => {
    if (!item.duration) return;
    const timer = setTimeout(onDismiss, item.duration);
    return () => clearTimeout(timer);
  }, [item.duration, onDismiss]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 w-80 rounded-lg border px-4 py-3 shadow-lg',
        'bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]',
        'animate-fade-in',
        VARIANT_STYLES[variant],
      )}
      role="alert"
    >
      {Icon && <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', ICON_COLORS[variant])} />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{item.title}</p>
        {item.description && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{item.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

function ToastContainer() {
  const { toasts, dismiss } = React.useContext(ToastContext);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 flex flex-col gap-2 z-[100]"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <ToastItemComponent key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}
