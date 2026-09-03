'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  variant: 'default' | 'success' | 'warning' | 'urgent' | 'info' | 'patient-reported' | 'ocr-extracted' | 'ai-summarized' | 'doctor-verified';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          'bg-gray-100 text-gray-900': variant === 'default',
          'bg-green-100 text-green-800': variant === 'success',
          'bg-yellow-100 text-yellow-800': variant === 'warning',
          'bg-red-100 text-red-800': variant === 'urgent',
          'bg-blue-100 text-blue-800': variant === 'info',
          'source-patient-reported bg-purple-100 text-purple-800': variant === 'patient-reported',
          'source-ocr-extracted bg-indigo-100 text-indigo-800': variant === 'ocr-extracted',
          'source-ai-summarized bg-pink-100 text-pink-800': variant === 'ai-summarized',
          'source-doctor-verified bg-emerald-100 text-emerald-800': variant === 'doctor-verified',
        },
        className
      )}
    >
      {children}
    </div>
  );
}
