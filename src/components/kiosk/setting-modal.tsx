'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Volume2, Type, Palette } from 'lucide-react';
import { useKioskStore } from '@/store/kiosk-store';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useKioskStore();

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme
    if (settings.theme === 'light') {
      root.classList.remove('dark', 'high-contrast');
    } else if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('high-contrast');
    } else if (settings.theme === 'high-contrast') {
      root.classList.add('high-contrast');
      root.classList.remove('dark');
    }

    // Apply text size
    if (settings.textSize === 'small') {
      root.style.fontSize = '14px';
    } else if (settings.textSize === 'medium') {
      root.style.fontSize = '16px';
    } else if (settings.textSize === 'large') {
      root.style.fontSize = '20px';
    }
  }, [settings.theme, settings.textSize]);

  if (!isOpen) return null;

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
    { value: 'small', name: 'Small', size: 'text-sm' },
    { value: 'medium', name: 'Medium', size: 'text-base' },
    { value: 'large', name: 'Large', size: 'text-xl' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Language */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Type className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Language</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => updateSettings({ language: lang.code })}
                  className={`p-4 rounded-xl border-2 text-lg font-medium transition-all ${
                    settings.language === lang.code
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Palette className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Theme</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => updateSettings({ theme: theme.value as any })}
                  className={`p-4 rounded-xl border-2 text-base font-medium transition-all ${
                    settings.theme === theme.value
                      ? 'border-purple-600 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* Text Size */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Type className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Text Size</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {textSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => updateSettings({ textSize: size.value as any })}
                  className={`p-4 rounded-xl border-2 font-medium transition-all ${
                    size.size
                  } ${
                    settings.textSize === size.value
                      ? 'border-green-600 bg-green-50 text-green-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Volume</h3>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={(e) => updateSettings({ volume: parseInt(e.target.value) })}
                className="flex-1 h-3 bg-gray-200 rounded-full appearance-none cursor-pointer"
              />
              <span className="text-xl font-semibold text-gray-900 w-16 text-right">
                {settings.volume}%
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <Button size="lg" onClick={onClose} className="w-full">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
