import enData from './data/i18n/en.json';
import esData from './data/i18n/es.json';
import urData from './data/i18n/ur.json';
import arData from './data/i18n/ar.json';

export interface TranslationResult {
  en: string;
  ur: string;
  roman: string;
}

const STATIC_I18N: Record<string, any> = {
  en: enData,
  es: esData,
  ur: urData,
  ar: arData,
};

class Translator {
  private dynamicWords: Record<string, any> = {};

  constructor() {}

  refresh(config: any) {
    this.dynamicWords = {};
    if (!config || !config.categories) return;

    config.categories.forEach((cat: any) => {
      if (cat.items) {
        cat.items.forEach((item: any) => {
          this.dynamicWords[item.id] = item;
        });
      }
    });
    
    if (config.quotes) {
        config.quotes.forEach((q: any) => {
            this.dynamicWords[q.id] = q;
        });
    }
  }

  getTranslation(id: string, targetLang: string): string {
    // 1. Check dynamic words first
    const dynamic = this.dynamicWords[id];
    if (dynamic) {
      if (dynamic[targetLang]) return dynamic[targetLang];
      if (targetLang === 'ur' && dynamic.ur) return dynamic.ur;
      if (targetLang === 'en' && dynamic.en) return dynamic.en;
      if (dynamic.text_secondary && targetLang === 'en') return dynamic.text_secondary;
      if (dynamic.text_primary && targetLang === 'ur') return dynamic.text_primary;
    }

    // 2. Check static JSON
    const langData = STATIC_I18N[targetLang];
    if (langData && langData.words && langData.words[id]) {
      return langData.words[id];
    }
    
    // 3. Check categories fallback
    if (langData && langData.categories && langData.categories[id]) {
        return langData.categories[id];
    }

    return '';
  }

  getTransliteration(id: string, sourceLang: string, readerLang: string): string {
    // Transliteration is only meaningful across different scripts. If both are latin, return empty.
    const isSourceLatin = ['en', 'es'].includes(sourceLang);
    const isReaderLatin = ['en', 'es'].includes(readerLang);
    
    if (isSourceLatin === isReaderLatin) return '';

    // 1. Check dynamic words first
    const dynamic = this.dynamicWords[id];
    if (dynamic && dynamic.roman && readerLang === 'en') return dynamic.roman;

    // 2. Check static JSON
    const langData = STATIC_I18N[sourceLang];
    if (langData && langData.transliterations && langData.transliterations[id]) {
        return langData.transliterations[id][readerLang] || langData.transliterations[id]['latin'] || '';
    }
    
    // 3. Auto-fallback transliteration for custom words if reader is English and source is Urdu
    if (dynamic && dynamic.ur && readerLang === 'en') {
        return dynamic.roman || ''; 
    }

    return '';
  }

  /**
   * Auto-fill helper for WordEditor. 
   * Returns a best-effort guess for missing fields based on dictionary search and transliteration.
   */
  async translate(text: string, sourceField?: 'primary' | 'secondary' | 'roman'): Promise<TranslationResult | null> {
    const clean = text.toLowerCase().trim();
    if (!clean) return null;

    // We can do a reverse lookup on STATIC_I18N to find the word ID, then return its translations.
    let foundId: string | null = null;
    
    // Try to find exact match in EN or UR dictionaries
    for (const [id, word] of Object.entries(enData.words)) {
        if ((word as string).toLowerCase() === clean) {
            foundId = id;
            break;
        }
    }
    
    if (!foundId) {
        for (const [id, word] of Object.entries(urData.words)) {
            if ((word as string).toLowerCase() === clean) {
                foundId = id;
                break;
            }
        }
    }

    if (foundId) {
        return {
            en: STATIC_I18N['en'].words[foundId] || '',
            ur: STATIC_I18N['ur'].words[foundId] || '',
            roman: STATIC_I18N['ur'].transliterations?.[foundId]?.en || STATIC_I18N['ur'].transliterations?.[foundId]?.es || clean
        };
    }

    // Fallback: Language-aware transliteration fallback for custom words
    const isUrduScript = /[\u0600-\u06FF]/.test(text);

    if (isUrduScript) {
      return { en: text, ur: text, roman: '' };
    } else {
      return { 
        en: text.charAt(0).toUpperCase() + text.slice(1), 
        ur: this.transliteratePhonetically(clean), 
        roman: clean 
      };
    }
  }

  private transliteratePhonetically(romanUrdu: string): string {
    const map: Record<string, string> = {
      'a': 'ا', 'aa': 'آ', 'b': 'ب', 'p': 'پ', 't': 'ت', 'tt': 'ٹ', 's': 'ث', 'j': 'ج', 'ch': 'چ', 'h': 'ح', 'kh': 'خ',
      'd': 'د', 'dd': 'ڈ', 'z': 'ذ', 'r': 'ر', 'rr': 'ڑ', 'zz': 'ز', 'zh': 'ژ', 'sh': 'ش', 'ss': 'ص', 'dz': 'ض',
      'zo': 'ظ', 'ain': 'ع', 'gh': 'غ', 'f': 'ف', 'q': 'ق', 'k': 'ک', 'g': 'گ', 'l': 'ل', 'm': 'م',
      'n': 'ن', 'w': 'و', 'v': 'و', 'o': 'و', 'u': 'و', 'i': 'ی', 'e': 'ی', 'y': 'ی'
    };
    
    let result = '';
    let i = 0;
    while (i < romanUrdu.length) {
      if (i + 1 < romanUrdu.length && map[romanUrdu.substring(i, i + 2)]) {
        result += map[romanUrdu.substring(i, i + 2)];
        i += 2;
      } else if (map[romanUrdu[i]]) {
        result += map[romanUrdu[i]];
        i++;
      } else {
        result += romanUrdu[i];
        i++;
      }
    }
    return result;
  }
}

export const translator = new Translator();
