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
 * A local-first translator that maps between Primary and Secondary language pairs.
 * Uses a hybrid approach: AppConfig (Truth) + Offline Dictionary (Fallback)
 */
class Translator {
  private primaryToSecondary: TranslationMap = {};
  private secondaryToPrimary: TranslationMap = {};
  private idToRoman: TranslationMap = {};

  constructor() {
    this.hydrateFromDictionary();
  }

  private hydrateFromDictionary() {
    Object.entries(dictionary).forEach(([en, ur]) => {
      this.primaryToSecondary[en.toLowerCase()] = ur;
      this.secondaryToPrimary[ur] = en;
    });
  }

  /**
   * Refreshes the internal lookup maps from a given application configuration.
   */
  refresh(config: any) {
    // Reset to dictionary base
    this.primaryToSecondary = {};
    this.secondaryToPrimary = {};
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
    const catPrimary = (cat.label_primary || cat.label_ur || cat.en || '').toLowerCase().trim();
    const catSecondary = (cat.label_secondary || cat.label_en || cat.ur || '').trim();
    
    if (catPrimary && catSecondary) {
      this.primaryToSecondary[catPrimary] = catSecondary;
      this.secondaryToPrimary[catSecondary] = catPrimary;
    }

    if (cat.items) {
      cat.items.forEach((item: any) => {
        const primary = (item.text_primary || item.ur || '').toLowerCase().trim();
        const secondary = (item.text_secondary || item.en || '').trim();
        const roman = (item.roman || item.id || '').toLowerCase().trim();
        
        if (primary && secondary) {
          this.primaryToSecondary[primary] = secondary;
          this.secondaryToPrimary[secondary] = primary;
        }
        
        if (roman && primary) {
          if (!this.primaryToSecondary[roman]) this.primaryToSecondary[roman] = primary;
          if (!this.secondaryToPrimary[primary]) this.secondaryToPrimary[primary] = roman;
          this.idToRoman[item.id] = roman;
        }
      });
    }
  }

  private processQuickActions(actions: any[]) {
    actions.forEach((qa: any) => {
      const primary = (qa.text_primary || qa.ur || '').toLowerCase().trim();
      const secondary = (qa.text_secondary || qa.en || '').trim();
      if (primary && secondary) {
        this.primaryToSecondary[primary] = secondary;
        this.secondaryToPrimary[secondary] = primary;
      }
    });
  }

  private processQuotes(quotes: any[]) {
    quotes.forEach((q: any) => {
      const primary = (q.text_primary || q.ur || '').toLowerCase().trim();
      const secondary = (q.text_secondary || q.en || '').trim();
      if (primary && secondary) {
        this.primaryToSecondary[primary] = secondary;
        this.secondaryToPrimary[secondary] = primary;
      }
    });
  }

  /**
   * Translates text by looking up in dictionaries or applying phonetics.
   */
  async translate(text: string): Promise<TranslationResult | null> {
    const clean = text.toLowerCase().trim();
    if (!clean) return null;

    const secondary = this.primaryToSecondary[clean];
    if (secondary) {
      return { en: text, ur: secondary, roman: clean };
    }

    const primary = this.secondaryToPrimary[text.trim()];
    if (primary) {
      return { en: primary.charAt(0).toUpperCase() + primary.slice(1), ur: text.trim(), roman: clean };
    }

    // Language-aware transliteration
    const isUrduScript = /[\u0600-\u06FF]/.test(text);
    const isLatinScript = /^[a-z0-9\s.,!?-]+$/i.test(text);

    if (isUrduScript) {
      return { en: text, ur: text, roman: '' };
    } else if (isLatinScript) {
      // Don't force Urdu transliteration on Latin scripts (Spanish, English)
      return { 
        en: text.charAt(0).toUpperCase() + text.slice(1), 
        ur: text, 
        roman: text 
      };
    } else {
      // Fallback
      return { 
        en: text.charAt(0).toUpperCase() + text.slice(1), 
        ur: this.transliterate(clean), 
        roman: clean 
      };
    }
  }

  translatePrimaryToSecondary(primary: string): string | null {
    return this.primaryToSecondary[primary.toLowerCase().trim()] || null;
  }

  translateSecondaryToPrimary(secondary: string): string | null {
    const primary = this.secondaryToPrimary[secondary.trim()];
    if (!primary) return null;
    return primary.length > 2 ? primary.charAt(0).toUpperCase() + primary.slice(1) : primary;
  }

  private transliterate(romanUrdu: string): string {
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
