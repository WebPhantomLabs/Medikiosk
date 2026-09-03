'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Printer } from 'lucide-react';

interface TokenDisplayProps {
  tokenNumber: string;
  onComplete: () => void;
}

export function TokenDisplay({ tokenNumber, onComplete }: TokenDisplayProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setShowSuccess(true);
    // Auto-return to idle after 30 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 30000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center">
        {/* Success Animation */}
        <div className={`mb-8 transition-all duration-500 ${showSuccess ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Check-in Complete!
          </h2>
          <p className="text-xl text-gray-600">
            Your information has been compiled successfully
          </p>
        </div>

        {/* Token Number */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-12 mb-8 border-4 border-blue-200">
          <div className="text-blue-600 text-sm font-semibold uppercase tracking-wide mb-2">
            Your Token Number
          </div>
          <div className="text-7xl font-bold text-blue-900 tracking-wider">
            {tokenNumber}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-8 text-left bg-gray-50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              1
            </div>
            <p className="text-gray-700 text-lg">
              Please wait in the waiting area
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              2
            </div>
            <p className="text-gray-700 text-lg">
              Your token will be called on the display board
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              3
            </div>
            <p className="text-gray-700 text-lg">
              Present this token to the doctor when called
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button variant="outline" size="lg" onClick={handlePrint}>
            <Printer className="w-5 h-5 mr-2" />
            Print Token
          </Button>
          <Button size="lg" onClick={onComplete}>
            Done
          </Button>
        </div>

        {/* Auto-return notice */}
        <p className="text-sm text-gray-500 mt-6">
          This screen will automatically reset in 30 seconds
        </p>
      </div>
    </div>
  );
}
