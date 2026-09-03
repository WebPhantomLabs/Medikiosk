import { create } from 'zustand';

interface KioskSettings {
  language: string;
  theme: 'light' | 'dark' | 'high-contrast';
  textSize: 'small' | 'medium' | 'large';
  volume: number;
}

interface KioskState {
  sessionId: string | null;
  kioskId: string | null;
  branch: 'allopathy' | 'ayurveda' | null;
  currentNodeId: string | null;
  tokenNumber: string | null;
  settings: KioskSettings;
  isListening: boolean;
  currentQuestion: string | null;
  currentTranscript: string | null;
  progressPercent: number;
  
  setSessionId: (id: string) => void;
  setKioskId: (id: string) => void;
  setBranch: (branch: 'allopathy' | 'ayurveda') => void;
  setCurrentNodeId: (id: string | null) => void;
  setTokenNumber: (token: string) => void;
  updateSettings: (settings: Partial<KioskSettings>) => void;
  setIsListening: (listening: boolean) => void;
  setCurrentQuestion: (question: string | null) => void;
  setCurrentTranscript: (transcript: string | null) => void;
  setProgressPercent: (percent: number) => void;
  reset: () => void;
}

const defaultSettings: KioskSettings = {
  language: 'hi',
  theme: 'light',
  textSize: 'medium',
  volume: 70,
};

export const useKioskStore = create<KioskState>((set) => ({
  sessionId: null,
  kioskId: null,
  branch: null,
  currentNodeId: null,
  tokenNumber: null,
  settings: defaultSettings,
  isListening: false,
  currentQuestion: null,
  currentTranscript: null,
  progressPercent: 0,
  
  setSessionId: (id) => set({ sessionId: id }),
  setKioskId: (id) => set({ kioskId: id }),
  setBranch: (branch) => set({ branch }),
  setCurrentNodeId: (id) => set({ currentNodeId: id }),
  setTokenNumber: (token) => set({ tokenNumber: token }),
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
  setIsListening: (listening) => set({ isListening: listening }),
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setCurrentTranscript: (transcript) => set({ currentTranscript: transcript }),
  setProgressPercent: (percent) => set({ progressPercent: percent }),
  reset: () =>
    set({
      sessionId: null,
      currentNodeId: null,
      tokenNumber: null,
      settings: defaultSettings,
      isListening: false,
      currentQuestion: null,
      currentTranscript: null,
      progressPercent: 0,
    }),
}));
