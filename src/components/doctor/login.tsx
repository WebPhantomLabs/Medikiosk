'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export function DoctorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await auth.staffLogin({ email, password });
      const { access_token, refresh_token, staff } = response.data;

      localStorage.setItem('access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      if (staff?.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/doctor/dashboard');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Invalid email or password. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-bold">M</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MediKiosk</h1>
          <p className="text-gray-600">Staff & Doctor Portal</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Staff Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="doctor@medikiosk.local"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full mt-2"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border">
          <p className="font-semibold text-gray-700">Demo Staff Credentials:</p>
          <div className="font-mono text-xs mt-2 space-y-1 text-gray-600">
            <p><strong>Doctor:</strong> doctor@medikiosk.local / Password123!</p>
            <p><strong>Admin:</strong> admin@medikiosk.local / Password123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
