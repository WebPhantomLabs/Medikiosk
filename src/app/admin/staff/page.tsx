'use client';

import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/sidebar';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, Ban, CheckCircle, AlertCircle } from 'lucide-react';

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await admin.staff.list();
      setStaff(res.data.staff || res.data || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStaff();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/doctor/login');
  };

  const confirmDelete = async (id: string) => {
    try {
      await admin.staff.delete(id);
      setDeletingId(null);
      fetchStaff();
    } catch (error) {
      console.error('Failed to delete staff:', error);
    }
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--mk-bg)' }}>
      <AdminSidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto p-6 md:p-10 w-full">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: 'var(--mk-text)' }}>Staff Management</h1>
              <p className="font-medium" style={{ color: 'var(--mk-text-secondary)' }}>Manage doctors and administrators</p>
            </div>
            <Button 
              onClick={() => setShowForm(!showForm)}
              style={{ backgroundColor: 'var(--mk-primary)', color: 'var(--mk-text-inverse)' }}
            >
              <Plus className="w-4 h-4 mr-2" /> {showForm ? 'Cancel' : 'Add Staff'}
            </Button>
          </div>

          {showForm && (
            <div className="mb-8 p-6 rounded-xl border border-dashed border-gray-300 bg-white text-center text-gray-500">
              [Mock Form Area] Staff creation form would go here.
            </div>
          )}

          <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--mk-surface)', border: '1px solid var(--mk-border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead style={{ backgroundColor: 'var(--mk-surface-muted)' }}>
                  <tr>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--mk-text-secondary)' }}>Name</th>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--mk-text-secondary)' }}>Email</th>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--mk-text-secondary)' }}>Role</th>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--mk-text-secondary)' }}>Status</th>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold whitespace-nowrap text-right" style={{ color: 'var(--mk-text-secondary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--mk-border)' }}>
                  {loading ? (
                    // Skeleton Rows
                    [...Array(4)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 rounded animate-mk-shimmer"></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-200 rounded animate-mk-shimmer"></div></td>
                        <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-200 rounded-md animate-mk-shimmer"></div></td>
                        <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-200 rounded-md animate-mk-shimmer"></div></td>
                        <td className="px-6 py-4 text-right"><div className="h-4 w-12 bg-gray-200 rounded inline-block animate-mk-shimmer"></div></td>
                      </tr>
                    ))
                  ) : staff.length > 0 ? (
                    staff.map((s: any) => (
                      <tr key={s.id} className="transition-colors hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium" style={{ color: 'var(--mk-text)' }}>{s.full_name}</td>
                        <td className="px-6 py-4" style={{ color: 'var(--mk-text-secondary)' }}>{s.email}</td>
                        <td className="px-6 py-4">
                          <span 
                            className="px-2.5 py-1 rounded-md text-xs font-semibold"
                            style={{ 
                              backgroundColor: s.role === 'ADMIN' ? '#F3E8FF' : 'var(--mk-info-light)', 
                              color: s.role === 'ADMIN' ? '#7E22CE' : 'var(--mk-info)' 
                            }}
                          >
                            {s.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {s.is_active !== false ? (
                            <span className="flex items-center text-sm font-medium" style={{ color: 'var(--mk-success)' }}>
                              <CheckCircle className="w-4 h-4 mr-1.5" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center text-sm font-medium" style={{ color: 'var(--mk-error)' }}>
                              <Ban className="w-4 h-4 mr-1.5" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {deletingId === s.id ? (
                            <div className="flex items-center justify-end gap-2 inline-flex bg-red-50 p-1.5 rounded-lg border border-red-100">
                              <span className="text-xs font-semibold text-red-600 mr-2 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" /> Sure?
                              </span>
                              <button onClick={() => setDeletingId(null)} className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50">No</button>
                              <button onClick={() => confirmDelete(s.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Yes</button>
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={() => setShowForm(true)}
                                aria-label={`Edit staff ${s.full_name}`}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setDeletingId(s.id)}
                                aria-label={`Delete staff ${s.full_name}`}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center font-medium" style={{ color: 'var(--mk-text-muted)' }}>
                        No staff found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
