'use client';

import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/sidebar';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, Ban, CheckCircle } from 'lucide-react';

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/doctor/login');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      try {
        await admin.staff.delete(id);
        fetchStaff();
      } catch (error) {
        console.error('Failed to delete staff:', error);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar onLogout={handleLogout} />
      <div className="flex-1 overflow-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Management</h1>
            <p className="text-gray-600">Manage doctors and administrators</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Staff
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {staff.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{s.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">{s.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        s.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.is_active !== false ? (
                        <span className="flex items-center text-green-600 text-sm"><CheckCircle className="w-4 h-4 mr-1" /> Active</span>
                      ) : (
                        <span className="flex items-center text-red-600 text-sm"><Ban className="w-4 h-4 mr-1" /> Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-blue-600 mr-3">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No staff found
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
