import React, { createContext, useContext, useState, useEffect } from 'react';

// Unified Language Code (e.g., 'ur', 'en', 'es')
export type LanguageCode = string;

// The app maintains exactly TWO active languages: Primary (User) and Secondary (Caregiver)
export interface DualLanguagePair {
  primary: LanguageCode;
  secondary: LanguageCode;
  current: LanguageCode;
  isDualMode: boolean;
}

interface LanguageContextType {
  language: LanguageCode; // The currently active language code
  primaryLanguage: LanguageCode;
  secondaryLanguage: LanguageCode;
  isDualMode: boolean;
  setLanguage: (lang: LanguageCode) => void; 
  setLanguagePair: (primary: LanguageCode, secondary: LanguageCode) => void;
  setDualMode: (isDual: boolean) => void;
  isRTL: boolean;
  isPrimary: boolean;
  isSecondary: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper to check if a language is Right-to-Left
const getDirection = (lang: LanguageCode): 'rtl' | 'ltr' => {
  const rtlLangs = ['ur', 'ar', 'fa', 'he', 'sd', 'ps'];
  return rtlLangs.includes(lang.toLowerCase()) ? 'rtl' : 'ltr';
};

export const SUPPORTED_LANGS = [
  { code: 'ur', label: 'Urdu (اردو)' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'ar', label: 'Arabic (العربية)' },
  { code: 'bn', label: 'Bengali (بنگالی)' },
  { code: 'hi', label: 'Hindi (ہندی)' }
];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load the pair configuration from storage or default to Urdu + English
  const [pair, setPair] = useState<DualLanguagePair>(() => {
    const stored = localStorage.getItem('shukr_lang_pair');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.primary === parsed.secondary) {
        parsed.secondary = parsed.primary === 'en' ? 'ur' : 'en';
      }
      if (parsed.isDualMode === undefined) {
        parsed.isDualMode = true;
      }
      return parsed;
    }
    
    // Default: Primary = Urdu, Secondary = English
    const initialPair: DualLanguagePair = {
      primary: 'ur',
      secondary: 'en',
      current: 'ur',
      isDualMode: true
    };
    return initialPair;
  });

  const setLanguage = (lang: LanguageCode) => {
    const newPair = { ...pair, current: lang };
    setPair(newPair);
    localStorage.setItem('shukr_lang_pair', JSON.stringify(newPair));
  };

  const setLanguagePair = (primary: LanguageCode, secondary: LanguageCode) => {
    const newPair: DualLanguagePair = {
      primary,
      secondary,
      current: primary, // Reset to primary when pair changes
      isDualMode: pair.isDualMode
    };
    setPair(newPair);
    localStorage.setItem('shukr_lang_pair', JSON.stringify(newPair));
  };

  const setDualMode = (isDualMode: boolean) => {
    const newPair = { ...pair, isDualMode };
    setPair(newPair);
    localStorage.setItem('shukr_lang_pair', JSON.stringify(newPair));
  };

  useEffect(() => {
    // Update global document attributes based on the current active language
    const dir = getDirection(pair.current);
    document.documentElement.lang = pair.current;
    document.documentElement.dir = dir;
    // Explicitly prevent browser translation for all languages handled by the app
    document.documentElement.setAttribute('translate', 'no');
  }, [pair.current]);

  const isRTL = getDirection(pair.current) === 'rtl';
  const isPrimary = pair.current === pair.primary;
  const isSecondary = pair.current === pair.secondary;

  return (
    <LanguageContext.Provider value={{ 
      language: pair.current, 
      primaryLanguage: pair.primary,
      secondaryLanguage: pair.secondary,
      isDualMode: pair.isDualMode,
      setLanguage, 
      setLanguagePair,
      setDualMode,
      isRTL,
      isPrimary,
      isSecondary
    }}>
      <div className={`lang-${pair.current} dir-${isRTL ? 'rtl' : 'ltr'}`} translate="no">
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
