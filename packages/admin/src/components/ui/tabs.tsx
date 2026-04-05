'use client';

/**
 * @file components/ui/tabs.tsx
 * @description Tabs component.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TabsContextValue {
  value: string;
  onChange: (v: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({ value: '', onChange: () => {} });

// ---------------------------------------------------------------------------
// Tabs root
// ---------------------------------------------------------------------------

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ value, defaultValue = '', onValueChange, className, children, ...props }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const onChange = React.useCallback(
    (v: string) => {
      if (!controlled) setInternal(v);
      onValueChange?.(v);
    },
    [controlled, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value: current, onChange }}>
      <div className={cn('', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// TabsList
// ---------------------------------------------------------------------------

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-lg',
        'bg-[hsl(var(--muted))] p-1 text-[hsl(var(--muted-foreground))]',
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// TabsTrigger
// ---------------------------------------------------------------------------

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const { value: current, onChange } = React.useContext(TabsContext);
  const active = current === value;

  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => onChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md',
        'px-3 py-1 text-sm font-medium ring-offset-background transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
        'disabled:pointer-events-none disabled:opacity-50',
        active
          ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm'
          : 'hover:bg-[hsl(var(--background)/0.4)] hover:text-[hsl(var(--foreground))]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// TabsContent
// ---------------------------------------------------------------------------

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const { value: current } = React.useContext(TabsContext);
  if (current !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn('mt-4 focus-visible:outline-none animate-fade-in', className)}
      {...props}
    >
      {children}
    </div>
  );
}
