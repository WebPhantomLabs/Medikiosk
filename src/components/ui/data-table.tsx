'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { EmptyState } from './empty-state';
import { SkeletonTableRow } from './skeleton';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = 'No data available.',
  emptyIcon,
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-auto border border-[var(--mk-border,var(--color-gray-200))] rounded-[var(--mk-radius-xl,1rem)] bg-[var(--mk-surface,white)]">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-[var(--mk-border,var(--color-gray-200))]">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className={cn('px-6 py-3 font-semibold', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonTableRow key={`skeleton-${i}`} columns={columns.length} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8">
                <EmptyState title="No Data" description={emptyMessage} icon={emptyIcon} />
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'border-b border-[var(--mk-border,var(--color-gray-200))] last:border-0',
                  onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-6 py-4 whitespace-nowrap', col.className)}>
                    {col.render ? col.render(item) : String((item as any)[col.key] || '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
