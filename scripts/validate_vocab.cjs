const fs = require('fs');
const path = require('path');

const VOCAB_PATH = path.join(__dirname, '../src/lib/data/core/vocabulary.json');
const LANGS = ["en", "es", "ur", "ar", "hi", "zh", "fr"];

const SCRIPTS = {
  en: /^[a-zA-Z0-9\s.,!?'"-]+$/,
  es: /^[a-zA-Z0-9\s.,!?'"áéíóúüñÁÉÍÓÚÜÑ-]+$/,
  fr: /^[a-zA-Z0-9\s.,!?'"àâçéèêëîïôûùÀÂÇÉÈÊËÎÏÔÛÙ-]+$/,
  ur: /^[\u0600-\u06FF\s.,!؟]+$/,
  ar: /^[\u0600-\u06FF\s.,!؟]+$/,
  hi: /^[\u0900-\u097F\s.,!|]+$/,
  zh: /^[\u4E00-\u9FFF\s.,!？]+$/
};

function validate() {
    console.log("🔍 Validating Vocabulary Integrity...");
    const data = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf8'));
    let errors = 0;

    data.words.forEach(w => {
        // 1. Translations Check
        LANGS.forEach(l => {
            if (!w.translations[l]) { console.error(`❌ Word ${w.id}: Missing translation for ${l}`); errors++; }
            if (l !== 'en' && !SCRIPTS[l].test(w.translations[l])) {
                // If it contains Latin but should be something else, it's a leak
                if (/[a-zA-Z]/.test(w.translations[l]) && ['ur', 'ar', 'hi', 'zh'].includes(l)) {
                    console.error(`❌ Word ${w.id}: Script leak in ${l} translation ("${w.translations[l]}")`);
                    errors++;
                }
            }
        });

        // 2. Transliterations Check
        LANGS.forEach(from => {
            LANGS.forEach(to => {
                if (from === to) return;
                const val = w.transliterations[from] ? w.transliterations[from][to] : null;
                if (!val) { console.error(`❌ Word ${w.id}: Missing transliteration ${from}->${to}`); errors++; }
                if (val === w.translations[from]) { console.error(`❌ Word ${w.id}: Lazy copy ${from}->${to}`); errors++; }
                if (!SCRIPTS[to].test(val) && ['ur', 'ar', 'hi', 'zh'].includes(to)) {
                     console.error(`❌ Word ${w.id}: Script violation in ${from}->${to} transliteration ("${val}")`);
                     errors++;
                }
            });
        });

        // 3. Doodle Shapes Check
        if (!w.doodle_shapes || w.doodle_shapes.length < 5) { console.error(`❌ Word ${w.id}: Insufficient shapes (${w.doodle_shapes ? w.doodle_shapes.length : 0})`); errors++; }
    });

    if (errors === 0) {
        console.log(`✅ Success! 0 errors found in ${data.words.length} words.`);
    } else {
        console.error(`🛑 Failed! Found ${errors} validation errors.`);
        process.exit(1);
    }
}

validate();
