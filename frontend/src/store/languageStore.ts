import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AgriNitiLanguage = 'en' | 'hi' | 'mr' | 'kn' | 'ta' | 'te' | 'ml';

interface LanguageState {
  selectedLanguage: AgriNitiLanguage;
  setLanguage: (lang: AgriNitiLanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      selectedLanguage: 'en',
      setLanguage: (lang) => set({ selectedLanguage: lang })
    }),
    {
      name: 'language-storage',
    }
  )
);

