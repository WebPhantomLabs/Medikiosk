'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { doctor } from '@/lib/api-client';
import { formatTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface QueuePatient {
  session_id: string;
  token_number: string;
  patient_name: string;
  kiosk_code: string;
  status: string;
  issued_at: string;
  chief_complaint?: string; // Mocking or pulling if available in real endpoint
}

interface PatientQueueProps {
  onSelectPatient: (tokenNumber: string) => void;
}

export function PatientQueue({ onSelectPatient }: PatientQueueProps) {
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQueue = async () => {
    try {
      setError(null);
      const response = await doctor.getQueue();
      const data = Array.isArray(response.data) ? response.data : response.data.queue || [];
      setQueue(data);
    } catch (err: any) {
      console.error('Failed to fetch queue:', err);
      setError('Unable to load patient queue. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQueue();
    const interval = setInterval(() => {
      setIsRefreshing(true);
      fetchQueue().finally(() => setIsRefreshing(false));
    }, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusBadgeStyle = (status: string) => {
    switch(status.toLowerCase()) {
      case 'waiting':
        return { bg: 'var(--mk-warning-light)', color: 'var(--mk-warning)' };
      case 'in_progress':
      case 'consulting':
        return { bg: 'var(--mk-info-light)', color: 'var(--mk-info)' };
      case 'completed':
        return { bg: 'var(--mk-success-light)', color: 'var(--mk-success)' };
      default:
        return { bg: 'var(--mk-surface-muted)', color: 'var(--mk-text-secondary)' };
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-40 bg-gray-200 rounded animate-mk-shimmer"></div>
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-mk-shimmer"></div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-full bg-gray-100 rounded-xl animate-mk-shimmer"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 mb-4" style={{ color: 'var(--mk-error)' }} />
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--mk-text)' }}>Connection Error</h3>
        <p className="mb-6" style={{ color: 'var(--mk-text-secondary)' }}>{error}</p>
        <Button 
          onClick={() => { setIsLoading(true); fetchQueue(); }}
          style={{ backgroundColor: 'var(--mk-primary)', color: 'var(--mk-text-inverse)' }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Patients in Queue</h3>
        <p className="text-gray-500">The waiting room is currently empty. Patients will appear here once they complete the kiosk check-in.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--mk-text)' }}>Patient Queue</h2>
          <span 
            className="px-3 py-1 rounded-full text-sm font-semibold"
            style={{ backgroundColor: 'var(--mk-primary-subtle)', color: 'var(--mk-primary-dark)' }}
          >
            {queue.length} waiting
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--mk-text-muted)' }}>
          <span className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${isRefreshing ? 'bg-blue-500 animate-mk-pulse' : 'bg-green-500'}`}></span>
            Auto-refresh
          </span>
        </div>
      </div>

      <AnimatePresence>
        {queue.map((patient, index) => {
          const statusStyle = getStatusBadgeStyle(patient.status);
          
          return (
            <motion.div
              key={patient.token_number}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPatient(patient.token_number)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPatient(patient.token_number);
                }
              }}
              className="group rounded-xl p-5 cursor-pointer outline-none transition-all duration-200"
              style={{ 
                backgroundColor: 'var(--mk-surface)', 
                border: '1px solid var(--mk-border)',
                boxShadow: 'var(--mk-shadow-sm)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--mk-shadow-md)';
                e.currentTarget.style.borderColor = 'var(--mk-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--mk-shadow-sm)';
                e.currentTarget.style.borderColor = 'var(--mk-border)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--mk-primary)';
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--mk-primary-subtle)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--mk-border)';
                e.currentTarget.style.boxShadow = 'var(--mk-shadow-sm)';
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-5">
                  <div 
                    className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center font-mono text-xl font-bold tracking-tight"
                    style={{ backgroundColor: 'var(--mk-surface-muted)', color: 'var(--mk-text)' }}
                  >
                    {patient.token_number}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--mk-text)' }}>
                      {patient.patient_name}
                    </h3>
                    {patient.chief_complaint && (
                      <p className="text-sm line-clamp-1" style={{ color: 'var(--mk-text-secondary)' }}>
                        &quot;{patient.chief_complaint}&quot;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-0 pt-4 sm:pt-0" style={{ borderColor: 'var(--mk-border)' }}>
                  <div className="text-right flex items-center sm:block gap-4">
                    <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--mk-text-secondary)' }}>
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(patient.issued_at)}</span>
                    </div>
                    <div 
                      className="text-xs px-2.5 py-1 rounded-full font-medium mt-0 sm:mt-1.5 inline-block capitalize"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                    >
                      {patient.status.replace('_', ' ')}
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'var(--mk-primary-subtle)', color: 'var(--mk-primary)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
