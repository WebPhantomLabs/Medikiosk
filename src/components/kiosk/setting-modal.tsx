'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Volume2, Type, Palette } from 'lucide-react';
import { useKioskStore } from '@/store/kiosk-store';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useKioskStore();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme properly using data attribute as requested
    root.setAttribute('data-theme', settings.theme);

    // Apply text size
    if (settings.textSize === 'small') {
      root.style.fontSize = '14px';
    } else if (settings.textSize === 'medium') {
      root.style.fontSize = '16px';
    } else if (settings.textSize === 'large') {
      root.style.fontSize = '20px';
    }
  }, [settings.theme, settings.textSize]);

  // Trap focus and close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const languages = [
    { code: 'hi', name: 'हिंदी' },
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'mr', name: 'मराठी' },
  ];

  const themes = [
    { value: 'light', name: 'Light' },
    { value: 'dark', name: 'Dark' },
    { value: 'high-contrast', name: 'High Contrast' },
  ];

  const textSizes = [
    { value: 'small', name: 'Normal', size: 'text-sm' },
    { value: 'medium', name: 'Large', size: 'text-base' },
    { value: 'large', name: 'Extra Large', size: 'text-xl' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            tabIndex={-1}
            ref={dialogRef}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 id="settings-title" className="text-3xl font-bold text-gray-900">Settings</h2>
              <button
                onClick={onClose}
                aria-label="Close settings"
                className="min-w-[48px] min-h-[48px] rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-10">
              {/* Language */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Type className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">Language</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      aria-pressed={settings.language === lang.code}
                      onClick={() => updateSettings({ language: lang.code })}
                      className={`p-6 rounded-2xl border-4 text-2xl font-medium transition-all min-h-[80px] ${
                        settings.language === lang.code
                          ? 'border-[var(--mk-primary)] bg-blue-50 text-[var(--mk-primary)]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </section>

              {/* Theme */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Palette className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">Contrast</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <button
                      key={theme.value}
                      aria-pressed={settings.theme === theme.value}
                      onClick={() => updateSettings({ theme: theme.value as any })}
                      className={`p-4 rounded-2xl border-4 text-xl font-medium transition-all min-h-[80px] ${
                        settings.theme === theme.value
                          ? 'border-[var(--mk-primary)] bg-purple-50 text-[var(--mk-primary)]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </section>

              {/* Text Size */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Type className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">Text Size</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {textSizes.map((size) => (
                    <button
                      key={size.value}
                      aria-pressed={settings.textSize === size.value}
                      onClick={() => updateSettings({ textSize: size.value as any })}
                      className={`p-4 rounded-2xl border-4 font-medium transition-all min-h-[80px] ${
                        size.size
                      } ${
                        settings.textSize === size.value
                          ? 'border-[var(--mk-primary)] bg-green-50 text-[var(--mk-primary)]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </section>

              {/* Volume */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Volume2 className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">Voice Volume</h3>
                </div>
                <div className="flex items-center gap-6">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    aria-label="Voice volume"
                    value={settings.volume}
                    onChange={(e) => updateSettings({ volume: parseInt(e.target.value) })}
                    className="flex-1 h-6 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[var(--mk-primary)]"
                  />
                  <span className="text-3xl font-bold text-gray-900 w-20 text-right">
                    {settings.volume}%
                  </span>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-8 border-t">
              <Button size="lg" onClick={onClose} className="w-full min-h-[80px] text-3xl rounded-2xl bg-[var(--mk-primary)] hover:opacity-90">
                Save & Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
