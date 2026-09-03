'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface TokenDisplayProps {
  tokenNumber: string;
  onComplete: () => void;
}

export function TokenDisplay({ tokenNumber, onComplete }: TokenDisplayProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 15000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--mk-bg)] relative overflow-hidden">
      
      {/* Decorative background element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] bg-green-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto flex flex-col items-center justify-center px-4 py-8 relative z-10">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl w-full text-center space-y-8 sm:space-y-12"
        >
          {/* Success Animation */}
          <div className="flex flex-col items-center space-y-4 sm:space-y-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
              className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center shrink-0"
            >
              <Check className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" strokeWidth={3} />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--mk-text)] tracking-tight">
              You&apos;re all set.
            </h2>
          </div>

          {/* Token Number */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="bg-white rounded-3xl sm:rounded-[3rem] p-8 sm:p-12 md:p-16 shadow-xl border border-[var(--mk-border)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-[var(--mk-primary)]" />
            <div className="text-[var(--mk-text-secondary)] text-sm sm:text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-2 sm:mb-4">
              Your Token
            </div>
            <div className="text-5xl sm:text-7xl md:text-8xl font-black text-[var(--mk-primary)] tracking-tight">
              {tokenNumber}
            </div>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="space-y-2 sm:space-y-4"
          >
            <p className="text-xl sm:text-2xl text-[var(--mk-text-secondary)] font-medium">
              Please wait in the OPD waiting area.
            </p>
            <p className="text-base sm:text-lg text-[var(--mk-text-muted)]">
              We will call your number shortly.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Sticky Action Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="flex-shrink-0 w-full flex flex-col items-center px-4 py-4 sm:py-6 bg-[var(--mk-bg)] border-t border-[var(--mk-border)] z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-6"
      >
        <Button 
          size="kiosk" 
          onClick={onComplete} 
          className="w-full max-w-sm shadow-lg h-[64px] text-xl rounded-xl"
        >
          Finish
        </Button>
      </motion.div>

    </div>
  );
}
