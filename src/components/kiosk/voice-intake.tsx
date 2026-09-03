'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, RotateCcw, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceIntakeProps {
  question: string;
  transcript: string;
  isListening: boolean;
  progressPercent: number;
  onToggleListening: () => void;
  onRepeat: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function VoiceIntake({
  question,
  transcript,
  isListening,
  progressPercent,
  onToggleListening,
  onRepeat,
  onBack,
  onSubmit,
}: VoiceIntakeProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (isListening) {
      setPulseAnimation(true);
    } else {
      setPulseAnimation(false);
    }
  }, [isListening]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col p-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Progress</span>
          <span className="text-sm font-medium text-gray-600">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full h-3 bg-white rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-12">
        {/* Question Display */}
        <div className="bg-white rounded-3xl shadow-xl p-12 max-w-3xl w-full">
          <div className="text-blue-600 text-sm font-semibold uppercase tracking-wide mb-4 text-center">
            AI Assistant Asks
          </div>
          <h2 className="text-3xl font-bold text-gray-900 text-center leading-relaxed">
            {question}
          </h2>
        </div>

        {/* Microphone Button */}
        <div className="relative">
          <button
            onClick={onToggleListening}
            className={cn(
              'w-32 h-32 rounded-full transition-all duration-300 flex items-center justify-center shadow-2xl',
              isListening
                ? 'bg-red-500 hover:bg-red-600 scale-110'
                : 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            {isListening ? (
              <MicOff className="w-16 h-16 text-white" />
            ) : (
              <Mic className="w-16 h-16 text-white" />
            )}
          </button>

          {/* Pulse Animation */}
          {pulseAnimation && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
              <div className="absolute inset-0 rounded-full bg-red-400 animate-pulse opacity-50" />
            </>
          )}
        </div>

        <p className="text-xl text-gray-600 font-medium">
          {isListening ? 'Listening... Tap to stop' : 'Tap to speak'}
        </p>

        {/* Transcript Display */}
        {transcript && (
          <div className="bg-gray-50 rounded-2xl shadow-lg p-8 max-w-3xl w-full border-2 border-blue-200">
            <div className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-3">
              You Said
            </div>
            <p className="text-2xl text-gray-900 leading-relaxed">{transcript}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-6">
          <Button variant="outline" size="lg" onClick={onBack}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          
          <Button variant="outline" size="lg" onClick={onRepeat}>
            <RotateCcw className="w-5 h-5 mr-2" />
            Repeat Question
          </Button>

          {transcript && (
            <Button size="lg" onClick={onSubmit}>
              Submit Answer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
