'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function DoctorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
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
      if (!err.response) {
        // Network error / Backend unreachable
        setError("We're unable to sign you in right now. Please try again.");
      } else if (err.response.status === 401) {
        // Invalid credentials
        setError("The email or password is incorrect.");
      } else if (err.response.status === 403) {
        // Forbidden
        setError("Your account does not have permission to access this portal.");
      } else if (err.response.status >= 500) {
        // Server error
        setError("We're unable to sign you in right now. Please try again.");
      } else {
        // Fallback for other API errors (like 400 validation)
        setError(
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: 'var(--mk-bg)',
        backgroundImage: 'radial-gradient(circle at top right, var(--mk-primary-subtle), transparent 50%)'
      }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
        style={{ backgroundColor: 'var(--mk-surface)', border: '1px solid var(--mk-border)' }}
      >
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3"
            style={{ backgroundColor: 'var(--mk-primary)' }}
          >
            <span className="text-white text-3xl font-bold" style={{ color: 'var(--mk-text-inverse)' }}>M</span>
          </div>
          <h1 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: 'var(--mk-text)' }}>Doctor Portal</h1>
          <p style={{ color: 'var(--mk-text-secondary)' }}>Sign in to clinical workstation</p>
        </div>

        {error && (
          <div 
            role="alert"
            className="px-4 py-3 rounded-lg mb-6 text-sm flex items-start"
            style={{ backgroundColor: 'var(--mk-error-light)', color: 'var(--mk-error)', border: '1px solid var(--mk-error)' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--mk-text)' }}>
              Clinical ID (Email)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg outline-none transition-all duration-200"
              style={{ 
                border: '1px solid var(--mk-border-strong)',
                backgroundColor: 'var(--mk-surface)',
                color: 'var(--mk-text)'
              }}
              placeholder="doctor@medikiosk.local"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--mk-text)' }}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg outline-none transition-all duration-200 pr-12"
                style={{ 
                  border: '1px solid var(--mk-border-strong)',
                  backgroundColor: 'var(--mk-surface)',
                  color: 'var(--mk-text)'
                }}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                style={{ color: 'var(--mk-text-muted)' }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full mt-4 font-medium transition-all"
            style={{ 
              backgroundColor: 'var(--mk-primary)',
              color: 'var(--mk-text-inverse)',
              height: 'var(--mk-touch-default)'
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Authenticating...
              </span>
            ) : (
              'Sign In to Workstation'
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--mk-border)' }}>
          <button 
            type="button"
            onClick={() => setShowDemo(!showDemo)}
            className="text-xs w-full text-center hover:underline focus:outline-none"
            style={{ color: 'var(--mk-text-muted)' }}
          >
            {showDemo ? 'Hide Demo Credentials' : 'Need demo credentials?'}
          </button>
          
          <AnimatePresence>
            {showDemo && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 rounded-lg text-xs"
                style={{ backgroundColor: 'var(--mk-surface-muted)', color: 'var(--mk-text-secondary)' }}
              >
                <div className="space-y-1.5 font-mono">
                  <p><strong style={{ color: 'var(--mk-text)' }}>Doctor:</strong> doctor@medikiosk.local / Password123!</p>
                  <p><strong style={{ color: 'var(--mk-text)' }}>Admin:</strong> admin@medikiosk.local / Password123!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
