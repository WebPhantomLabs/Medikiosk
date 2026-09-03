'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Check, Upload } from 'lucide-react';

interface DocumentCaptureProps {
  onCapture: (file: File) => void;
  onSkip: () => void;
  isProcessing?: boolean;
}

export function DocumentCapture({ onCapture, onSkip, isProcessing }: DocumentCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          currentStream = stream;
          setStreamActive(true);
        }
      } catch (err) {
        console.warn('Camera access denied or unavailable', err);
        setStreamActive(false);
      }
    }

    if (!previewMode) {
      setupCamera();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [previewMode]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
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
        setCapturedImage(dataUrl);
        
        // Convert data URL to File object
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
    setPreviewMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-4xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Your Medical Documents
          </h2>
          <p className="text-xl text-gray-600">
            Please scan or upload any previous prescriptions or medical reports
          </p>
        </div>

        {/* Camera/Upload Area */}
        <div className="mb-8 flex flex-col items-center">
          {!previewMode ? (
            <div className="relative bg-black rounded-2xl overflow-hidden w-full max-w-2xl aspect-video flex flex-col items-center justify-center border-4 border-gray-300">
              {streamActive ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-6 flex gap-4">
                    <Button 
                      size="lg" 
                      onClick={handleCapturePhoto}
                      className="rounded-full shadow-lg"
                    >
                      <Camera className="w-6 h-6 mr-2" />
                      Capture Photo
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full shadow-lg"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload File
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 text-white">
                  <Camera className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl mb-6">
                    Camera not available. Please upload a file.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload File
                  </Button>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden w-full max-w-2xl">
              <img
                src={capturedImage || ''}
                alt="Captured document"
                className="w-full h-auto"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          {!previewMode ? (
            <Button variant="outline" size="lg" onClick={onSkip}>
              Skip for Now
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={handleRetake}
                disabled={isProcessing}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Retake
              </Button>
              <Button
                size="lg"
                onClick={handleConfirm}
                disabled={isProcessing}
                className="px-12"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Looks Good
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Info Text */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>✓ Supported formats: JPG, PNG, PDF</p>
          <p>✓ Your documents are encrypted and secure</p>
        </div>
      </div>
    </div>
  );
}
