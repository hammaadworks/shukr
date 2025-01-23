import type { AppConfig } from '../hooks/useAppConfig';

/**
 * The Data Assembler is responsible for merging core structure with 
 * language-specific translation packs.
 */
export const dataAssembler = {
  /**
   * Dynamically imports and merges data components into a full AppConfig.
   */
  async assemble(primaryLang: string, secondaryLang: string): Promise<AppConfig> {
    try {
      // 1. Import Core Data dynamically (Vite handles this flawlessly)
      const [settingsMod, structureMod, doodlesMod] = await Promise.all([
        import('./data/core/settings.json'),
        import('./data/core/vocabulary.json'),
        import('./data/core/doodle.json')
      ]);

      // Handle default exports from JSON modules
      const settings = settingsMod.default || settingsMod;
      const structure = structureMod.default || structureMod;
      const doodles = doodlesMod.default || doodlesMod;

      // 2. Import Language Packs with fallback to English
      const [primaryMod, secondaryMod] = await Promise.all([
        import(`./data/i18n/${primaryLang}.json`).catch(() => import('./data/i18n/en.json')),
        import(`./data/i18n/${secondaryLang}.json`).catch(() => import('./data/i18n/en.json'))
      ]);

      const primaryPack = primaryMod.default || primaryMod;
      const secondaryPack = secondaryMod.default || secondaryMod;

      // 3. Define Fixed Categories
      const fixedCategories = [
        { id: 'favorite', icon: 'star', order: 0, isSystem: true },
        { id: 'family', icon: 'users', order: 1, isSystem: false },
        { id: 'general', icon: 'grid', order: 2, isSystem: true }
      ];

      const mergedCategories = fixedCategories.map((cat: any) => {
        const primaryText = primaryPack.categories?.[cat.id] || secondaryPack.categories?.[cat.id] || cat.id;
        const secondaryText = secondaryPack.categories?.[cat.id] || primaryPack.categories?.[cat.id] || cat.id;
        
        let items = [];
        if (cat.id === 'favorite') {
          items = (structure.words || []).filter((w: any) => (settings.favorites || []).includes(w.id));
        } else if (cat.id === 'family') {
          items = (structure.words || []).filter((w: any) => (settings.family || []).includes(w.id));
        } else {
          // General: everything else (or all words as per user request?)
          // "general (all words come here)" -> let's include everything in general for now.
          items = (structure.words || []);
        }

        return {
          ...cat,
          label_primary: primaryText,
          label_secondary: secondaryText,
          items: items.map((w: any) => {
            const primaryWordText = primaryPack.words[w.id] || secondaryPack.words[w.id] || w.id;
            const secondaryWordText = secondaryPack.words[w.id] || primaryPack.words[w.id] || w.id;
            return {
              ...w,
              text_primary: primaryWordText,
              text_secondary: secondaryWordText,
              // Legacy support
              ur: primaryPack.words[w.id] || secondaryPack.words[w.id],
              en: secondaryPack.words[w.id] || primaryPack.words[w.id],
              transliterations: w.transliterations || {}
            };
          })
        };
      });

      const mergedQuotes = structure.quotes.map((q: any) => {
        const primaryText = primaryPack.quotes[q.id] || secondaryPack.quotes[q.id] || q.id;
        const secondaryText = secondaryPack.quotes[q.id] || primaryPack.quotes[q.id] || q.id;
        return {
          ...q,
          text_primary: primaryText,
          text_secondary: secondaryText,
          // Legacy support
          ur: primaryPack.quotes[q.id] || secondaryPack.quotes[q.id],
          en: secondaryPack.quotes[q.id] || primaryPack.quotes[q.id]
        };
      });

      // 4. Merge Translations for Doodles
      const mergedDoodles = doodles.map((d: any) => {
        const wordId = d.wordId || d.id;
        const primaryText = primaryPack.words[wordId] || secondaryPack.words[wordId] || wordId;
        const secondaryText = secondaryPack.words[wordId] || primaryPack.words[wordId] || wordId;
        return {
          ...d,
          text_primary: primaryText,
          text_secondary: secondaryText,
          // Legacy support
          label: primaryText,
          ur: primaryPack.words[wordId] || secondaryPack.words[wordId],
          en: secondaryPack.words[wordId] || primaryPack.words[wordId]
        };
      });

      return {
        ...settings,
        categories: mergedCategories,
        quotes: mergedQuotes,
        doodles: mergedDoodles,
        sketches: mergedDoodles // Keep for backward compatibility
      };
    } catch (err) {
      console.error('[DataAssembler] Failed to assemble data:', err);
      throw err;
    }
  }
};
