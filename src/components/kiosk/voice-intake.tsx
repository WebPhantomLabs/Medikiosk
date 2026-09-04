'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Keyboard, ChevronRight, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceIntakeProps {
  question: string;
  transcript: string;
  isListening: boolean;
  isProcessing?: boolean;
  progressPercent: number;
  onToggleListening: () => void;
  onBack: () => void;
  onSubmit: (transcript: string) => void;
}

export function VoiceIntake({
  question,
  transcript,
  isListening,
  isProcessing = false,
  progressPercent,
  onToggleListening,
  onSubmit,
  onBack,
}: VoiceIntakeProps) {
  const [fallbackInput, setFallbackInput] = useState(false);
  const [typedTranscript, setTypedTranscript] = useState('');

  // Use typed input if fallback is active, otherwise use the voice transcript
  const activeTranscript = fallbackInput ? typedTranscript : transcript;
  
  // Initialize typed input when switching to fallback mode
  const handleEnableTyping = () => {
    setTypedTranscript(transcript);
    setFallbackInput(true);
  };

  const handleContinue = () => {
    onSubmit(activeTranscript);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--mk-bg)]">
      
      {/* Top Header / Progress */}
      <div className="flex-shrink-0 w-full flex items-center justify-between px-6 py-4 border-b border-[var(--mk-border)] bg-[var(--mk-bg)] z-10">
        <button 
          onClick={onBack}
          disabled={isProcessing}
          className="flex items-center text-[var(--mk-text-secondary)] hover:text-[var(--mk-text)] transition-colors text-lg font-medium p-2 disabled:opacity-50"
        >
          <CornerDownLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <div className="text-xl font-medium tracking-wide text-[var(--mk-text-secondary)] pr-4">
          Question {Math.round(progressPercent / 10) || 1}
        </div>
      </div>

      {/* Main Question Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto w-full flex flex-col items-center justify-start py-8 px-6 space-y-12">
        <h2 className="text-4xl md:text-5xl font-bold text-[var(--mk-text)] text-center leading-tight tracking-tight max-w-4xl">
          {question}
        </h2>

        {/* Unified Microphone / AI Indicator */}
        <div className="relative flex flex-col items-center justify-center space-y-4">
          <button
            onClick={onToggleListening}
            disabled={isProcessing}
            aria-pressed={isListening}
            className={cn(
              'w-24 h-24 rounded-full transition-all duration-300 flex items-center justify-center shadow-md relative z-20',
              isListening
                ? 'bg-red-500 scale-105'
                : 'bg-[var(--mk-primary)] hover:scale-105 hover:shadow-lg disabled:opacity-50'
            )}
          >
            {isListening ? (
              <MicOff className="w-10 h-10 text-white" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>

          {/* Subtle Ring Animation */}
          <AnimatePresence>
            {(isListening || isProcessing) && (
              <motion.div
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0.15 }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className={`absolute top-0 w-24 h-24 rounded-full pointer-events-none z-10 ${isProcessing ? 'bg-blue-500' : 'bg-red-500'}`}
              />
            )}
          </AnimatePresence>

          <p className="text-xl text-[var(--mk-text-secondary)] font-medium h-8 flex items-center">
            {isProcessing ? 'Processing...' : isListening ? 'Listening...' : 'Tap to speak'}
          </p>
        </div>

        {/* Transcript / Input Area */}
        <div className="w-full max-w-3xl flex flex-col items-center justify-center">
          {fallbackInput ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <textarea 
                value={typedTranscript}
                onChange={(e) => setTypedTranscript(e.target.value)}
                disabled={isProcessing}
                placeholder="Type your answer here..."
                autoFocus
                className="w-full h-32 p-6 text-2xl bg-[var(--mk-surface)] border border-[var(--mk-border-strong)] text-[var(--mk-text)] rounded-2xl focus:border-[var(--mk-primary)] focus:ring-1 focus:ring-[var(--mk-primary)] outline-none shadow-sm resize-none disabled:opacity-50"
              />
            </motion.div>
          ) : (
            activeTranscript && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="w-full text-center"
              >
                <p className="text-3xl text-[var(--mk-text)] leading-relaxed font-medium bg-[var(--mk-surface)] border border-[var(--mk-border)] py-6 px-8 rounded-2xl shadow-sm">
                  &quot;{activeTranscript}&quot;
                </p>
              </motion.div>
            )
          )}
        </div>
      </div>

      {/* Bottom Actions - Sticky Footer */}
      <div className="flex-shrink-0 w-full flex flex-col items-center p-6 bg-[var(--mk-bg)] border-t border-[var(--mk-border)] z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Button 
          size="kiosk"
          onClick={handleContinue}
          disabled={!activeTranscript || isProcessing}
          className="w-full max-w-md shadow-xl min-h-[64px] text-[26px] rounded-2xl"
          style={{ 
            backgroundColor: activeTranscript && !isProcessing ? 'var(--mk-primary)' : 'var(--mk-surface-muted)',
            color: activeTranscript && !isProcessing ? 'var(--mk-text-inverse)' : 'var(--mk-text-muted)'
          }}
        >
          {isProcessing ? 'Processing...' : (
            <>Continue <ChevronRight className="w-8 h-8 ml-2" /></>
          )}
        </Button>
        
        {!fallbackInput && (
          <button 
            onClick={handleEnableTyping}
            disabled={isProcessing}
            className="flex items-center text-lg text-[var(--mk-text-secondary)] hover:text-[var(--mk-primary)] transition-colors py-3 px-6 mt-2 font-medium disabled:opacity-50"
          >
            <Keyboard className="w-5 h-5 mr-2" />
            Type instead
          </button>
        )}
      </div>
    </div>
  );
}
