'use client';

import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/sidebar';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, AlertCircle } from 'lucide-react';

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await admin.questions.list();
      setQuestions(res.data.questions || res.data || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuestions();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/doctor/login');
  };

  const confirmDelete = async (nodeId: string) => {
    try {
      await admin.questions.delete(nodeId);
      setDeletingId(null);
      fetchQuestions();
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--mk-bg)' }}>
      <AdminSidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto p-6 md:p-10 w-full">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: 'var(--mk-text)' }}>Question Bank</h1>
              <p className="font-medium" style={{ color: 'var(--mk-text-secondary)' }}>Manage intake questionnaire flow</p>
            </div>
            <Button 
              onClick={() => setShowForm(!showForm)}
              style={{ backgroundColor: 'var(--mk-primary)', color: 'var(--mk-text-inverse)' }}
            >
              <Plus className="w-4 h-4 mr-2" /> {showForm ? 'Cancel' : 'Add Question'}
            </Button>
          </div>

          {showForm && (
            <div className="mb-8 p-6 rounded-xl border border-dashed border-gray-300 bg-white text-center text-gray-500">
              [Mock Form Area] Question creation form would go here.
            </div>
          )}

          <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--mk-surface)', border: '1px solid var(--mk-border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead style={{ backgroundColor: 'var(--mk-surface-muted)' }}>
                  <tr>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--mk-text-secondary)' }}>Node ID</th>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--mk-text-secondary)' }}>Question Text</th>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--mk-text-secondary)' }}>Type</th>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold whitespace-nowrap text-right" style={{ color: 'var(--mk-text-secondary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--mk-border)' }}>
                  {loading ? (
                    // Skeleton Rows
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-mk-shimmer"></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-200 rounded animate-mk-shimmer"></div></td>
                        <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-200 rounded-md animate-mk-shimmer"></div></td>
                        <td className="px-6 py-4 text-right"><div className="h-4 w-12 bg-gray-200 rounded inline-block animate-mk-shimmer"></div></td>
                      </tr>
                    ))
                  ) : questions.length > 0 ? (
                    questions.map((q: any) => (
                      <tr key={q.node_id} className="transition-colors hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-mono font-medium" style={{ color: 'var(--mk-text)' }}>{q.node_id}</td>
                        <td className="px-6 py-4" style={{ color: 'var(--mk-text)' }}>{q.question_text}</td>
                        <td className="px-6 py-4">
                          <span 
                            className="px-2.5 py-1 rounded-md text-xs font-semibold"
                            style={{ backgroundColor: 'var(--mk-info-light)', color: 'var(--mk-info)' }}
                          >
                            {q.question_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {deletingId === q.node_id ? (
                            <div className="flex items-center justify-end gap-2 inline-flex bg-red-50 p-1.5 rounded-lg border border-red-100">
                              <span className="text-xs font-semibold text-red-600 mr-2 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" /> Sure?
                              </span>
                              <button onClick={() => setDeletingId(null)} className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50">No</button>
                              <button onClick={() => confirmDelete(q.node_id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Yes</button>
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={() => setShowForm(true)}
                                aria-label={`Edit question ${q.node_id}`}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setDeletingId(q.node_id)}
                                aria-label={`Delete question ${q.node_id}`}
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
                      <td colSpan={4} className="px-6 py-12 text-center font-medium" style={{ color: 'var(--mk-text-muted)' }}>
                        No questions found
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
