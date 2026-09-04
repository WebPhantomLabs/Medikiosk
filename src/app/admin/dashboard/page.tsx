'use client';

import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/sidebar';
import { useRouter } from 'next/navigation';
import { Users, Monitor, Activity, CheckCircle } from 'lucide-react';
import { admin } from '@/lib/api-client';

interface DashboardStats {
  sessions_today: number;
  active_kiosks: number;
  waiting_patients: number;
  completed_today: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    sessions_today: 0,
    active_kiosks: 0,
    waiting_patients: 0,
    completed_today: 0,
  });
  const [recentSessions, setRecentSessions] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const sessionsResponse = await admin.sessions.list();
      const sessions = sessionsResponse.data?.sessions || [];
      const kiosksResponse = await admin.kiosks.list();
      const kiosks = kiosksResponse.data || [];
      
      const inProgress = sessions.filter((s: any) => 
        ['WAITING_FOR_DOCTOR', 'IN_CONSULTATION', 'INTAKE_IN_PROGRESS'].includes(s.status)
      ).length;
      
      const completed = sessions.filter((s: any) => s.status === 'COMPLETED').length;
      const activeKiosks = kiosks.filter((k: any) => k.status === 'ACTIVE').length;
      
      setStats({
        sessions_today: sessions.length,
        active_kiosks: activeKiosks,
        waiting_patients: inProgress,
        completed_today: completed
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/doctor/login');
  };

  const statCards = [
    { label: 'Sessions Today', value: stats.sessions_today, icon: Activity, color: 'blue' },
    { label: 'Active Kiosks', value: stats.active_kiosks, icon: Monitor, color: 'green' },
    { label: 'Waiting Patients', value: stats.waiting_patients, icon: Users, color: 'orange' },
    { label: 'Completed Today', value: stats.completed_today, icon: CheckCircle, color: 'purple' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar onLogout={handleLogout} />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">System overview and statistics</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              const colorClasses = {
                blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-500' },
                green: { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-500' },
                orange: { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'text-orange-500' },
                purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-500' },
              }[stat.color] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'text-gray-500' };

              return (
                <div key={stat.label} className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${colorClasses.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${colorClasses.text}`} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Recent Sessions</h2>
            </div>
            <div className="p-6">
              {recentSessions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Token</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Patient</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Branch</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentSessions.map((session: any) => (
                        <tr key={session.id}>
                          <td className="px-4 py-3 font-mono font-semibold">{session.token_number || '—'}</td>
                          <td className="px-4 py-3">{session.patient_name || 'Unknown'}</td>
                          <td className="px-4 py-3">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                              {session.branch}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              session.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                              session.status === 'IN_CONSULTATION' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {session.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(session.started_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No sessions yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
