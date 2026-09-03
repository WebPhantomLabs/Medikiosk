'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface StatusBadgeProps {
  status: 'online' | 'operational' | 'idle' | 'in-session' | 'offline' | 'degraded' | 'needs-attention';
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
      case 'operational':
        return 'bg-green-500';
      case 'idle':
      case 'degraded':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      case 'in-session':
        return 'bg-blue-500';
      case 'needs-attention':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBgColor = () => {
    switch (status) {
      case 'online':
      case 'operational':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'idle':
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in-session':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'needs-attention':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border',
        getStatusBgColor()
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', getStatusColor())} />
        <span className={cn('relative inline-flex rounded-full h-2 w-2', getStatusColor())} />
      </span>
      {displayLabel}
    </div>
  );
}
