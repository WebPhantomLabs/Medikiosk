'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle, User } from 'lucide-react';
import { doctor } from '@/lib/api-client';
import { formatTime } from '@/lib/utils';

interface QueuePatient {
  session_id: string;
  token_number: string;
  patient_name: string;
  kiosk_code: string;
  status: string;
  issued_at: string;
}

interface PatientQueueProps {
  onSelectPatient: (tokenNumber: string) => void;
}

export function PatientQueue({ onSelectPatient }: PatientQueueProps) {
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await doctor.getQueue();
      setQueue(Array.isArray(response.data) ? response.data : response.data.queue || []);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="text-center py-16">
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No patients in queue</h3>
        <p className="text-gray-600">New patients will appear here automatically</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Patient Queue</h2>
        <div className="text-sm text-gray-500">
          {queue.length} patient{queue.length !== 1 ? 's' : ''} waiting
        </div>
      </div>

      {queue.map((patient) => (
        <div
          key={patient.token_number}
          className="bg-white rounded-xl border-2 p-4 hover:shadow-md transition-all cursor-pointer border-gray-200"
          onClick={() => onSelectPatient(patient.token_number)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {patient.token_number}
                  </span>
                </div>
                <p className="text-gray-600">{patient.patient_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(patient.issued_at)}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {patient.status}
                </div>
              </div>

              <Button size="sm">View</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
