const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../src/lib/data/core/vocabulary.json');
const settingsPath = path.join(__dirname, '../src/lib/data/core/settings.json');

const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

settings.family = settings.family || [];

let familyCount = 0;

vocab.words.forEach(word => {
  if (word.category === 'khandan' || word.category === 'family') {
    if (!settings.family.includes(word.id)) {
      settings.family.push(word.id);
    }
    familyCount++;
  }
  // Remove category key completely
  delete word.category;
});

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
fs.writeFileSync(vocabPath, JSON.stringify(vocab, null, 2));

console.log(`Migrated ${familyCount} family words. Removed 'category' from all words.`);
