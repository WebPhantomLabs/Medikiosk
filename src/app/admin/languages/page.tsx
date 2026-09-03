'use client';

import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/sidebar';
import { useRouter } from 'next/navigation';
import { Languages, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
];

export default function LanguagesPage() {
  const router = useRouter();
  const [enabledLanguages, setEnabledLanguages] = useState<string[]>(['en']);

  useEffect(() => {
    const saved = localStorage.getItem('enabled_languages');
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnabledLanguages(JSON.parse(saved));
    }
  }, []);

  const toggleLanguage = (code: string) => {
    // Prevent disabling English
    if (code === 'en') return;

    let updated: string[];
    if (enabledLanguages.includes(code)) {
      updated = enabledLanguages.filter(l => l !== code);
    } else {
      updated = [...enabledLanguages, code];
    }
    setEnabledLanguages(updated);
    localStorage.setItem('enabled_languages', JSON.stringify(updated));
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/doctor/login');
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--mk-bg)' }}>
      <AdminSidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto p-6 md:p-10 w-full">
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: 'var(--mk-text)' }}>Language Configuration</h1>
            <p className="font-medium" style={{ color: 'var(--mk-text-secondary)' }}>Manage supported languages for patient kiosks</p>
          </div>

          <div 
            className="p-4 mb-8 rounded-lg flex items-start border-l-4"
            style={{ 
              backgroundColor: 'var(--mk-info-light)', 
              borderColor: 'var(--mk-info)',
              color: 'var(--mk-text)' 
            }}
          >
            <Info className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style={{ color: 'var(--mk-info)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--mk-text-secondary)' }}>
              Language settings affect the kiosk interface language options. English is the default system language and cannot be disabled. Changes are saved automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SUPPORTED_LANGUAGES.map((lang, index) => {
              const isEnabled = enabledLanguages.includes(lang.code);
              const isEnglish = lang.code === 'en';

              return (
                <motion.div 
                  key={lang.code}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => !isEnglish && toggleLanguage(lang.code)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isEnglish) {
                      e.preventDefault();
                      toggleLanguage(lang.code);
                    }
                  }}
                  className={`rounded-xl shadow-sm p-6 border-2 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${!isEnglish ? 'hover:-translate-y-1' : ''}`}
                  style={{
                    backgroundColor: 'var(--mk-surface)',
                    borderColor: isEnabled ? 'var(--mk-primary)' : 'transparent',
                    opacity: isEnglish ? 0.9 : 1
                  }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-colors"
                        style={{
                          backgroundColor: isEnabled ? 'var(--mk-primary-subtle)' : 'var(--mk-surface-hover)',
                          color: isEnabled ? 'var(--mk-primary-dark)' : 'var(--mk-text-muted)'
                        }}
                      >
                        <Languages className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: 'var(--mk-text)' }}>{lang.name}</h3>
                        <p className="text-sm" style={{ color: 'var(--mk-text-secondary)' }}>{lang.nativeName}</p>
                      </div>
                    </div>
                    
                    <label 
                      className="relative inline-flex items-center cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isEnabled}
                        onChange={() => toggleLanguage(lang.code)}
                        disabled={isEnglish}
                        aria-label={`Toggle ${lang.name} language`}
                      />
                      <div 
                        className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                        style={{
                          backgroundColor: isEnabled ? 'var(--mk-primary)' : '#e5e7eb'
                        }}
                      ></div>
                    </label>
                  </div>
                  
                  <div className="text-sm pt-2 border-t" style={{ borderColor: 'var(--mk-border)' }}>
                    <span 
                      className="px-2.5 py-1 rounded-md text-xs font-semibold inline-block"
                      style={{
                        backgroundColor: isEnabled ? 'var(--mk-success-light)' : 'var(--mk-surface-muted)',
                        color: isEnabled ? 'var(--mk-success)' : 'var(--mk-text-secondary)'
                      }}
                    >
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    {isEnglish && (
                      <span className="ml-2 text-xs" style={{ color: 'var(--mk-text-muted)' }}>(Required)</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
