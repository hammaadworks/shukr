import dictionary from './data/dictionary.json';

export interface TranslationMap {
  [key: string]: string;
}

export interface TranslationResult {
  en: string;
  ur: string;
  roman: string;
}

/**
 * A local-first translator that maps English words/phrases to Urdu script.
 * Uses a hybrid approach: AppConfig (Truth) + Offline Dictionary (Fallback) + Transliteration (Last resort)
 */
class Translator {
  private enToUr: TranslationMap = {};
  private urToEn: TranslationMap = {};
  private idToRoman: TranslationMap = {};

  constructor() {
    this.hydrateFromDictionary();
  }

  private hydrateFromDictionary() {
    Object.entries(dictionary).forEach(([en, ur]) => {
      this.enToUr[en.toLowerCase()] = ur;
      this.urToEn[ur] = en;
    });
  }

  /**
   * Refreshes the internal lookup maps from a given application configuration.
   */
  refresh(config: any) {
    // Reset to dictionary base
    this.enToUr = {};
    this.urToEn = {};
    this.idToRoman = {};
    this.hydrateFromDictionary();

    if (!config || !config.categories) return;

    config.categories.forEach((cat: any) => {
      this.processCategory(cat);
    });
    
    if (config.quick_actions) this.processQuickActions(config.quick_actions);
    if (config.quotes) this.processQuotes(config.quotes);
  }

  private processCategory(cat: any) {
    const catEn = (cat.label_en || cat.en || '').toLowerCase().trim();
    const catUr = (cat.label_ur || cat.ur || '').trim();
    
    if (catEn && catUr) {
      this.enToUr[catEn] = catUr;
      this.urToEn[catUr] = catEn;
    }

    if (cat.items) {
      cat.items.forEach((item: any) => {
        const en = (item.en || '').toLowerCase().trim();
        const ur = (item.ur || '').trim();
        const roman = (item.roman || item.id || '').toLowerCase().trim();
        
        if (en && ur) {
          this.enToUr[en] = ur;
          this.urToEn[ur] = en;
        }
        
        if (roman && ur) {
          if (!this.enToUr[roman]) this.enToUr[roman] = ur;
          if (!this.urToEn[ur]) this.urToEn[ur] = roman;
          this.idToRoman[item.id] = roman;
        }
      });
    }
  }

  private processQuickActions(actions: any[]) {
    actions.forEach((qa: any) => {
      const en = (qa.en || '').toLowerCase().trim();
      const ur = (qa.ur || '').trim();
      if (en && ur) {
        this.enToUr[en] = ur;
        this.urToEn[ur] = en;
      }
    });
  }

  private processQuotes(quotes: any[]) {
    quotes.forEach((q: any) => {
      const en = (q.en || '').toLowerCase().trim();
      const ur = (q.ur || '').trim();
      if (en && ur) {
        this.enToUr[en] = ur;
        this.urToEn[ur] = en;
      }
    });
  }

  // Phonetic Transliteration Map (Roman Urdu to script)
  private translitMap: [RegExp, string][] = [
    [/sh/gi, 'ش'], [/kh/gi, 'خ'], [/gh/gi, 'غ'], [/ch/gi, 'چ'], [/th/gi, 'تھ'],
    [/ph/gi, 'پھ'], [/bh/gi, 'بھ'], [/dh/gi, 'دھ'], [/jh/gi, 'جھ'], [/rh/gi, 'ڑھ'],
    [/aa/gi, 'آ'], [/ee/gi, 'ی'], [/oo/gi, 'و'], [/ai/gi, 'ئے'], [/au/gi, 'و'],
    [/a/gi, 'ا'], [/b/gi, 'ب'], [/p/gi, 'پ'], [/t/gi, 'ت'], [/j/gi, 'ج'],
    [/d/gi, 'د'], [/r/gi, 'ر'], [/z/gi, 'ز'], [/s/gi, 'س'], [/f/gi, 'ف'],
    [/k/gi, 'ک'], [/g/gi, 'گ'], [/l/gi, 'ل'], [/m/gi, 'م'], [/n/gi, 'ن'],
    [/v/gi, 'و'], [/w/gi, 'و'], [/h/gi, 'ہ'], [/y/gi, 'ی'], [/q/gi, 'ق'],
    [/x/gi, 'ژ'], [/c/gi, 'ک'], [/i/gi, 'ی'], [/u/gi, 'و'], [/e/gi, 'ے']
  ];

  transliterate(roman: string): string {
    let result = roman;
    this.translitMap.forEach(([regex, replacement]) => {
      result = result.replace(regex, replacement);
    });
    return result;
  }

  async translate(text: string): Promise<TranslationResult | null> {
    const clean = text.toLowerCase().trim();
    if (!clean) return null;

    const ur = this.enToUr[clean];
    if (ur) {
      return { en: text, ur, roman: this.urToEn[ur] || clean };
    }

    const en = this.urToEn[text.trim()];
    if (en) {
      return { en: en.charAt(0).toUpperCase() + en.slice(1), ur: text.trim(), roman: clean };
    }

    const isUrduScript = /[\u0600-\u06FF]/.test(text);
    if (isUrduScript) {
      return { en: text, ur: text, roman: '' };
    } else {
      return { en: text.charAt(0).toUpperCase() + text.slice(1), ur: this.transliterate(clean), roman: clean };
    }
  }

  translateEnToUr(en: string): string | null {
    return this.enToUr[en.toLowerCase().trim()] || null;
  }

  translateUrToEn(ur: string): string | null {
    const en = this.urToEn[ur.trim()];
    if (!en) return null;
    return en.length > 2 ? en.charAt(0).toUpperCase() + en.slice(1) : en;
  }
}

export const translator = new Translator();
