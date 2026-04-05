'use client';

/**
 * @file components/ui/dialog.tsx
 * @description Dialog/modal component with backdrop.
 */

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Dialog context
// ---------------------------------------------------------------------------

interface DialogContextValue {
  open: boolean;
  onClose: () => void;
}

const DialogContext = React.createContext<DialogContextValue>({ open: false, onClose: () => {} });

// ---------------------------------------------------------------------------
// Dialog root
// ---------------------------------------------------------------------------

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  // Lock body scroll
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <DialogContext.Provider value={{ open, onClose: () => onOpenChange(false) }}>
      {children}
    </DialogContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Dialog content
// ---------------------------------------------------------------------------

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-5xl',
};

export function DialogContent({ className, size = 'md', children, ...props }: DialogContentProps) {
  const { open, onClose } = React.useContext(DialogContext);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full rounded-xl border border-[hsl(var(--border))]',
          'bg-[hsl(var(--card))] shadow-xl animate-fade-in',
          'max-h-[90vh] flex flex-col overflow-hidden',
          SIZES[size],
          className,
        )}
        {...props}
      >
        {children}

        {/* Close button */}
        <button
          onClick={onClose}
          className={cn(
            'absolute top-4 right-4 w-7 h-7 rounded-md flex items-center justify-center',
            'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
            'hover:bg-[hsl(var(--accent))] transition-colors',
          )}
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 px-6 py-4 border-b border-[hsl(var(--border))]', className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-base font-semibold text-[hsl(var(--foreground))]', className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-[hsl(var(--muted-foreground))]', className)} {...props} />
  );
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-6 py-4', className)} {...props} />
  );
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))]',
        className,
      )}
      {...props}
    />
  );
}
