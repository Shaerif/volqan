/**
 * @file components/ui/badge.tsx
 * @description Badge component with variants.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

const VARIANTS = {
  default: 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border-transparent',
  secondary: 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border-transparent',
  destructive: 'bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] border-transparent',
  outline: 'border border-[hsl(var(--border))] text-[hsl(var(--foreground))]',
  success: 'bg-emerald-50 text-emerald-700 border-transparent dark:bg-emerald-900/20 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-700 border-transparent dark:bg-amber-900/20 dark:text-amber-400',
  info: 'bg-sky-50 text-sky-700 border-transparent dark:bg-sky-900/20 dark:text-sky-400',
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof VARIANTS;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
