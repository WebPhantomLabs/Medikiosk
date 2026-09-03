'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './card';

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function MetricCard({ label, value, icon, trend, className }: MetricCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-500">{label}</span>
            <span className="text-3xl font-bold text-gray-900">{value}</span>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-[var(--mk-primary,var(--color-blue-600))]">
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1.5 text-sm">
            <span
              className={cn('font-medium', {
                'text-green-600': trend.positive,
                'text-red-600': !trend.positive,
              })}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
            <span className="text-gray-500">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
