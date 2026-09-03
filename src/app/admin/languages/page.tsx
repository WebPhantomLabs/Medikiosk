'use client';

import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/sidebar';
import { useRouter } from 'next/navigation';
import { Languages, Info } from 'lucide-react';

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
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar onLogout={handleLogout} />
      <div className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Language Configuration</h1>
          <p className="text-gray-600">Manage supported languages for patient kiosks</p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg flex items-start">
          <Info className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Language settings affect the kiosk interface language options. English is the default system language and cannot be disabled. Changes are saved automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SUPPORTED_LANGUAGES.map(lang => {
            const isEnabled = enabledLanguages.includes(lang.code);
            const isEnglish = lang.code === 'en';

            return (
              <div 
                key={lang.code}
                className={`bg-white rounded-xl shadow p-6 border-2 transition-all ${
                  isEnabled ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      isEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Languages className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{lang.name}</h3>
                      <p className="text-sm text-gray-500">{lang.nativeName}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isEnabled}
                      onChange={() => toggleLanguage(lang.code)}
                      disabled={isEnglish}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
