'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Dialog({ open, onClose, title, children, size = 'md' }: DialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
      // Basic focus trap could be added here
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Auto-focus first focusable element could be added here
      dialogRef.current?.focus();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabIndex={-1}
        className={cn(
          'relative z-50 flex w-full flex-col gap-4 bg-[var(--mk-surface,white)] p-6 shadow-lg sm:rounded-2xl border border-[var(--mk-border,var(--color-gray-200))] animate-in fade-in-0 zoom-in-95',
          {
            'max-w-sm': size === 'sm',
            'max-w-lg': size === 'md',
            'max-w-3xl': size === 'lg',
          }
        )}
      >
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 id="dialog-title" className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </h2>
        </div>
        <div className="py-4">{children}</div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(content, document.body);
}
