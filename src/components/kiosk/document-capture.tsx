/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Stethoscope, RotateCcw, FileWarning, Video, Image as ImageIcon, AlertCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentCaptureProps {
  onCapture: (file: File) => void;
  onSkip: () => void;
  isProcessing: boolean;
}

type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'not_found' | 'busy' | 'unsupported';

export function DocumentCapture({ onCapture, onSkip, isProcessing }: DocumentCaptureProps) {
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = async () => {
    setFileError(null);
    stopCamera();
    
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unsupported');
      return;
    }

    setCameraStatus('requesting');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStatus('active');
      } else {
        stopCamera();
      }
    } catch (err: any) {
      console.warn('Camera error:', err.name);
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        setCameraStatus('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
        setCameraStatus('not_found');
      } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
        setCameraStatus('busy');
      } else {
        setCameraStatus('busy');
      }
    }
  };

  useEffect(() => {
    if (!previewMode && cameraStatus === 'idle') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [previewMode, stopCamera]);


  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      } else if (!previewMode && (cameraStatus === 'active' || cameraStatus === 'idle')) {
        startCamera();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [previewMode, cameraStatus, stopCamera]);

  const validateFile = (modelFile: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(modelFile.type)) {
      setFileError("That file type isn't supported. Please upload a JPG or PNG image.");
      return false;
    }
    if (modelFile.size > 15 * 1024 * 1024) {
      setFileError("File is too large. Please keep it under 15MB.");
      return false;
    }
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFile(file)) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        stopCamera();
        setCapturedImage(reader.result as string);
        setCapturedFile(file);
        setPreviewMode(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        
        stopCamera();
        setCapturedImage(dataUrl);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured_document.jpg', { type: 'image/jpeg' });
            setCapturedFile(file);
          }
        }, 'image/jpeg');
        
        setPreviewMode(true);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedFile) {
      onCapture(capturedFile);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setFileError(null);
    setPreviewMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setCameraStatus('idle');
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--mk-bg)]">
      
      <input
        id="file-upload"
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex-shrink-0 w-full flex flex-col items-center justify-center py-4 sm:pu-6 px-4 z-10 bg-[var(--mk-bg)]">
        <Stethoscope className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--mk-primary)] mb-2" />
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--mk-text)] text-center tracking-tight">
          Scan your prescription
        </h2>
         {!previewMode && (
          <p className="text-base sm:text-lg text-[var(--mk-text-secondary)] text-center mt-1 sm:mt-2">
            Please align your document within the frame.
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center px-4 overflow-hidden relative pb-4">
        
        <AnimatePresence>
          {fileError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              role="alert"
              className="absolute top-0 z-50 bg-red-50 border-2 border-red-500 text-red-900 px-4 py-3 rounded-xl shadow-lg z-50 flex items-center max-w-sm w-full mx-auto"
            >
              <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0 text-red-500" />
              <span className="text-sm font-medium">{fileError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {!previewMode ? (
          <div className="relative bg-[var(--mk-surface-muted)] rounded-2xl sm:rounded-[2rem] overflow-hidden w-full max-w-sm h-full max-h-[600px] flex flex-col border-[4px] sm:border-[6px] border-[var(--mk-border)] shadow-xl shrink min-h-[300px]">
            
            {(cameraStatus === 'active' || cameraStatus === 'requesting') ? (
              <>
                {cameraStatus === 'active' && (
                  <>
                    <div className="absolute top-4 left-4 sm:top-6 sm:left-6 w-10 h-10 sm:w-12 sm:h-12 border-t-4 border-l-4 sm:border-t-8 sm:border-l-8 border-white opacity-80 z-10 rounded-tl-lg"></div>
                    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 border-t-4 border-r-4 sm:border-t-8 sm:border-r-8 border-white opacity-80 z-10 rounded-tr-lg"></div>
                    <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 w-10 h-10 sm:w-12 sm:h-12 border-b-4 border-l-4 sm:border-b-8 sm:border-l-8 border-white opacity-80 z-10 rounded-bl-lg"></div>
                    <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 border-b-4 border-r-4 sm:border-b-8 sm:border-r-8 border-white opacity-80 z-10 rounded-br-lg"></div>
                  </>
                )}

                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className={`w-full h-full object-cover ${cameraStatus === 'requesting' ? 'hidden' : ''}`}
                />

                {cameraStatus === 'requesting' && (
                  <div className="absolute inset-0 text-center p-6 text-[var(--mk-text)] flex flex-col items-center justify-center h-full bg-[var(--mk-surface-muted)] z-20">
                    <div className="w-12 h-12 border-4 border-[var(--mk-primary)] border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-lg font-medium">Starting camera...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-6 text-[var(--mk-text)] flex flex-col items-center justify-center h-full">
                 {cameraStatus === 'denied' && (
                  <>
                    <Video className="w-16 h-16 text-[var(--mk-text-secondary)] mx-auto mb-4" />
                    <p className="text-2xl font-bold mb-2">Camera access is blocked.</p>
                    <p className="text-lg text-[var(--mk-text-secondary)] mb-6 max-w-sm">Allow camera access in your browser settings, or upload your prescription instead.</p>
                  </>
                 )}
                 {cameraStatus === 'not_found' && (
                  <>
                    <Camera className="w-16 h-16 text-[var(--mk-text-secondary)] mx-auto mb-4" />
                    <p className="text-2xl font-bold mb-6">No camera was detected.</p>
                  </>
                 )}
                 {cameraStatus === 'busy' && (
                  <>
                    <FileWarning className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <p className="text-2xl font-bold mb-6">The camera is currently unavailable.</p>
                  </>
                 )}
                 {cameraStatus === 'unsupported' && (
                  <>
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-2xl font-bold mb-6">Camera capture isn't supported here.</p>
                  </>
                 )}
              </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div className="relative bg-[var(--mk-surface-muted)] rounded-2xl sm:rounded-[2rem] overflow-hidden w-full max-w-sm h-full max-h-[600px] border-[4px] sm:border-[6px] border-[var(--mk-border)] shadow-xl shrink min-h-[300px]">
            <img
              src={capturedImage || ''}
              alt="Captured document preview"
              className="w-full h-full object-contain bg-black"
            />
            <AnimatePresence>
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <motion.div 
                    initial={{ top: 0 }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 w-full h-2 bg-[var(--mk-primary)] shadow-[0_0_15px_var(--mk-primary)]"
                  />
                  <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-white text-xl font-bold z-20">Reading your prescription...</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 w-full flex flex-col items-center px-4 py-4 sm:py-6 bg-[var(--mk-bg)] border-t border-[var(--mk-border)] z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-6">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 w-full max-w-md">
           {!previewMode ? (
            <>
              {cameraStatus === 'active' ? (
                <>
                  <Button
                    size="kiosk"
                    onClick={handleCapturePhoto}
                    className="w-full shadow-lg h-[64px] text-xl rounded-xl"
                  >
                    <Camera className="w-6 h-6 mr-2" />
                    Capture
                  </Button>
                  <Button
                    size="kiosk"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full shadow-sm h-[64px] text-xl rounded-xl border-2 bg-white text-black hover:bg-gray-100"
                  >
                    <Upload className="w-6 h-6 mr-2" />
                    Upload File
                  </Button>
                </>
              ) : cameraStatus !== 'requesting' ? (
                <>
                  {cameraStatus !== 'unsupported' && cameraStatus !== 'not_found' && (
                    <Button
                      size="kiosk"
                      variant="outline"
                      onClick={() => setCameraStatus('idle')}
                      className="w-full shadow-sm h-[64px] text-xl rounded-xl border-2 bg-white text-black hover:bg-gray-100"
                    >
                      Try Again
                    </Button>
                  )}
                  <Button
                    size="kiosk"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full shadow-lg h-[64px] text-xl rounded-xl"
                  >
                    <Upload className="w-6 h-6 mr-2" />
                    Upload File
                  </Button>
                </>
              ) : null}
            </>
          ) : (
            <>
              <Button
                size="kiosk"
                onClick={handleConfirm}
                disabled={isProcessing}
                className="w-full shadow-lg h-[64px] text-xl rounded-xl"
              >
                {isProcessing ? 'Processing...' : 'Use This'}
              </Button>
              <Button
                size="kiosk"
                variant="outline"
                onClick={handleRetake}
                disabled={isProcessing}
                className="w-full shadow-sm h-[64px] text-xl rounded-xl border-2 bg-white text-black hover:bg-gray-100"
              >
                <RotateCcw className="w-6 h-6 mr-2" />
                Choose Another
              </Button>
            </>
          )}
        </div>
        
        {!previewMode && (cameraStatus === 'active' || cameraStatus === 'denied' || cameraStatus === 'not_found' || cameraStatus === 'busy' || cameraStatus === 'unsupported') && (
          <button 
            onClick={onSkip} 
            className="mt-4 text-sm sm:text-base text-[var(--mk-text-secondary)] hover:text-[var(--mk]ext)] transition-colors font-medium"
          >
            Skip for Now
          </button>
        )}
      </div>
    </div>
  );
}

