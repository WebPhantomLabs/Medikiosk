'use client';

import { Button } from '@/components/ui/button';
import { X, Phone, AlertTriangle } from 'lucide-react';
import { support } from '@/lib/api-client';
import { useState } from 'react';
import { useKioskStore } from '@/store/kiosk-store';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { kioskId, sessionId } = useKioskStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleRequest = async (type: 'nurse_call' | 'technical_fault') => {
    if (!kioskId) return;
    
    setIsSubmitting(true);
    try {
      await support.request({
        kiosk_id: kioskId,
        session_id: sessionId || undefined,
        type,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Failed to send support request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Need Help?</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Help is on the way!
            </h3>
            <p className="text-gray-600">
              A staff member will assist you shortly
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <p className="text-gray-600 text-center mb-6">
              Choose the type of assistance you need:
            </p>

            <button
              onClick={() => handleRequest('nurse_call')}
              disabled={isSubmitting}
              className="w-full p-6 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900">Call a Nurse</h3>
                  <p className="text-gray-600">Need help understanding or answering questions</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRequest('technical_fault')}
              disabled={isSubmitting}
              className="w-full p-6 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:border-orange-300 transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900">Report a Problem</h3>
                  <p className="text-gray-600">Something isn't working correctly</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Footer */}
        {!submitted && (
          <div className="p-6 border-t">
            <Button variant="outline" size="lg" onClick={onClose} className="w-full">
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
