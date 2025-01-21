const fs = require('fs');
const path = require('path');

// Usage: node scripts/add-word.cjs --id=apple --en=Apple --ur=سیب --es=Manzana --ar=تفاحة --icon=smile --category=general --isFamily=true

const args = process.argv.slice(2);
const params = {};
args.forEach(arg => {
  const [key, value] = arg.split('=');
  if (key.startsWith('--')) {
    params[key.substring(2)] = value;
  }
});

if (!params.id || !params.en) {
  console.error("Error: --id and --en are required parameters.");
  console.log("Usage: node scripts/add-word.cjs --id=apple --en=Apple --ur=سیب --es=Manzana --ar=تفاحة --icon=smile --category=general --isFamily=true");
  process.exit(1);
}

const id = params.id;
const category = params.category || 'general';
const isFamily = params.isFamily === 'true';

const vocabPath = path.join(__dirname, '../src/lib/data/core/vocabulary.json');
const settingsPath = path.join(__dirname, '../src/lib/data/core/settings.json');
const i18nDir = path.join(__dirname, '../src/lib/data/i18n');

// 1. Update Vocabulary (Core Structure)
const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
const exists = vocab.words.find(w => w.id === id);
if (exists) {
  console.error(`Error: Word with id '${id}' already exists.`);
  process.exit(1);
}

vocab.words.push({
  id: id,
  icon: params.icon || 'star',
  next: [],
  tags: [],
  type: 'word',
  usageCount: 0,
  lastUsedAt: 0,
  timeBias: []
});
fs.writeFileSync(vocabPath, JSON.stringify(vocab, null, 2));
console.log(`[+] Added ${id} to vocabulary.json`);

// 2. Update Settings (Family Category)
if (isFamily) {
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  if (!settings.family) settings.family = [];
  if (!settings.family.includes(id)) {
    settings.family.push(id);
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log(`[+] Added ${id} to settings.json family array`);
  }
}

// 3. Update i18n Files
const langs = ['en', 'es', 'ur', 'ar'];
langs.forEach(lang => {
  const filePath = path.join(i18nDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Add Translation
    if (params[lang]) {
      data.words[id] = params[lang];
    } else {
      // Fallback to English if translation missing
      data.words[id] = params.en;
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`[+] Updated ${lang}.json for ${id}`);
  }
});

console.log(`\nSuccess! Successfully injected '${id}' across the Data Universe.`);
