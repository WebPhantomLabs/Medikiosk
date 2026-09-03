'use client';

import { useState, useRef } from 'react';
import { IdleScreen } from '@/components/kiosk/idle-screen';
import { LanguageSelector } from '@/components/kiosk/language-selector';
import { DemographicsForm, DemographicsData } from '@/components/kiosk/demographics-form';
import { VoiceIntake } from '@/components/kiosk/voice-intake';
import { DocumentCapture } from '@/components/kiosk/document-capture';
import { TokenDisplay } from '@/components/kiosk/token-display';
import { SettingsModal } from '@/components/kiosk/setting-modal';
import { SupportModal } from '@/components/kiosk/support-modal';
import { useKioskStore } from '@/store/kiosk-store';
import { sessions, intake, documents } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

type KioskStep = 'idle' | 'language' | 'demographics' | 'intake' | 'documents' | 'token';

export default function KioskPage() {
  const [step, setStep] = useState<KioskStep>('idle');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Speech recognition ref to persist between renders
  const recognitionRef = useRef<any>(null);

  const {
    sessionId,
    currentNodeId,
    tokenNumber,
    settings,
    isListening,
    currentQuestion,
    currentTranscript,
    progressPercent,
    setSessionId,
    setKioskId,
    setCurrentNodeId,
    setTokenNumber,
    updateSettings,
    setIsListening,
    setCurrentQuestion,
    setCurrentTranscript,
    setProgressPercent,
    reset,
  } = useKioskStore();

  const handleStart = () => {
    reset();
    setApiError(null);
    setStep('language');
  };

  const handleSelectLanguage = (langCode: string) => {
    updateSettings({ language: langCode });
  };

  const handleLanguageContinue = () => {
    setStep('demographics');
  };

  const handleDemographicsContinue = async (patientData: DemographicsData) => {
    setIsCreatingSession(true);
    setApiError(null);
    try {
      const res = await sessions.create({
        kiosk_code: 'KIOSK-MAIN-01',
        patient: {
          full_name: patientData.full_name,
          sex: patientData.sex.toLowerCase() as any,
          date_of_birth: patientData.date_of_birth,
          phone: patientData.phone,
        },
      });
      const sessionData = res.data;
      setSessionId(sessionData.id);
      setKioskId(sessionData.kiosk_id);

      if (sessionData.current_question) {
        setCurrentNodeId(sessionData.current_question.node_id);
        setCurrentQuestion(sessionData.current_question.question_text);
      } else {
        setCurrentNodeId('CHIEF_COMPLAINT');
        setCurrentQuestion('What is the main reason for your visit today?');
      }

      setProgressPercent(20);
      setStep('intake');
      
      // Auto-read first question
      speakQuestion(sessionData.current_question?.question_text || 'What is the main reason for your visit today?');
    } catch (err) {
      console.error('Failed to create session:', err);
      setApiError('Failed to start session. Please try again or ask for assistance.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Map basic language codes to more specific ones if needed, or use directly
      const langMap: Record<string, string> = {
        'hi': 'hi-IN',
        'en': 'en-IN',
        'ta': 'ta-IN',
        'mr': 'mr-IN',
      };
      utterance.lang = langMap[settings.language] || 'en-US';
      utterance.volume = settings.volume / 100;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    // Start listening
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your answer.");
      return;
    }

    const recognition = new SpeechRecognition();
    
    const langMap: Record<string, string> = {
      'hi': 'hi-IN',
      'en': 'en-IN',
      'ta': 'ta-IN',
      'mr': 'mr-IN',
    };
    recognition.lang = langMap[settings.language] || 'en-US';
    
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      setCurrentTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      setIsListening(true);
      setCurrentTranscript(''); // clear previous transcript
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSubmitAnswer = async (finalTranscript?: string) => {
    if (!sessionId || !currentNodeId) return;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    setApiError(null);

    try {
      const res = await intake.submitAnswer({
        session_id: sessionId,
        node_id: currentNodeId,
        transcript: finalTranscript || currentTranscript || 'General symptoms',
      });
      const data = res.data;

      if (data.queue_token) {
        setTokenNumber(data.queue_token);
      }

      if (data.is_complete || !data.next_question) {
        setProgressPercent(80);
        setStep('documents');
      } else {
        setCurrentNodeId(data.next_question.node_id);
        setCurrentQuestion(data.next_question.question_text);
        setCurrentTranscript('');
        setProgressPercent(Math.min(progressPercent + 30, 80));
        
        // Auto-read next question
        speakQuestion(data.next_question.question_text);
      }
    } catch (err) {
      console.error('Failed to submit intake answer:', err);
      setApiError('Failed to submit answer. Please try again.');
    }
  };

  const handleDocumentCapture = async (file: File) => {
    if (!sessionId) {
      setStep('token');
      return;
    }

    setIsUploadingDoc(true);
    setApiError(null);
    try {
      await documents.uploadPrescription(sessionId, file);
      setProgressPercent(100);
      setStep('token');
    } catch (err) {
      console.error('Document upload error:', err);
      setApiError('Failed to upload document. You can skip for now.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSkipDocuments = () => {
    setProgressPercent(100);
    setStep('token');
  };

  const handleComplete = () => {
    reset();
    setStep('idle');
  };

  return (
    <>
      <AnimatePresence>
        {apiError && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            role="alert"
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-red-50 border-2 border-red-500 text-red-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-xl w-full"
          >
            <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <span className="block sm:inline text-xl font-medium">{apiError}</span>
            <button 
              className="ml-auto p-2 hover:bg-red-100 rounded-full transition-colors"
              onClick={() => setApiError(null)}
              aria-label="Close error message"
            >
              <X className="w-6 h-6 text-red-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative overflow-hidden w-full h-full min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full absolute inset-0"
          >
            {step === 'idle' && (
              <IdleScreen
                onStart={handleStart}
                onSettings={() => setIsSettingsOpen(true)}
                onSupport={() => setIsSupportOpen(true)}
              />
            )}

            {step === 'language' && (
              <LanguageSelector
                selectedLanguage={settings.language}
                onSelectLanguage={handleSelectLanguage}
                onContinue={handleLanguageContinue}
              />
            )}
            
            {step === 'demographics' && (
              <DemographicsForm
                onContinue={handleDemographicsContinue}
                onBack={() => setStep('language')}
                isProcessing={isCreatingSession}
              />
            )}

            {step === 'intake' && (
              <VoiceIntake
                key={currentNodeId || 'intake'}
                question={currentQuestion || 'Please describe your symptoms'}
                transcript={currentTranscript || ''}
                isListening={isListening}
                progressPercent={progressPercent}
                onToggleListening={handleToggleListening}
                onBack={() => setStep('demographics')}
                onSubmit={handleSubmitAnswer}
              />
            )}

            {step === 'documents' && (
              <DocumentCapture
                onCapture={handleDocumentCapture}
                onSkip={handleSkipDocuments}
                isProcessing={isUploadingDoc}
              />
            )}

            {step === 'token' && (
              <TokenDisplay
                tokenNumber={tokenNumber || 'Unknown'}
                onComplete={handleComplete}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </>
  );
}
