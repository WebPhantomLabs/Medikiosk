'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, HelpCircle } from 'lucide-react';

const healthTips = [
  'Wash your hands frequently with soap and water',
  'Drink at least 8 glasses of water daily',
  'Get 7-8 hours of sleep every night',
  'Exercise for at least 30 minutes daily',
  'Eat a balanced diet with fruits and vegetables',
  'Regular health check-ups can prevent serious illnesses',
];

interface IdleScreenProps {
  onStart: () => void;
  onSettings: () => void;
  onSupport: () => void;
}

export function IdleScreen({ onStart, onSettings, onSupport }: IdleScreenProps) {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % healthTips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">M</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MediKiosk</h1>
            <p className="text-sm text-gray-600">AI-Powered Clinical Intake</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onSupport}
            className="rounded-full"
          >
            <HelpCircle className="w-6 h-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onSettings}
            className="rounded-full"
          >
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
        {/* Health Tip Carousel */}
        <div className="max-w-2xl text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="text-blue-600 text-sm font-semibold uppercase tracking-wide mb-2">
              Health Tip
            </div>
            <p className="text-xl text-gray-800 leading-relaxed">
              {healthTips[currentTip]}
            </p>
          </div>
          
          {/* Carousel Indicators */}
          <div className="flex justify-center gap-2">
            {healthTips.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentTip ? 'bg-blue-600 w-8' : 'bg-gray-300 w-2'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Start Button */}
        <Button
          size="xl"
          onClick={onStart}
          className="px-20 py-8 text-2xl font-bold shadow-2xl hover:shadow-3xl"
        >
          START
        </Button>

        {/* Instructions */}
        <div className="text-center text-gray-600 max-w-md">
          <p className="text-lg">
            Press <span className="font-semibold">START</span> to begin your health check-in
          </p>
          <p className="text-sm mt-2 text-gray-500">
            The process takes about 5-10 minutes
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-gray-500 text-sm">
        <p>Powered by ABDM | Your health data is secure and private</p>
      </div>
    </div>
  );
}
