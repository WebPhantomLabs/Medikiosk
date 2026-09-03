'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, HelpCircle, Pause, Play } from 'lucide-react';
import { MediKioskLogo } from '../brand/medikiosk-logo';
import { motion } from 'framer-motion';

const healthTips = [
  'Keep your previous prescriptions ready.',
  'Drink plenty of water while you wait.',
  'Have your ID and insurance card accessible.',
  'Take a deep breath and relax.',
];

interface IdleScreenProps {
  onStart: () => void;
  onSettings: () => void;
  onSupport: () => void;
}

function KioskBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/kiosk-hero.jpg)' }}
      />
      {/* Overlay */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.1) 100%)' 
        }}
      />
      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}

export function IdleScreen({ onStart, onSettings, onSupport }: IdleScreenProps) {
  const [currentTip, setCurrentTip] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % healthTips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <KioskBackground>
      {/* Header */}
      <div className="flex items-center justify-between p-6 w-full">
        <MediKioskLogo variant="full" size="sm" color="white" />
        <div className="flex gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSupport}
            className="rounded-full w-12 h-12 bg-black/20 hover:bg-black/40 text-white"
            aria-label="Help and Support"
          >
            <HelpCircle className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            className="rounded-full w-12 h-12 bg-black/20 hover:bg-black/40 text-white"
            aria-label="Settings"
          >
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-12 md:px-24 lg:px-32 max-w-4xl z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <MediKioskLogo variant="icon" size="xl" color="white" className="mb-6" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-7xl font-bold text-white leading-tight mb-4 tracking-tight"
        >
          Your health journey <br/> starts here.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-xl md:text-2xl text-white/80 mb-12 font-medium"
        >
          Tap the button below to check in for your appointment.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <button
            onClick={onStart}
            className="bg-[var(--mk-primary)] hover:opacity-90 active:scale-[0.98] transition-all text-white rounded-full h-[88px] px-16 text-2xl font-bold w-full sm:w-auto shadow-2xl"
          >
            START CHECK-IN
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 flex flex-wrap items-center gap-6 text-white/60 font-medium text-lg"
        >
          <button className="hover:text-white transition-colors">Change Language</button>
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <button className="hover:text-white transition-colors">Accessibility</button>
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <button className="hover:text-white transition-colors" onClick={onSupport}>Help</button>
        </motion.div>
      </div>

      {/* Footer / Health Tips */}
      <div className="p-8 w-full flex justify-start lg:px-32 z-20">
        <div className="flex items-center gap-4 text-white/70">
          <button 
            onClick={() => setIsPaused(!isPaused)} 
            className="hover:text-white transition-colors"
            aria-label={isPaused ? "Play tips" : "Pause tips"}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <div aria-live="polite" className="text-lg font-medium tracking-wide">
            {healthTips[currentTip]}
          </div>
        </div>
      </div>
    </KioskBackground>
  );
}
