import { create } from 'zustand';

export type AgriNitiLanguage = 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'ml';

interface LanguageState {
  selectedLanguage: AgriNitiLanguage;
  setLanguage: (lang: AgriNitiLanguage) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  selectedLanguage: 'en',
  setLanguage: (lang) => set({ selectedLanguage: lang })
}));

