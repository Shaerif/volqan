'use client';

/**
 * @file components/ui/dropdown-menu.tsx
 * @description Dropdown menu component.
 */

import * as React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// DropdownMenu context
// ---------------------------------------------------------------------------

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  open: false,
  setOpen: () => {},
});

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown-root]')) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block" data-dropdown-root>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

export function DropdownMenuTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { open, setOpen } = React.useContext(DropdownMenuContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        setOpen(!open);
      },
    });
  }

  return (
    <button onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export function DropdownMenuContent({
  className,
  align = 'end',
  children,
  ...props
}: DropdownMenuContentProps) {
  const { open } = React.useContext(DropdownMenuContext);

  if (!open) return null;

  return (
    <div
      className={cn(
        'absolute top-full mt-1 min-w-[8rem] z-50',
        'rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--popover))]',
        'text-[hsl(var(--popover-foreground))] shadow-lg py-1',
        'animate-fade-in',
        align === 'end' && 'right-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        align === 'start' && 'left-0',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
  destructive?: boolean;
}

export function DropdownMenuItem({ className, inset, destructive, children, onClick, ...props }: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  return (
    <button
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer',
        'hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]',
        'transition-colors duration-100 outline-none',
        destructive && 'text-[hsl(var(--destructive))]',
        inset && 'pl-8',
        className,
      )}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Separator, Label
// ---------------------------------------------------------------------------

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('my-1 h-px bg-[hsl(var(--border))]', className)} />;
}

export function DropdownMenuLabel({ className, inset, children }: { className?: string; inset?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn('px-3 py-1.5 text-xs font-semibold text-[hsl(var(--muted-foreground))]', inset && 'pl-8', className)}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CheckboxItem
// ---------------------------------------------------------------------------

export function DropdownMenuCheckboxItem({
  className,
  checked,
  children,
  onCheckedChange,
  ...props
}: {
  className?: string;
  checked?: boolean;
  children: React.ReactNode;
  onCheckedChange?: (checked: boolean) => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  return (
    <button
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer pl-8',
        'hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]',
        'transition-colors duration-100 relative outline-none',
        className,
      )}
      onClick={() => {
        onCheckedChange?.(!checked);
        setOpen(false);
      }}
      role="menuitemcheckbox"
      aria-checked={checked}
      {...props}
    >
      {checked && <Check className="absolute left-2.5 w-3.5 h-3.5" />}
      {children}
    </button>
  );
}
