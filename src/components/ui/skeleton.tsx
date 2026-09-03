'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-mk-shimmer bg-gray-200 rounded-md', className)}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', {
            'w-full': i !== lines - 1,
            'w-2/3': i === lines - 1,
          })}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="border border-[var(--mk-border,var(--color-gray-200))] p-6 rounded-[var(--mk-radius-xl,1rem)] bg-[var(--mk-surface,white)] flex flex-col gap-4">
      <Skeleton className="h-6 w-1/3" />
      <SkeletonText lines={3} />
      <Skeleton className="h-10 w-full mt-4" />
    </div>
  );
}

export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-[var(--mk-border,var(--color-gray-200))]">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
