'use client';

import { useState, useEffect } from 'react';
import { PatientQueue } from '@/components/doctor/patient-queue';
import { PatientSummary } from '@/components/doctor/patient-summary';
import { Button } from '@/components/ui/button';
import { LogOut, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export default function DoctorDashboard() {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [searchToken, setSearchToken] = useState('');
  const [doctorName, setDoctorName] = useState('Doctor');
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const decoded: any = jwtDecode(token);
        if (decoded.sub) {
          // Typically email is in sub, let's extract the name part
          const namePart = decoded.sub.split('@')[0];
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setDoctorName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
        }
      }
    } catch (e) {
      console.error('Error decoding token', e);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/doctor/login');
  };

  const handleSearchToken = () => {
    if (searchToken.trim()) {
      setSelectedToken(searchToken.trim().toUpperCase());
    }
  };

  const handleClosePatient = () => {
    setSelectedToken(null);
    setSearchToken('');
  };

  const handleSignOff = () => {
    setSelectedToken(null);
    setSearchToken('');
    // Queue will auto-refresh
  };

  if (selectedToken) {
    return (
      <PatientSummary
        tokenNumber={selectedToken}
        onClose={handleClosePatient}
        onSignOff={handleSignOff}
      />
    );
  }

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: 'var(--mk-bg)', color: 'var(--mk-text)' }}>
      {/* Top Bar */}
      <header 
        className="sticky top-0 z-30 shadow-sm" 
        style={{ backgroundColor: 'var(--mk-surface)', borderBottom: '1px solid var(--mk-border)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
              style={{ backgroundColor: 'var(--mk-primary)', color: 'var(--mk-text-inverse)' }}
            >
              M
            </div>
            <div className="flex flex-col">
              <span className="font-semibold leading-tight" style={{ color: 'var(--mk-text)' }}>MediKiosk</span>
              <span className="text-xs leading-tight" style={{ color: 'var(--mk-text-secondary)' }}>Doctor Dashboard</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium hidden sm:block" style={{ color: 'var(--mk-text-secondary)' }}>
              Dr. {doctorName}
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              size="sm"
              className="flex items-center gap-2"
              style={{ borderColor: 'var(--mk-border-strong)', color: 'var(--mk-text-secondary)' }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Token Search Bar */}
        <div 
          className="rounded-xl shadow-sm p-6 mb-8" 
          style={{ backgroundColor: 'var(--mk-surface)', border: '1px solid var(--mk-border)' }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--mk-text)' }}>Quick Token Lookup</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--mk-text-muted)' }} />
              <input
                type="text"
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchToken()}
                aria-label="Search by token number"
                placeholder="Enter token number (e.g., A017)"
                className="w-full pl-12 pr-4 py-3 rounded-lg outline-none text-lg font-mono tracking-wider uppercase transition-all"
                style={{ 
                  backgroundColor: 'var(--mk-surface-muted)',
                  border: '1px solid var(--mk-border)',
                  color: 'var(--mk-text)'
                }}
              />
            </div>
            <Button 
              size="lg" 
              onClick={handleSearchToken}
              className="h-auto sm:w-auto w-full"
              style={{ backgroundColor: 'var(--mk-primary)', color: 'var(--mk-text-inverse)' }}
            >
              Pull Up Patient
            </Button>
          </div>
        </div>

        {/* Patient Queue area */}
        <div 
          className="rounded-xl shadow-sm"
          style={{ backgroundColor: 'var(--mk-surface)', border: '1px solid var(--mk-border)' }}
        >
          <PatientQueue onSelectPatient={setSelectedToken} />
        </div>
      </main>
    </div>
  );
}
