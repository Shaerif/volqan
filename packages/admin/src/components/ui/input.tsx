/**
 * @file components/ui/input.tsx
 * @description Input component.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[hsl(var(--foreground))]"
          >
            {label}
            {props.required && <span className="text-[hsl(var(--destructive))] ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            'flex h-9 w-full rounded-md border border-[hsl(var(--input))]',
            'bg-[hsl(var(--background))] px-3 py-1 text-sm shadow-sm',
            'placeholder:text-[hsl(var(--muted-foreground))]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors duration-150',
            error && 'border-[hsl(var(--destructive))] focus-visible:ring-[hsl(var(--destructive))]',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-[hsl(var(--destructive))]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[hsl(var(--muted-foreground))]">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
