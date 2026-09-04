'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface HealthResponse {
  status: string;
  checks: {
    database: string;
    ai_provider: string;
    ocr_provider: string;
    speech_provider: string;
  };
}

export function ProviderStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await apiClient.get('/health/ready');
        setHealth(res.data as HealthResponse);
      } catch (err) {
        console.error('Failed to fetch health status', err);
      }
    }
    fetchHealth();
  }, []);

  if (!health) {
    return (
      <div className="flex items-center gap-2 px-2 py-1">
        <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
        <span className="text-xs font-medium text-gray-500">Checking systems...</span>
      </div>
    );
  }

  const isAllReal = 
    health.checks.ai_provider !== 'mock' && 
    health.checks.ocr_provider !== 'mock' && 
    health.checks.speech_provider !== 'mock';

  return (
    <div className="flex flex-col gap-1 px-2 py-1">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health.status === 'ready' ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className={`relative inline-flex rounded-full h-3 w-3 ${health.status === 'ready' ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--mk-text-secondary)' }}>
          {health.status === 'ready' ? (isAllReal ? 'All systems operational' : 'Running with Mock Providers') : 'System Error'}
        </span>
      </div>
      <div className="text-[10px] text-gray-500 pl-5">
        AI: {health.checks.ai_provider} | OCR: {health.checks.ocr_provider} | Speech: {health.checks.speech_provider}
      </div>
    </div>
  );
}
