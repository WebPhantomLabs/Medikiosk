'use client';

import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/sidebar';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, Monitor } from 'lucide-react';

export default function KiosksPage() {
  const router = useRouter();
  const [kiosks, setKiosks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKiosks();
  }, []);

  const fetchKiosks = async () => {
    try {
      setLoading(true);
      const res = await admin.kiosks.list();
      setKiosks(res.data.kiosks || res.data || []);
    } catch (error) {
      console.error('Failed to fetch kiosks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/doctor/login');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this kiosk?')) {
      try {
        await admin.kiosks.delete(id);
        fetchKiosks();
      } catch (error) {
        console.error('Failed to delete kiosk:', error);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar onLogout={handleLogout} />
      <div className="flex-1 overflow-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Kiosk Devices</h1>
            <p className="text-gray-600">Manage patient intake kiosks</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Register Kiosk
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Kiosk Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Branch</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {kiosks.map((k: any) => (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono font-semibold">
                      <div className="flex items-center">
                        <Monitor className="w-4 h-4 mr-2 text-gray-400" />
                        {k.kiosk_code}
                      </div>
                    </td>
                    <td className="px-6 py-4">{k.location || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                        {k.branch || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        k.status === 'OFFLINE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {k.status || 'ONLINE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-blue-600 mr-3">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(k.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {kiosks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No kiosks registered
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
