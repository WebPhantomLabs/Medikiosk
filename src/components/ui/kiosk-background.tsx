'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface KioskBackgroundProps {
  image?: string;
  overlay?: 'dark' | 'light' | 'gradient';
  brightness?: number; // 0 to 1
  children: React.ReactNode;
  className?: string;
}

export function KioskBackground({
  image = '/images/kiosk-bg.jpg', // Default placeholder
  overlay = 'gradient',
  brightness = 0.5,
  children,
  className,
}: KioskBackgroundProps) {
  return (
    <div className={cn('relative min-h-screen w-full overflow-hidden bg-gray-900', className)}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url(${image})`,
          opacity: brightness
        }}
      />
      
      {/* Overlay */}
      <div 
        className={cn('absolute inset-0 z-10', {
          'bg-black/50': overlay === 'dark',
          'bg-white/50': overlay === 'light',
          'bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent': overlay === 'gradient',
        })}
      />
      
      {/* Content */}
      <div className="relative z-20 flex h-full min-h-screen flex-col">
        {children}
      </div>
    </div>
  );
}
