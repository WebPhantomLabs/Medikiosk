'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'default' | 'lg' | 'kiosk';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, size = 'default', id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id || reactId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-900">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex w-full rounded-md border border-[var(--mk-border,var(--color-gray-300))] bg-transparent transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-[var(--mk-border-focus,var(--color-blue-500))] focus-visible:ring-1 focus-visible:ring-[var(--mk-border-focus,var(--color-blue-500))] disabled:cursor-not-allowed disabled:opacity-50',
            {
              'h-10 px-3 py-2 text-sm': size === 'default',
              'h-12 px-4 py-3 text-base': size === 'lg',
              'h-16 px-6 py-4 text-2xl': size === 'kiosk',
              'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500': !!error,
            },
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-gray-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-sm font-medium text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
