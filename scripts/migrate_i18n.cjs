const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../src/lib/data/core/vocabulary.json');
const i18nDir = path.join(__dirname, '../src/lib/data/i18n');

const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
const langs = ['en', 'es', 'ur', 'ar'];

const i18nData = {};
langs.forEach(l => {
    i18nData[l] = JSON.parse(fs.readFileSync(path.join(i18nDir, `${l}.json`), 'utf-8'));
    if (!i18nData[l].transliterations) {
        i18nData[l].transliterations = {};
    }
});

vocab.words.forEach(word => {
    const id = word.id;
    if (word.transliterations) {
        Object.entries(word.transliterations).forEach(([key, value]) => {
            const [sourceLang, targetLang] = key.split('_'); // 'ur', 'en'
            if (i18nData[sourceLang]) {
                if (!i18nData[sourceLang].transliterations[id]) {
                    i18nData[sourceLang].transliterations[id] = {};
                }
                i18nData[sourceLang].transliterations[id][targetLang] = value;
                
                // If target is 'en' (Latin), copy to 'es' as well as a baseline
                if (targetLang === 'en' && i18nData[sourceLang]) {
                    i18nData[sourceLang].transliterations[id]['es'] = value;
                }
            }
        });
        // Remove transliterations from vocabulary.json
        delete word.transliterations;
    }
});

// Save updated i18n files
langs.forEach(l => {
    fs.writeFileSync(path.join(i18nDir, `${l}.json`), JSON.stringify(i18nData[l], null, 2));
});

// Save updated vocabulary.json
fs.writeFileSync(vocabPath, JSON.stringify(vocab, null, 2));
console.log('Migration complete!');
