const fs = require('fs');
const path = require('path');

// Usage: node scripts/add-word.cjs --en=Apple --ur=سیب --es=Manzana --ar=تفاحة --hi=सेब --fr=Pomme --zh=苹果 --icon=smile --doodle_shapes=circle,fruit

const args = process.argv.slice(2);
const params = {};
args.forEach(arg => {
  const [key, value] = arg.split('=');
  if (key.startsWith('--')) {
    params[key.substring(2)] = value;
  }
});

const LANGS = ["en", "es", "ur", "ar", "hi", "zh", "fr"];

if (!params.en) {
  console.error("Error: --en is required parameter.");
  console.log("Usage: node scripts/add-word.cjs --en=Apple --ur=سیب --es=Manzana --ar=تفاحة --hi=सेب --fr=Pomme --zh=苹果 --icon=smile --doodle_shapes=circle,fruit");
  process.exit(1);
}

// Generate ID from English
const id = params.id || params.en.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '_');

const vocabPath = path.join(__dirname, '../src/lib/data/core/vocabulary.json');

const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
const exists = vocab.words.find(w => w.id === id);
if (exists) {
  console.error(`Error: Word with id '${id}' already exists.`);
  process.exit(1);
}

const translations = {};
LANGS.forEach(lang => {
  translations[lang] = params[lang] || params.en;
});

// Basic phonetic placeholder for new manual entries
const transliterations = {};
LANGS.forEach(from => {
  transliterations[from] = {};
  LANGS.forEach(to => {
    if (from === to) return;
    transliterations[from][to] = translations[from].toLowerCase(); 
  });
});

const shapes = (params.doodle_shapes || params.tags || '').split(',').map(t => t.trim()).filter(t => t);
while (shapes.length < 5) shapes.push('simple');

vocab.words.push({
  id: id,
  icon: params.icon || 'star',
  next: [],
  usageCount: 0,
  lastUsedAt: 0,
  timeBias: [],
  doodle_shapes: shapes.slice(0, 10),
  translations: translations,
  transliterations: transliterations
});

fs.writeFileSync(vocabPath, JSON.stringify(vocab, null, 2));
console.log(`[+] Added '${id}' to vocabulary.json with strict schema.`);
