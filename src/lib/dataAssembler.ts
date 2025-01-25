import type { AppConfig } from '../hooks/useAppConfig';
import { universeDb } from './universeDb';

/**
 * The Data Assembler is responsible for preparing the AppConfig 
 * using the centralized vocabulary and settings.
 */
export const dataAssembler = {
  /**
   * Dynamically imports and prepares data components into a full AppConfig.
   */
  async assemble(primaryLang: string, secondaryLang: string): Promise<AppConfig> {
    try {
      // 1. Fetch Dynamic Settings from IndexedDB
      const dbSettingsItems = await universeDb.settings.toArray();
      let dynamicSettings: Record<string, any> = {};
      dbSettingsItems.forEach(item => {
        dynamicSettings[item.key] = item.value;
      });

      // 2. Import Core Data dynamically (Fallback & Data Sources)
      const [settingsMod, vocabMod, quotesMod, doodlesMod, vpMod] = await Promise.all([
        import('./data/core/settings.json'),
        import('./data/core/vocabulary.json'),
        import('./data/core/quotes.json'),
        import('./data/core/doodle.json'),
        import('./data/core/voiceProfiles.json').catch(() => ({ default: [] }))
      ]);

      const staticSettings: any = settingsMod.default || settingsMod;
      const defaultVoiceProfiles: any[] = vpMod.default || vpMod || [];
      
      // Merge dynamic over static settings
      const settings: any = {
        ...staticSettings,
        ...dynamicSettings
      };

      const dbVoiceProfiles = await universeDb.voiceProfiles.toArray();
      if (dbVoiceProfiles.length > 0) {
        settings.voiceProfiles = dbVoiceProfiles;
      } else {
        settings.voiceProfiles = defaultVoiceProfiles;
      }

      // Seed settings DB if empty
      if (dbSettingsItems.length === 0) {
        const seedData = Object.keys(staticSettings)
          .filter(k => k !== 'voiceProfiles')
          .map(k => ({ key: k, value: staticSettings[k] }));
        await universeDb.settings.bulkPut(seedData);

        if (defaultVoiceProfiles && defaultVoiceProfiles.length > 0) {
          await universeDb.voiceProfiles.bulkPut(defaultVoiceProfiles);
        }
      }

      const vocab: any = vocabMod.default || vocabMod;
      const quotes = quotesMod.default || quotesMod;
      const doodles = doodlesMod.default || doodlesMod;

      const wordsArray = (vocab.words || []).filter(Boolean).map((w: any) => ({
        ...w,
        ur: w?.ur || w?.translations?.ur || '',
        en: w?.en || w?.translations?.en || '',
        roman: w?.roman || w?.transliterations?.ur?.en || ''
      }));

      // Define standard categories if they don't exist
      const baseCategories = settings.categories || [
        { id: 'favorite', translations: { ur: 'پسندیدہ', en: 'Favorite' }, icon: 'heart', order: 0, isSystem: true },
        { id: 'family', translations: { ur: 'خاندان', en: 'Family' }, icon: 'users', order: 1, isSystem: true },
        { id: 'general', translations: { ur: 'عام', en: 'General' }, icon: 'layout-grid', order: 2, isSystem: true }
      ];

      // 3. Prepare Categories
      const mergedCategories = baseCategories.map((cat: any) => {
        const translations = cat.translations || {};
        const primaryText = translations[primaryLang] || translations[secondaryLang] || translations['en'] || cat.id;
        const secondaryText = translations[secondaryLang] || translations[primaryLang] || translations['en'] || cat.id;
        
        let items: any[] = [];
        if (cat.id === 'favorite') {
          items = wordsArray.filter((w: any) => ((settings.favorites || []) as string[]).includes(w.id));
        } else if (cat.id === 'family') {
          items = wordsArray.filter((w: any) => ((settings.family || []) as string[]).includes(w.id));
        } else {
          items = wordsArray.filter((w: any) => 
            w.category === cat.id || 
            w.categoryId === cat.id ||
            (w.doodle_shapes && w.doodle_shapes.includes(cat.id))
          );
          
          if (cat.id === 'general' && items.length === 0) {
            items = wordsArray.slice(0, 100); 
          }
        }

        return {
          ...cat,
          label_primary: primaryText,
          label_secondary: secondaryText,
          items: items.map((w: any) => {
            const wTrans = w?.translations || {};
            const primaryWordText = wTrans[primaryLang] || wTrans[secondaryLang] || wTrans['en'] || w?.id;
            const secondaryWordText = wTrans[secondaryLang] || wTrans[primaryLang] || wTrans['en'] || w?.id;
            return {
              ...w,
              text_primary: primaryWordText,
              text_secondary: secondaryWordText,
              ur: wTrans['ur'] || primaryWordText,
              en: wTrans['en'] || secondaryWordText,
              roman: w?.transliterations?.[primaryLang]?.[secondaryLang] || w?.transliterations?.[primaryLang]?.['en'] || w?.roman || '',
              transliterations: w?.transliterations || {}
            };
          })
        };
      });

      // 4. Prepare Quotes
      const mergedQuotes = (quotes || []).map((q: any) => {
        const qTrans = q?.translations || {};
        const primaryText = qTrans[primaryLang] || qTrans[secondaryLang] || qTrans['en'] || q?.id;
        const secondaryText = qTrans[secondaryLang] || qTrans[primaryLang] || qTrans['en'] || q?.id;
        return {
          ...q,
          text_primary: primaryText,
          text_secondary: secondaryText,
          ur: qTrans['ur'] || primaryText,
          en: qTrans['en'] || secondaryText
        };
      });

      // 5. Prepare Doodles
      const mergedDoodles = (doodles || []).map((d: any) => {
        const wordId = d.wordId || d.id;
        const word = wordsArray.find((w: any) => w.id === wordId);
        const translations: any = word ? (word.translations || {}) : {};
        const primaryText = word ? (translations[primaryLang] || translations['en'] || wordId) : wordId;
        const secondaryText = word ? (translations[secondaryLang] || translations['en'] || wordId) : wordId;
        return {
          ...d,
          text_primary: primaryText,
          text_secondary: secondaryText,
          label: primaryText,
          ur: translations['ur'] || primaryText,
          en: translations['en'] || secondaryText
        };
      });

      return {
        ...settings,
        categories: mergedCategories,
        quotes: mergedQuotes,
        doodles: mergedDoodles,
        gesture_map: settings.gesture_map || {}
      } as AppConfig;
    } catch (err) {
      console.error('[DataAssembler] Failed to assemble data:', err);
      throw err;
    }
  }
};
