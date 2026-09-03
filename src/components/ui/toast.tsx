'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, type, onDismiss, duration = 5000 }: ToastProps) {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const role = type === 'error' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={cn(
        'flex items-center w-full max-w-sm p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-lg border border-gray-100 animate-in slide-in-from-top-5 fade-in-0 duration-300',
        {
          'border-l-4 border-l-green-500': type === 'success',
          'border-l-4 border-l-red-500': type === 'error',
          'border-l-4 border-l-blue-500': type === 'info',
          'border-l-4 border-l-yellow-500': type === 'warning',
        }
      )}
    >
      <div className="ml-3 text-sm font-normal text-gray-900 flex-1">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 transition-colors"
        onClick={onDismiss}
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
        </svg>
      </button>
    </div>
  );
}

// Hook for Toasts
type ToastData = Omit<ToastProps, 'onDismiss'> & { id: string };

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const toast = React.useCallback((props: Omit<ToastProps, 'onDismiss'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...props, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const [mounted, setMounted] = React.useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  const ToastContainer = React.useCallback(() => {
    if (!mounted) return null;

    return createPortal(
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast {...t} onDismiss={() => removeToast(t.id)} />
          </div>
        ))}
      </div>,
      document.body
    );
  }, [toasts, removeToast, mounted]);

  return { toast, ToastContainer };
}
