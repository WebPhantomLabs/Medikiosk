'use client';

import { useState } from 'react';
import { PatientQueue } from '@/components/doctor/patient-queue';
import { PatientSummary } from '@/components/doctor/patient-summary';
import { Button } from '@/components/ui/button';
import { LogOut, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DoctorDashboard() {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [searchToken, setSearchToken] = useState('');
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/doctor/login');
  };

  const handleSearchToken = () => {
    if (searchToken.trim()) {
      setSelectedToken(searchToken.trim());
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MediKiosk</h1>
                <p className="text-sm text-gray-600">Doctor Dashboard</p>
              </div>
            </div>

            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Token Lookup</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchToken()}
              placeholder="Enter token number (e.g., A017)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-mono"
            />
            <Button size="lg" onClick={handleSearchToken}>
              <Search className="w-5 h-5 mr-2" />
              Pull Up Patient
            </Button>
          </div>
        </div>

        {/* Queue */}
        <div className="bg-white rounded-xl shadow p-6">
          <PatientQueue onSelectPatient={setSelectedToken} />
        </div>
      </div>
    </div>
  );
}
