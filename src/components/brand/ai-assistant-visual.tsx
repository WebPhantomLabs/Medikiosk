'use client'

import React from 'react';

interface AIAssistantVisualProps {
  state: 'idle' | 'listening' | 'processing' | 'speaking';
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-12 h-12', // 48px
  md: 'w-32 h-32', // 128px
  lg: 'w-48 h-48', // 192px
};

export function AIAssistantVisual({ state, size = 'md' }: AIAssistantVisualProps) {
  const containerSize = sizeMap[size];

  return (
    <div className={`relative flex items-center justify-center ${containerSize}`}>
      {/* Base Ring */}
      <div className="absolute inset-0 rounded-full border-2 border-[var(--mk-primary)] opacity-30"></div>
      
      {state === 'idle' && (
        <div className="absolute inset-0 rounded-full bg-[var(--mk-primary)] opacity-10 animate-[pulse_3s_ease-in-out_infinite]"></div>
      )}

      {state === 'listening' && (
        <>
          <div className="absolute inset-[-10px] rounded-full border-2 border-[var(--mk-primary)] opacity-40 animate-ping"></div>
          <div className="absolute inset-0 rounded-full bg-[var(--mk-primary)] opacity-20 shadow-[0_0_20px_var(--mk-primary)]"></div>
        </>
      )}

      {state === 'processing' && (
        <div className="absolute inset-0">
          <div className="w-full h-full rounded-full border-4 border-transparent border-t-[var(--mk-primary)] animate-spin"></div>
        </div>
      )}

      {state === 'speaking' && (
        <div className="flex items-center justify-center gap-1">
          <div className="w-1.5 bg-[var(--mk-primary)] animate-pulse h-4 rounded-full"></div>
          <div className="w-1.5 bg-[var(--mk-primary)] animate-pulse delay-75 h-8 rounded-full"></div>
          <div className="w-1.5 bg-[var(--mk-primary)] animate-pulse delay-150 h-5 rounded-full"></div>
        </div>
      )}
    </div>
  );
}
