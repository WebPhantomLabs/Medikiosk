'use client';

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const languages = [
  { code: 'hi', name: 'हिंदी', nativeName: 'Hindi' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ta', name: 'தமிழ்', nativeName: 'Tamil' },
  { code: 'mr', name: 'मराठी', nativeName: 'Marathi' },
  { code: 'bn', name: 'বাংলা', nativeName: 'Bengali' },
  { code: 'te', name: 'తెలుగు', nativeName: 'Telugu' },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
  onContinue: () => void;
}

export function LanguageSelector({
  selectedLanguage,
  onSelectLanguage,
  onContinue,
}: LanguageSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-4xl w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Select Your Language
          </h2>
          <p className="text-xl text-gray-600">
            अपनी भाषा चुनें | Choose your preferred language
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onSelectLanguage(lang.code)}
              className={`
                relative p-8 rounded-2xl border-4 transition-all
                ${
                  selectedLanguage === lang.code
                    ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
              `}
            >
              {selectedLanguage === lang.code && (
                <div className="absolute top-3 right-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {lang.name}
                </div>
                <div className="text-lg text-gray-600">{lang.nativeName}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            size="xl"
            onClick={onContinue}
            disabled={!selectedLanguage}
            className="px-16 py-6 text-xl"
          >
            Continue / जारी रखें
          </Button>
        </div>
      </div>
    </div>
  );
}
