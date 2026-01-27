export interface TranslationResult {
  [key: string]: string;
}

class Translator {
  private dynamicWords: Record<string, any> = {};
  private staticVocab: any = null;
  private staticQuotes: any = null;

  constructor() {}

  async init() {
    if (!this.staticVocab) {
      const vocabMod = await import('./data/vocabulary.json');
      this.staticVocab = vocabMod.default || vocabMod;
    }
    if (!this.staticQuotes) {
      const quotesMod = await import('./data/quotes.json');
      this.staticQuotes = quotesMod.default || quotesMod;
    }
  }

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
      if (dynamic.translations && dynamic.translations[targetLang]) return dynamic.translations[targetLang];
      // Legacy support
      if (dynamic[targetLang]) return dynamic[targetLang];
      if (dynamic.text_primary && targetLang === 'ur') return dynamic.text_primary;
      if (dynamic.text_secondary && targetLang === 'en') return dynamic.text_secondary;
    }

    // 2. Check static vocab
    if (this.staticVocab) {
      const word = this.staticVocab.words.find((w: any) => w.id === id);
      if (word && word.translations && word.translations[targetLang]) {
        return word.translations[targetLang];
      }
    }
    
    // 3. Check static quotes
    if (this.staticQuotes) {
      const quote = this.staticQuotes.find((q: any) => q.id === id);
      if (quote && quote.translations && quote.translations[targetLang]) {
        return quote.translations[targetLang];
      }
    }

    return '';
  }

  getTransliteration(id: string, sourceLang: string, readerLang: string): string {
    // Transliteration is only meaningful across different scripts. 
    // If both are latin, we usually don't need it, but the spec wants it.
    
    // 1. Check dynamic words first
    const dynamic = this.dynamicWords[id];
    if (dynamic) {
      if (dynamic.transliterations && dynamic.transliterations[sourceLang] && dynamic.transliterations[sourceLang][readerLang]) {
        return dynamic.transliterations[sourceLang][readerLang];
      }
    }

    // 2. Check static vocab
    if (this.staticVocab) {
      const word = this.staticVocab.words.find((w: any) => w.id === id);
      if (word && word.transliterations && word.transliterations[sourceLang] && word.transliterations[sourceLang][readerLang]) {
        return word.transliterations[sourceLang][readerLang];
      }
    }
    
    return '';
  }

  /**
   * Auto-fill helper for WordEditor. 
   * Returns a best-effort guess for missing fields based on dictionary search.
   */
  async translate(text: string): Promise<TranslationResult | null> {
    await this.init();
    const clean = text.toLowerCase().trim();
    if (!clean) return null;

    let foundWord: any = null;
    
    // Try to find exact match in any translation
    for (const word of this.staticVocab.words) {
      for (const t of Object.values(word.translations)) {
        if (typeof t === 'string' && t.toLowerCase() === clean) {
          foundWord = word;
          break;
        }
      }
      if (foundWord) break;
    }

    if (foundWord) {
        return { ...foundWord.translations };
    }

    return null;
  }
}

export const translator = new Translator();

