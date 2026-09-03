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
      
      // Combine previous final transcripts with current (if we want continuous updates)
      // For simplicity here, we can just set what comes back.
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

  const handleSubmitAnswer = async () => {
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
        transcript: currentTranscript || 'General symptoms',
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
      {apiError && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{apiError}</span>
          <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setApiError(null)}>
            <span className="sr-only">Close</span>
            &times;
          </button>
        </div>
      )}

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
          question={currentQuestion || 'Please describe your symptoms'}
          transcript={currentTranscript || ''}
          isListening={isListening}
          progressPercent={progressPercent}
          onToggleListening={handleToggleListening}
          onRepeat={() => speakQuestion(currentQuestion || 'Please describe your symptoms')}
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
