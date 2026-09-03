'use client'

import React from 'react'

interface MediKioskLogoProps {
  variant?: 'full' | 'icon' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  color?: 'default' | 'white' | 'dark';
  className?: string;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
  hero: 96,
};

export function MediKioskLogo({
  variant = 'full',
  size = 'md',
  color = 'default',
  className = '',
}: MediKioskLogoProps) {
  const iconSize = sizeMap[size];
  
  let colorClass = 'text-[var(--mk-primary)]';
  if (color === 'white') colorClass = 'text-white';
  if (color === 'dark') colorClass = 'text-[var(--mk-text)]';

  const showIcon = variant === 'full' || variant === 'icon';
  const showText = variant === 'full' || variant === 'wordmark';

  return (
    <div className={`flex items-center gap-3 ${colorClass} ${className}`}>
      {showIcon && (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Medical Cross Base */}
          <path
            d="M35 20C35 17.2386 37.2386 15 40 15H60C62.7614 15 65 17.2386 65 20V35H80C82.7614 35 85 37.2386 85 40V60C85 62.7614 82.7614 65 80 65H65V80C65 82.7614 62.7614 85 60 85H40C37.2386 85 35 82.7614 35 80V65H20C17.2386 65 15 62.7614 15 60V40C15 37.2386 17.2386 35 20 35H35V20Z"
            fill="currentColor"
            opacity="0.2"
          />
          {/* Pulse line */}
          <path
            d="M20 50H35L42 30L55 70L65 50H80"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {showText && (
        <span
          className="font-bold tracking-tight font-sans"
          style={{ fontSize: iconSize * 0.75, lineHeight: 1 }}
        >
          MediKiosk
        </span>
      )}
    </div>
  );
}
