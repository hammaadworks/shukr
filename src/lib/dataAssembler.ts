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
      const [metadataMod, structureMod, sketchesMod] = await Promise.all([
        import('./data/core/metadata.json'),
        import('./data/core/structure.json'),
        import('./data/core/sketches.json')
      ]);

      // Handle default exports from JSON modules
      const metadata = metadataMod.default || metadataMod;
      const structure = structureMod.default || structureMod;
      const sketches = sketchesMod.default || sketchesMod;

      // 2. Import Language Packs with fallback to English
      const [primaryMod, secondaryMod] = await Promise.all([
        import(`./data/i18n/${primaryLang}.json`).catch(() => import('./data/i18n/en.json')),
        import(`./data/i18n/${secondaryLang}.json`).catch(() => import('./data/i18n/en.json'))
      ]);

      const primaryPack = primaryMod.default || primaryMod;
      const secondaryPack = secondaryMod.default || secondaryMod;

      // 3. Merge Translations into Structure
      const mergedCategories = structure.categories.map((cat: any) => {
        const primaryText = primaryPack.categories[cat.id] || secondaryPack.categories[cat.id] || cat.id;
        const secondaryText = secondaryPack.categories[cat.id] || primaryPack.categories[cat.id] || cat.id;
        
        return {
          ...cat,
          label_primary: primaryText,
          label_secondary: secondaryText,
          // Legacy support
          label_ur: primaryPack.categories[cat.id] || secondaryPack.categories[cat.id],
          label_en: secondaryPack.categories[cat.id] || primaryPack.categories[cat.id],
          items: (structure.words || [])
            .filter((w: any) => w.category === cat.id)
            .map((w: any) => {
              const primaryWordText = primaryPack.words[w.id] || secondaryPack.words[w.id] || w.id;
              const secondaryWordText = secondaryPack.words[w.id] || primaryPack.words[w.id] || w.id;
              return {
                ...w,
                text_primary: primaryWordText,
                text_secondary: secondaryWordText,
                // Legacy support
                ur: primaryPack.words[w.id] || secondaryPack.words[w.id],
                en: secondaryPack.words[w.id] || primaryPack.words[w.id]
              };
            })
        };
      });

      const mergedQuickActions = structure.quick_actions.map((qa: any) => {
        const primaryText = primaryPack.quick_actions[qa.id] || secondaryPack.quick_actions[qa.id] || qa.id;
        const secondaryText = secondaryPack.quick_actions[qa.id] || primaryPack.quick_actions[qa.id] || qa.id;
        return {
          ...qa,
          text_primary: primaryText,
          text_secondary: secondaryText,
          // Legacy support
          ur: primaryPack.quick_actions[qa.id] || secondaryPack.quick_actions[qa.id],
          en: secondaryPack.quick_actions[qa.id] || primaryPack.quick_actions[qa.id]
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

      return {
        ...metadata,
        categories: mergedCategories,
        quick_actions: mergedQuickActions,
        quotes: mergedQuotes,
        sketches
      };
    } catch (err) {
      console.error('[DataAssembler] Failed to assemble data:', err);
      throw err;
    }
  }
};
