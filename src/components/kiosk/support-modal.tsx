'use client';

import { Button } from '@/components/ui/button';
import { X, Phone, AlertTriangle } from 'lucide-react';
import { support } from '@/lib/api-client';
import { useState, useEffect, useRef } from 'react';
import { useKioskStore } from '@/store/kiosk-store';
import { motion, AnimatePresence } from 'framer-motion';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { kioskId, sessionId } = useKioskStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-title"
            tabIndex={-1}
            ref={dialogRef}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b">
              <h2 id="support-title" className="text-3xl font-bold text-gray-900">Need Help?</h2>
              <button
                onClick={onClose}
                aria-label="Close support modal"
                className="min-w-[48px] min-h-[48px] rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Content */}
            {submitted ? (
              <div className="p-16 text-center" aria-live="assertive">
                <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Phone className="w-16 h-16 text-green-600" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-4">
                  Help is on the way!
                </h3>
                <p className="text-2xl text-gray-600">
                  A staff member will assist you shortly
                </p>
              </div>
            ) : (
              <div className="p-8 space-y-6">
                <p className="text-gray-600 text-2xl text-center mb-8">
                  Choose the type of assistance you need:
                </p>

                <button
                  onClick={() => handleRequest('nurse_call')}
                  disabled={isSubmitting}
                  className="w-full p-8 rounded-3xl border-4 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all disabled:opacity-50 flex items-center gap-6"
                >
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <Phone className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">Call a Nurse</h3>
                    <p className="text-xl text-gray-700">Need help understanding or answering questions</p>
                  </div>
                </button>

                <button
                  onClick={() => handleRequest('technical_fault')}
                  disabled={isSubmitting}
                  className="w-full p-8 rounded-3xl border-4 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:border-orange-300 transition-all disabled:opacity-50 flex items-center gap-6"
                >
                  <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <AlertTriangle className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">Report a Problem</h3>
                    <p className="text-xl text-gray-700">Something isn&apos;t working correctly</p>
                  </div>
                </button>
              </div>
            )}

            {/* Footer */}
            {!submitted && (
              <div className="p-8 border-t">
                <Button variant="outline" size="lg" onClick={onClose} className="w-full min-h-[80px] text-2xl rounded-2xl">
                  Cancel
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
