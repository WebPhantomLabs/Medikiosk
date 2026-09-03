'use client';

import { Button } from '@/components/ui/button';
import { Check, ChevronRight, CornerDownLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const languages = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
  onContinue: () => void;
  onBack?: () => void;
}

export function LanguageSelector({
  selectedLanguage,
  onSelectLanguage,
  onContinue,
  onBack,
}: LanguageSelectorProps) {
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[var(--mk-bg)] flex flex-col items-center justify-between p-12">
      
      {/* Top Header */}
      <div className="w-full max-w-5xl flex justify-start opacity-70">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center text-[var(--mk-text-secondary)] hover:text-[var(--mk-text)] transition-colors text-lg font-medium p-4 -ml-4"
          >
            <CornerDownLeft className="w-6 h-6 mr-3" />
            Back
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="w-full max-w-5xl flex-1 flex flex-col items-center justify-center space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-5xl font-bold text-[var(--mk-text)] tracking-tight">
            Choose your language
          </h2>
          <p className="text-2xl text-[var(--mk-text-secondary)]">
            अपनी भाषा चुनें
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-3 gap-6 w-full"
          role="radiogroup"
          aria-label="Select Language"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {languages.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <motion.button
                key={lang.code}
                variants={itemVariants}
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectLanguage(lang.code)}
                className={`
                  relative p-10 rounded-3xl border-2 transition-all text-center group
                  ${
                    isSelected
                      ? 'border-[var(--mk-primary)] bg-blue-50 shadow-md'
                      : 'border-[var(--mk-border)] bg-white hover:border-[var(--mk-primary)]/50 hover:bg-gray-50'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 bg-[var(--mk-primary)] rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
                <div>
                  <div 
                    className={`text-4xl font-bold mb-3 ${isSelected ? 'text-[var(--mk-primary)]' : 'text-gray-900 group-hover:text-[var(--mk-primary)]'}`}
                    lang={lang.code}
                  >
                    {lang.native}
                  </div>
                  <div className={`text-xl ${isSelected ? 'text-blue-800' : 'text-gray-500'}`}>
                    {lang.name}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Bottom Action */}
      <div className="w-full max-w-5xl flex justify-center pt-12 pb-8">
        <Button
          size="lg"
          onClick={onContinue}
          disabled={!selectedLanguage}
          className="w-full max-w-md shadow-lg"
        >
          Continue <ChevronRight className="w-8 h-8 ml-2" />
        </Button>
      </div>
    </div>
  );
}
